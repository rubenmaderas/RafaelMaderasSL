/**
 * Vista previa local de la web COMPILADA (_site/), con el mismo comportamiento que en
 * producción: cabeceras de _headers (CSP, caché…), compresión Brotli/gzip y página 404.
 * Úsala para medir con Lighthouse; el servidor de desarrollo (npm run dev) no comprime,
 * no envía cabeceras de caché e inyecta un script de recarga automática.
 *
 * Uso: npm run preview   (compila y abre http://localhost:8090)
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve("_site");
const PORT = Number(process.env.PORT) || 8090;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".yml": "text/yaml; charset=utf-8",
};

const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".xml", ".txt", ".svg", ".yml"]);
// Archivos ya comprimidos (el gestor de contenidos pesa varios MB y Brotli es lento).
const compressedCache = new Map();

if (!fs.existsSync(path.join(ROOT, "index.html"))) {
  console.error("No existe _site/. Ejecuta primero: npm run build");
  process.exit(1);
}

// Reglas de _headers (formato Netlify / Cloudflare Pages). Se releen si el archivo cambia.
let headerCache = { mtime: 0, rules: [] };
function loadHeaderRules() {
  const file = path.join(ROOT, "_headers");
  if (!fs.existsSync(file)) return [];
  const { mtimeMs } = fs.statSync(file);
  if (mtimeMs === headerCache.mtime) return headerCache.rules;
  const rules = [];
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      const pattern = line.trim().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      rules.push({ test: new RegExp(`^${pattern}$`), headers: [] });
    } else if (rules.length) {
      const index = line.indexOf(":");
      if (index > 0) {
        rules.at(-1).headers.push([line.slice(0, index).trim(), line.slice(index + 1).trim()]);
      }
    }
  }
  headerCache = { mtime: mtimeMs, rules };
  return rules;
}

function resolveFile(urlPath) {
  const filePath = path.join(ROOT, urlPath);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) return null;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    if (!urlPath.endsWith("/")) return { redirect: `${urlPath}/` };
    const index = path.join(filePath, "index.html");
    return fs.existsSync(index) ? { file: index } : null;
  }
  return fs.existsSync(filePath) ? { file: filePath } : null;
}

function send(req, res, status, file) {
  const ext = path.extname(file).toLowerCase();
  const headers = { "Content-Type": TYPES[ext] || "application/octet-stream" };

  const urlPath = new URL(req.url, "http://localhost").pathname;
  for (const rule of loadHeaderRules()) {
    if (rule.test.test(urlPath)) {
      for (const [name, value] of rule.headers) headers[name] = value;
    }
  }
  if (!headers["Cache-Control"]) headers["Cache-Control"] = "public, max-age=0, must-revalidate";

  let body = fs.readFileSync(file);
  if (COMPRESSIBLE.has(ext)) {
    headers.Vary = "Accept-Encoding";
    const accepted = String(req.headers["accept-encoding"] || "");
    const encoding = /\bbr\b/.test(accepted) ? "br" : /\bgzip\b/.test(accepted) ? "gzip" : "";
    if (encoding) {
      const key = `${file}|${fs.statSync(file).mtimeMs}|${encoding}`;
      if (!compressedCache.has(key)) {
        compressedCache.set(
          key,
          encoding === "br" ? zlib.brotliCompressSync(body) : zlib.gzipSync(body, { level: 9 })
        );
      }
      body = compressedCache.get(key);
      headers["Content-Encoding"] = encoding;
    }
  }
  headers["Content-Length"] = body.length;

  res.writeHead(status, headers);
  res.end(req.method === "HEAD" ? undefined : body);
}

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }

  // Igual que en Netlify/Cloudflare: _headers no se publica como archivo.
  const found = urlPath === "/_headers" ? null : resolveFile(urlPath);
  if (found?.redirect) {
    res.writeHead(301, { Location: found.redirect }).end();
  } else if (found?.file) {
    send(req, res, 200, found.file);
  } else {
    send(req, res, 404, path.join(ROOT, "404.html"));
  }
});

server.listen(PORT, () => {
  console.log(`Vista previa de producción: http://localhost:${PORT}/  (Ctrl+C para salir)`);
});
