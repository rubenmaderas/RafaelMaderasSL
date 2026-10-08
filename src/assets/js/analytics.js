/*
 * Google Analytics 4 — solo se ejecuta si el visitante acepta las cookies de
 * analítica: consent.js lo activa desde un <script type="text/plain"> de base.njk.
 * ---------------------------------------------------------------------------
 * - Modo de consentimiento de Google: todo denegado por defecto y solo se concede
 *   la analítica. Las cookies y los datos con fines publicitarios siguen denegados.
 * - Google Signals y la personalización de anuncios, desactivados.
 * - Cookies con duración de 1 año (data-cookie-expires) en lugar de los 2 por defecto.
 * - Mide los clics en los botones de contacto como eventos:
 *     clic_telefono · clic_whatsapp · clic_correo
 *   con el parámetro «ubicacion»: cabecera, barra_movil, pie, chat o contenido
 *   (en el chat de WhatsApp, también «opcion»: el texto de la opción pulsada).
 *   No se envía el número, el correo ni el mensaje: solo que hubo un clic y dónde.
 */
(() => {
  "use strict";

  const script = document.currentScript;
  const id = script && script.dataset.gaId;
  if (!id || window.rmAnalyticsLoaded) return;
  window.rmAnalyticsLoaded = true;

  window.dataLayer = window.dataLayer || [];
  // gtag.js necesita recibir el objeto «arguments», no un array.
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
  gtag("consent", "update", { analytics_storage: "granted" });
  gtag("set", "ads_data_redaction", true);
  gtag("js", new Date());
  gtag("config", id, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: Number(script.dataset.cookieExpires) || 365 * 24 * 60 * 60,
  });

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.append(tag);

  // Si el visitante retira el consentimiento, se corta el envío al instante con el
  // interruptor oficial de Google (ga-disable-ID), antes de que consent.js recargue la
  // página: así ni siquiera sale el último envío que Google hace al abandonarla.
  document.addEventListener("consentchange", (event) => {
    const choices = event.detail && event.detail.choices;
    if (choices && !choices.analytics) {
      window[`ga-disable-${id}`] = true;
      gtag("consent", "update", { analytics_storage: "denied" });
    }
  });

  /* Clics en los botones de contacto --------------------------------------- */
  const eventName = (href) => {
    if (href.startsWith("tel:")) return "clic_telefono";
    if (href.startsWith("mailto:")) return "clic_correo";
    if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return "clic_whatsapp";
    return "";
  };

  const placement = (link) => {
    if (link.closest("[data-wa-chat]")) return "chat";
    if (link.closest(".site-header")) return "cabecera";
    if (link.closest("[data-mobile-cta]")) return "barra_movil";
    if (link.closest("[data-site-footer]")) return "pie";
    return "contenido";
  };

  document.addEventListener("click", (event) => {
    // Enlaces que no salen de la página (p. ej., el botón de WhatsApp de la barra
    // móvil cuando abre el chat de la web): no son un contacto todavía.
    if (event.defaultPrevented) return;
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!link) return;
    const name = eventName(link.getAttribute("href"));
    if (!name) return;
    const params = { ubicacion: placement(link) };
    // Opción elegida en el chat de WhatsApp (su texto visible, nunca el mensaje).
    if (link.dataset.waOption) params.opcion = link.dataset.waOption;
    gtag("event", name, params);
  });
})();
