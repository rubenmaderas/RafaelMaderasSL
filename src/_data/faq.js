/**
 * Preguntas frecuentes, leídas de contenido/preguntas.json (/admin → «Preguntas
 * frecuentes»). El mismo texto genera el HTML visible y el JSON-LD FAQPage, por
 * lo que ambos coinciden siempre palabra por palabra.
 */
import { getFaq } from "../_lib/data.js";

export default () => getFaq();