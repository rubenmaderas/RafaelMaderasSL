import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Image from "@11ty/eleventy-img";
import * as esbuild from "esbuild";
import { clearContentCache } from "./src/_lib/content.js";
import { getImages } from "./src/_lib/data.js";
import { COOKIE_CONSENT, PENDING_MARK, SITE_URL } from "./src/_lib/site.js";
import {
  applyTokens,
  renderHighlight,
  renderMarkdown,
  renderMarkdownInline,
  tokenValues,
} from "./src/_lib/text.js";

// JavaScript: URL pública → archivo fuente. Se publica minificado y con ?v=hash (cache busting).
const JS_SOURCES = {
  "/assets/js/main.js": "src/assets/js/main.js",
  "/assets/js/consent.js": "src/assets/js/consent.js",
  "/admin/cms.js": "src/admin/cms.js",
};

// CSS: se minifica y se incrusta en cada página (<style>) para no bloquear el renderizado.
// Los estilos del aviso de cookies solo se añaden si está activado en src/_lib/site.js.
const CSS_SOURCES = [
  "src/assets/css/main.css",
  ...(COOKIE_CONSENT.enabled ? ["src/assets/css/consent.css"] : []),
];

// La fuente no se versiona para que la URL del <link rel="preload"> coincida con la del CSS.
// Si se cambia la fuente, renombra el archivo de destino.
const FONT_SOURCE = "node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2";

const cspHash = (text) => `sha256-${crypto.createHash("sha256").update(text, "utf8").digest("base64")}`;

const hashCache = new Map();
function fileHash(file) {
  if (!hashCache.has(file)) {
    const content = fs.readFileSync(file);
    hashCache.set(file, crypto.createHash("sha256").update(content).digest("hex").slice(0, 10));
  }
  return hashCache.get(file);
}

