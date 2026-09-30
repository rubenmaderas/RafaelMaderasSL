import { SITE_URL } from "../_lib/site.js";

/**
 * Redirecciones 301 hacia la dirección canónica (SITE_URL) para Netlify. Las escribe
 * src/redirects.njk en /_redirects:
 *   - la variante con o sin «www» (Netlify ya la redirige cuando las dos están en Domain
 *     management; así queda fijado en un solo salto, también desde http://);
 *   - la dirección provisional *.netlify.app, que si no seguiría mostrando una copia de la web.
 *
 * Solo se generan al publicar en producción en Netlify y cuando su dominio principal (variable
 * URL) ya es SITE_URL. Antes, la lista queda vacía: así no se redirige a un dominio que todavía
 * no funciona ni se crea un bucle si en Netlify el dominio principal es otro.
 */
export default function () {
  const env = process.env;
  if (env.NETLIFY !== "true" || env.CONTEXT !== "production") return [];

  const netlifyPrimary = String(env.URL || "").replace(/\/+$/, "").toLowerCase();
  if (netlifyPrimary !== SITE_URL.toLowerCase()) {
    console.warn(
      `[redirects] El dominio principal de Netlify (${env.URL || "sin definir"}) no es ${SITE_URL}: ` +
        "no se generan las redirecciones de dominio. Revísalo en Domain management."
    );
    return [];
  }

  const { host } = new URL(SITE_URL);
  const aliases = [host.startsWith("www.") ? host.slice(4) : `www.${host}`];
  if (env.SITE_NAME) aliases.push(`${env.SITE_NAME}.netlify.app`);

  return aliases.flatMap((alias) =>
    ["https", "http"].map((protocol) => ({ from: `${protocol}://${alias}/*`, to: `${SITE_URL}/:splat` }))
  );
}
