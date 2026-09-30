/**
 * Genera la imagen para redes sociales (Open Graph, 1200×630) y el icono
 * para iOS (apple-touch-icon, 180×180) a partir de SVG tipográficos.
 *
 * Uso: npm run og
 *
 * Los archivos resultantes se guardan en src/assets/ y se versionan con el
 * proyecto, así que solo hace falta ejecutarlo si cambian el nombre, el
 * teléfono o el eslogan (y una vez al año, por los años de oficio). Los textos
 * se leen de src/_data/contenido/empresa.json.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getSite } from "../src/_lib/site.js";

const site = getSite();

const root = path.resolve(import.meta.dirname, "..");
const font = "Manrope, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const escapeXml = (value) =>
  String(value).replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]);

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#2b2a27"/>
  <rect x="820" y="0" width="380" height="630" fill="#e6dccb"/>
  <rect x="860" y="0" width="340" height="630" fill="#f0eadf"/>
  <rect x="900" y="0" width="300" height="630" fill="#f7f4ee"/>
  <g font-family="${font}">
    <text x="80" y="150" font-size="26" font-weight="700" letter-spacing="5" fill="#f5a598">YESO · REFORMAS · JAÉN</text>
    <text x="80" y="265" font-size="84" font-weight="800" letter-spacing="-2" fill="#f7f4ee">${escapeXml(site.shortName)}</text>
    <text x="80" y="340" font-size="84" font-weight="800" letter-spacing="-2" fill="#f7f4ee">S.L.</text>
    <rect x="80" y="385" width="96" height="6" rx="3" fill="#f08070"/>
    <text x="80" y="455" font-size="36" font-weight="600" fill="#d7d0c3">${escapeXml(site.tagline)}</text>
    <text x="80" y="505" font-size="28" font-weight="500" fill="#d7d0c3">${site.founder.yearsExperience} años de oficio · Jaén y Andalucía</text>
    <text x="80" y="565" font-size="30" font-weight="700" fill="#f7f4ee">Tel. y WhatsApp ${escapeXml(site.phone.display)}</text>
    <text x="1030" y="365" text-anchor="middle" font-size="150" font-weight="800" letter-spacing="-6" fill="#2b2a27">RM</text>
    <rect x="975" y="400" width="110" height="8" rx="4" fill="#1f4f9c"/>
  </g>
</svg>`;

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#2b2a27"/>
  <text x="32" y="40" text-anchor="middle" font-family="${font}" font-size="26" font-weight="800" letter-spacing="-1" fill="#f7f4ee">RM</text>
  <rect x="19" y="46" width="26" height="3" rx="1.5" fill="#f08070"/>
</svg>`;

const ogOut = path.join(root, "src/assets/img/og/og-rafael-maderas.jpg");
const iconOut = path.join(root, "src/assets/apple-touch-icon.png");
fs.mkdirSync(path.dirname(ogOut), { recursive: true });

await sharp(Buffer.from(ogSvg)).jpeg({ quality: 86, mozjpeg: true }).toFile(ogOut);
await sharp(Buffer.from(iconSvg)).png({ compressionLevel: 9 }).toFile(iconOut);

console.log(`Imagen Open Graph: ${path.relative(root, ogOut)}`);
console.log(`Icono iOS:         ${path.relative(root, iconOut)}`);