// CSS minificado (se recalcula solo si cambia algún archivo fuente).
let cssCache = { key: "", promise: null };
function getInlineCss() {
  const key = CSS_SOURCES.map((file) => `${file}:${fs.statSync(file).mtimeMs}`).join("|");
  if (cssCache.key !== key) {
    const source = CSS_SOURCES.map((file) => fs.readFileSync(file, "utf8")).join("\n");
    const promise = esbuild
      .transform(source, { loader: "css", minify: true })
      .then(({ code }) => {
        const css = code.trim();
        return { code: css, hash: cspHash(css) };
      });
    cssCache = { key, promise };
  }
  return cssCache.promise;
}

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "src/assets/img/og": "assets/img/og",
    "src/assets/favicon.svg": "favicon.svg",
    "src/assets/apple-touch-icon.png": "apple-touch-icon.png",
    [FONT_SOURCE]: "assets/fonts/manrope-latin-wght.woff2",
    // Gestor de contenidos (Decap CMS) autoalojado en /admin/, sin CDN de terceros.
    "src/admin/config.yml": "admin/config.yml",
    "node_modules/decap-cms/dist/*decap-cms.js": "admin",
    "node_modules/netlify-identity-widget/build/netlify-identity-widget.js": "admin/netlify-identity.js",
  });

  eleventyConfig.addWatchTarget("src/assets/");
  eleventyConfig.addWatchTarget("src/admin/");

  eleventyConfig.on("eleventy.before", () => {
    hashCache.clear();
    clearContentCache();
  });

  // Publica el JavaScript minificado (y los estilos de la vista previa del gestor).
  eleventyConfig.on("eleventy.after", async ({ directories }) => {
    const outputDir = directories?.output || "_site";
    await Promise.all(
      Object.entries(JS_SOURCES).map(async ([url, source]) => {
        const { code } = await esbuild.transform(fs.readFileSync(source, "utf8"), {
          loader: "js",
          minify: true,
        });
        const target = path.join(outputDir, url);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, code);
      })
    );
    const { code: css } = await getInlineCss();
    fs.mkdirSync(path.join(outputDir, "admin"), { recursive: true });
    fs.writeFileSync(path.join(outputDir, "admin", "preview.css"), css);
  });

  eleventyConfig.addFilter("asset", (url) => {
    const source = JS_SOURCES[url];
    return source ? `${url}?v=${fileHash(source)}` : url;
  });

  eleventyConfig.addFilter("absoluteUrl", (url) => new URL(url, SITE_URL).href);

  /*
   * Textos editables desde el gestor de contenidos (src/_data/contenido/*.json):
   * - t:         texto plano con comodines ({empresa}, {telefono}, {años}…).
   * - md:        Markdown en bloque (párrafos, listas). Usar con "| safe".
   * - mdi:       Markdown en línea, para textos dentro de <p>, <li>… Usar con "| safe".
   * - highlight: título con una palabra entre *asteriscos* resaltada. Usar con "| safe".
   * El HTML escrito en los textos se muestra como texto: no puede romper la página.
   */
  eleventyConfig.addFilter("t", (value) => applyTokens(value).trim());
  eleventyConfig.addFilter("md", (value) => renderMarkdown(value));
  eleventyConfig.addFilter("mdi", (value) => renderMarkdownInline(value));
  eleventyConfig.addFilter("highlight", (value) => renderHighlight(value));

  // JSON seguro para incrustar en <script type="application/ld+json">.
  eleventyConfig.addFilter("jsonLd", (value) =>
    JSON.stringify(value, null, 2).replace(/</g, "\\u003c")
  );

  // Resalta visualmente los datos legales que faltan por completar.
  eleventyConfig.addFilter("legalValue", (value) => {
    const text = String(value ?? "");
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return text.includes(PENDING_MARK) ? `<mark class="pending">${escaped}</mark>` : escaped;
  });

  eleventyConfig.addFilter("isoDate", (date) => new Date(date).toISOString().slice(0, 10));

  eleventyConfig.addGlobalData("buildYear", new Date().getFullYear());
  // Fecha de cada página = última modificación de su archivo fuente (lastmod del sitemap).
  eleventyConfig.addGlobalData("date", "Last Modified");

  // Único script en línea: marca que JS está disponible antes de pintar (evita saltos
  // de maquetación en el menú móvil). Su hash va en la CSP de cada página.
  const inlineScript = "document.documentElement.classList.add('js')";
  const inlineScriptHash = cspHash(inlineScript);
  eleventyConfig.addGlobalData("inlineScript", { code: inlineScript, hash: inlineScriptHash });

  // Hoja de estilos minificada e incrustada: {% inlineCss %}
  eleventyConfig.addAsyncShortcode("inlineCss", async () => {
    const { code } = await getInlineCss();
    return `<style>${code}</style>`;
  });

  /*
   * Content-Security-Policy, en dos partes que se aplican a la vez:
   * - {% cspMeta %}: <meta> en cada página con la política completa, incluidos los hashes
   *   del script y del CSS en línea. Viaja dentro del HTML, así que nunca se desincroniza
   *   aunque se suban solo algunas páginas.
   * - cspHeader: directivas que <meta> no admite (frame-ancestors…) y otras comunes a toda
   *   la web, para _headers (Netlify/Cloudflare) y .htaccess (Apache). Es deliberadamente
   *   corta porque también se aplica a /admin/, que define su propia política en <meta>
   *   (el gestor de contenidos necesita permisos distintos; ver src/admin/index.njk).
   * Si se añaden servicios de terceros (analítica, mapas, vídeos…), amplía CSP_SOURCES.
   */
  const CSP_SOURCES = [
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  eleventyConfig.addAsyncShortcode("cspMeta", async () => {
    const { hash: inlineCssHash } = await getInlineCss();
    const policy = [
      "default-src 'self'",
      `script-src 'self' '${inlineScriptHash}'`,
      `style-src 'self' '${inlineCssHash}'`,
      ...CSP_SOURCES,
    ].join("; ");
    return `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
  });

  eleventyConfig.addGlobalData(
    "cspHeader",
    [
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ")
  );

  // Valores actuales de los comodines, para la vista previa del gestor de contenidos.
  eleventyConfig.addShortcode("cmsTokens", () =>
    JSON.stringify(tokenValues()).replace(/</g, "\\u003c")
  );

  /**
   * Imagen optimizada desde el catálogo central (src/_data/contenido/imagenes.json,
   * editable en /admin → «Fotos de la web»).
   * Uso: {% image "hero_yeso", "(min-width: 64em) 50vw, 100vw", { eager: true } %}
   */
  eleventyConfig.addAsyncShortcode("image", async function (key, sizes = "100vw", options = {}) {
    const entry = getImages()[key];
    if (!entry || !entry.file) {
      throw new Error(`[image] No existe la imagen "${key}" en src/_data/contenido/imagenes.json`);
    }

    const source = path.join("src/assets/img/originals", entry.file);
    if (!fs.existsSync(source)) {
      throw new Error(`[image] No se encuentra el archivo ${source} (imagen "${key}")`);
    }
    // Nombre de archivo estable por hueco de imagen: hero-yeso-<hash>-<ancho>.<formato>
    const slug = key.replace(/_/g, "-");
    const metadata = await Image(source, {
      widths: options.widths || [480, 640, 960, 1280, 1600],
      formats: ["avif", "webp", "jpeg"],
      outputDir: "_site/assets/img/",
      urlPath: "/assets/img/",
      filenameFormat: (id, src, width, format) => `${slug}-${id}-${width}.${format}`,
      sharpJpegOptions: { quality: 74, progressive: true, mozjpeg: true },
      sharpWebpOptions: { quality: 72 },
      sharpAvifOptions: { quality: 52 },
    });

    const attributes = {
      alt: entry.alt,
      sizes,
      loading: options.eager ? "eager" : "lazy",
      decoding: "async",
    };
    if (options.eager) attributes.fetchpriority = "high";
    if (options.imgClass) attributes.class = options.imgClass;

    const picture = Image.generateHTML(metadata, attributes);
    const figureClass = ["media", options.class].filter(Boolean).join(" ");
    const note = entry.ilustrativa
      ? `<figcaption class="media__note">Imagen ilustrativa</figcaption>`
      : "";

    return `<figure class="${figureClass}">${picture}${note}</figure>`;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
