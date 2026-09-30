/**
 * Servicios ({{ services.yeso }}, {{ services.reformas }}, {{ services.gremios }}),
 * leídos de contenido/servicios.json. Se editan en /admin → «Servicios».
 * Solo deben figurar servicios que se presten realmente.
 */
import { getServices } from "../_lib/data.js";

export default () => getServices();