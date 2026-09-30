/**
 * Preguntas frecuentes, leídas de contenido/preguntas.json (/admin → «Preguntas
 * frecuentes») y agrupadas por página: { inicio: [...], servicios: [...], reformas: [...] }.
 * El mismo texto genera el HTML visible y el JSON-LD FAQPage de cada página, por
 * lo que ambos coinciden siempre palabra por palabra.
 */
import { FAQ_PAGES, getFaq } from "../_lib/data.js";

export default () => Object.fromEntries(FAQ_PAGES.map((pagina) => [pagina, getFaq(pagina)]));