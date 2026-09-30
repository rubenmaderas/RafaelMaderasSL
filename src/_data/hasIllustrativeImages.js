/** true si alguna imagen es de banco de imágenes (aviso en el pie de página). */
import { getImages } from "../_lib/data.js";

export default () => Object.values(getImages()).some((image) => image.ilustrativa);