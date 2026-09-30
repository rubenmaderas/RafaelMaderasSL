/**
 * Catálogo de imágenes ({{ images.… }}), leído de contenido/imagenes.json.
 * Las fotos se cambian desde el gestor: /admin → «Fotos de la web».
 */
import { getImages } from "../_lib/data.js";

export default () => getImages();