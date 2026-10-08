import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Image from "@11ty/eleventy-img";
import * as esbuild from "esbuild";
import sitemap from "@quasibit/eleventy-plugin-sitemap";
import { clearContentCache } from "./src/_lib/content.js";
import { getImages } from "./src/_lib/data.js";
import { getSite, PENDING_MARK, SITE_URL } from "./src/_lib/site.js";
import {
  applyTokens,
  renderHighlight,
  renderMarkdown,
  renderMarkdownInline,
  renderMarkdownInlineLabel,
  tokenValues,
} from "./src/_lib/text.js";

// JavaScript: URL pública → archivo fuente. Se publica minificado y con ?v=hash (cache busting).
const JS_SOURCES = {
  "/assets/js/main.js": "src/assets/js/main.js",
  "/assets/js/consent.js": "src/assets/js/consent.js",
  "/assets/js/analytics.js": "src/assets/js/analytics.js",
  "/admin/cms.js": "src/admin/cms.js",
};

// CSS: se minifica y se incrusta en cada página (<style>) para no bloquear el renderizado.
// Los estilos del aviso de cookies solo se añaden si el aviso está activo (src/_lib/site.js).
function cssSources() {
  return [
    "src/assets/css/main.css",
    ...(getSite().cookieConsent.enabled ? ["src/assets/css/consent.css"] : []),
  ];
}

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
  const sources = cssSources();
  const key = sources.map((file) => `${file}:${fs.statSync(file).mtimeMs}`).join("|");
  if (cssCache.key !== key) {
    const source = sources.map((file) => fs.readFileSync(file, "utf8")).join("\n");
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

/*
 * Único script en línea, que se ejecuta antes de pintar la página (su hash va en la CSP):
 * - marca que hay JavaScript, para evitar saltos de maquetación en el menú móvil;
 * - con el aviso de cookies activo, lo muestra desde el primer pintado si el visitante
 *   aún no ha decidido (o su decisión caducó o cambiaron las finalidades), sin esperar a
 *   consent.js y sin que parpadee a quien ya eligió. consent.js hace la comprobación completa.
 */
function inlineScript() {
  const { enabled, storageKey, version, maxAgeDays } = getSite().cookieConsent;
  if (!enabled) return "document.documentElement.classList.add('js')";
  return (
    "(function(d){d.classList.add('js');" +
    `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)}));` +
    `if(s&&s.version===${JSON.stringify(version)}&&Date.now()-s.timestamp<${maxAgeDays * 864e5})return}catch(e){}` +
    "d.classList.add('consent-pending')})(document.documentElement)"
  );
}

/*
 * Google Analytics 4 sin funciones publicitarias: dominios que indica Google para la CSP
 * (https://developers.google.com/tag-platform/security/guides/csp). Solo se añaden si hay
 * ID de medición, y aun así el script de Google no se descarga hasta que el visitante acepta.
 */
const GA_CSP = {
  script: ["https://www.googletagmanager.com"],
  img: ["https://www.googletagmanager.com", "https://*.google-analytics.com"],
  connect: ["https://www.googletagmanager.com", "https://*.google-analytics.com", "https://*.google.com"],
};
const NO_EXTRA_CSP = { script: [], img: [], connect: [] };

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: SITE_URL,
    },
  });
  eleventyConfig.addPassthroughCopy({
    "src/assets/img/og": "assets/img/og",
    "src/assets/favicon.svg": "favicon.svg",
    "src/assets/favicon.ico": "favicon.ico",
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
   * - mdiLabel("clase"): como mdi, pero la **negrita** sale como <span class="clase">, para
   *              etiquetas visuales que no son énfasis del texto. Usar con "| safe".
   * - highlight: título con una palabra entre *asteriscos* resaltada. Usar con "| safe".
   * El HTML escrito en los textos se muestra como texto: no puede romper la página.
   */
  eleventyConfig.addFilter("t", (value) => applyTokens(value).trim());
  eleventyConfig.addFilter("md", (value) => renderMarkdown(value));
  eleventyConfig.addFilter("mdi", (value) => renderMarkdownInline(value));
  eleventyConfig.addFilter("mdiLabel", (value, className) => renderMarkdownInlineLabel(value, className));
  eleventyConfig.addFilter("highlight", (value) => renderHighlight(value));

  // Enlace de WhatsApp con un mensaje ya escrito (admite comodines): {{ texto | whatsappHref }}
  eleventyConfig.addFilter("whatsappHref", (message) => {
    const { base, href } = getSite().whatsapp;
    const text = applyTokens(message).trim();
    return text ? `${base}?text=${encodeURIComponent(text)}` : href;
  });

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

  // Script en línea (ver inlineScript() más arriba): {% inlineScript %}
  eleventyConfig.addShortcode("inlineScript", () => `<script>${inlineScript()}</script>`);

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
   * Si se añaden otros servicios de terceros (mapas, vídeos…), amplía la política igual
   * que GA_CSP. Los dominios de Google Analytics se añaden solos cuando está activado.
   */
  eleventyConfig.addAsyncShortcode("cspMeta", async () => {
    const { hash: inlineCssHash } = await getInlineCss();
    const extra = getSite().analytics.gaId ? GA_CSP : NO_EXTRA_CSP;
    const policy = [
      "default-src 'self'",
      ["script-src 'self'", `'${cspHash(inlineScript())}'`, ...extra.script].join(" "),
      `style-src 'self' '${inlineCssHash}'`,
      ["img-src 'self' data:", ...extra.img].join(" "),
      "font-src 'self'",
      ["connect-src 'self'", ...extra.connect].join(" "),
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
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
    const focus = { arriba: "media--focus-top", abajo: "media--focus-low" }[entry.encuadre];
    const figureClass = ["media", options.class, focus].filter(Boolean).join(" ");
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
