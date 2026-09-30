/**
 * Lectura de los contenidos editables (src/_data/contenido/*.json).
 * ---------------------------------------------------------------------------
 * Esos JSON los modifica el gestor de contenidos (/admin) o a mano. Se leen del
 * disco en cada compilación (la caché se vacía en "eleventy.before") para que
 * el servidor de desarrollo nunca muestre datos antiguos.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CONTENT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "_data",
  "contenido"
);

const cache = new Map();

export function clearContentCache() {
  cache.clear();
}

/** @param {string} name Ruta relativa sin extensión: "empresa", "paginas/inicio"… */
export function readContent(name) {
  if (!cache.has(name)) {
    const file = path.join(CONTENT_DIR, `${name}.json`);
    try {
      cache.set(name, JSON.parse(fs.readFileSync(file, "utf8")));
    } catch (error) {
      throw new Error(`[contenido] No se pudo leer ${path.relative(process.cwd(), file)}: ${error.message}`);
    }
  }
  return cache.get(name);
}
