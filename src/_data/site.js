/**
 * Datos del negocio para las plantillas ({{ site.… }}).
 * Los valores editables están en contenido/empresa.json (gestor: /admin →
 * «Datos de la empresa»); los derivados se calculan en src/_lib/site.js.
 */
import { getSite } from "../_lib/site.js";

export default () => getSite();