/**
 * Contenidos normalizados que usan varias partes de la web (plantillas, datos
 * estructurados y el código de imágenes). Se leen de src/_data/contenido/.
 */
import path from "node:path";
import { readContent } from "./content.js";
import { applyTokens, slugify } from "./text.js";

/** Catálogo de imágenes: { clave: { foto, file, alt, ilustrativa, credito } }. */
export function getImages() {
  const data = readContent("imagenes");
  return Object.fromEntries(
    Object.entries(data).map(([key, entry]) => {
      const credit = entry.credito || {};
      return [
        key,
        {
          foto: entry.foto,
          file: path.basename(String(entry.foto || "")),
          alt: String(entry.alt || "").trim(),
          ilustrativa: Boolean(entry.ilustrativa),
          // Los créditos solo se publican para imágenes de banco (ilustrativas).
          credito: entry.ilustrativa && credit.autor ? credit : null,
        },
      ];
    })
  );
}

function withIds(list = []) {
  const seen = new Set();
  return list
    .filter((item) => item && String(item.titulo || "").trim())
    .map((item) => {
      let id = String(item.id || "").trim() || slugify(item.titulo);
      while (seen.has(id)) id = `${id}-2`;
      seen.add(id);
      return { ...item, id };
    });
}

/** Servicios de yeso, tipos de reforma y gremios (con "id" para los anclajes). */
export function getServices() {
  const data = readContent("servicios");
  return {
    yeso: withIds(data.yeso),
    reformas: withIds(data.reformas),
    gremios: withIds(data.gremios),
  };
}

/**
 * Preguntas frecuentes en texto plano, con los comodines ya sustituidos. El mismo
 * texto se usa en el HTML visible y en el JSON-LD FAQPage (coinciden siempre).
 */
export function getFaq() {
  const data = readContent("preguntas");
  return (data.preguntas || [])
    .map((item) => {
      const answer = applyTokens(item.respuesta).trim();
      return {
        question: applyTokens(item.pregunta).trim(),
        answer,
        paragraphs: answer.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean),
      };
    })
    .filter((item) => item.question && item.answer);
}
