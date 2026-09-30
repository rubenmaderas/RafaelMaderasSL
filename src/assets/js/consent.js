/*
 * Aviso de cookies y consentimiento.
 * ---------------------------------------------------------------------------
 * Solo se carga si hay algún servicio que necesite consentimiento: hoy, Google
 * Analytics, cuando tiene su ID en /admin → «Datos de la empresa». Ver README.
 *
 * - Los scripts que necesitan consentimiento se escriben bloqueados y solo se
 *   activan si el visitante acepta su categoría (solo archivos .js propios; la CSP
 *   no permite código en línea):
 *     <script type="text/plain" data-consent="analytics" data-src="/assets/js/…"></script>
 * - La elección se guarda en localStorage (almacenamiento técnico, exento de
 *   consentimiento) con su fecha y la versión de las finalidades. Caduca a los
 *   12 meses, o antes si cambian las finalidades o los proveedores, y entonces se
 *   vuelve a preguntar.
 * - Sin consentimiento válido (rechazado, retirado o caducado) se borran las
 *   cookies de esa categoría que pudieran quedar en el navegador.
 * - Cada elección emite el evento «consentchange» en document; analytics.js lo usa
 *   para dejar de medir al instante si se retira el consentimiento.
 * - El script en línea de <head> muestra el aviso desde el primer pintado
 *   (clase .consent-pending en <html>); aquí se hace la comprobación completa.
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const panel = document.querySelector("[data-consent-panel]");
  if (!panel) return;

  const STORAGE_KEY = panel.dataset.storageKey;
  // Mensaje pendiente de anunciar tras la recarga que sigue a retirar el consentimiento.
  const ANNOUNCE_KEY = `${STORAGE_KEY}-aviso`;
  const VERSION = panel.dataset.version;
  const MAX_AGE_MS = Number(panel.dataset.maxAgeDays) * 24 * 60 * 60 * 1000;
  const categories = (panel.dataset.categories || "").split(/\s+/).filter(Boolean);

  const MESSAGES = {
    accepted: "Has aceptado las cookies de analítica.",
    rejected: "Has rechazado las cookies de analítica.",
    pending: "Todavía no has elegido si aceptas las cookies de analítica.",
    change: "Puedes cambiarlo cuando quieras en «Configurar cookies», al pie de la página.",
  };

  const status = document.querySelector("[data-consent-status]");
  const current = panel.querySelector("[data-consent-current]");
  const closeWrap = panel.querySelector("[data-consent-close-wrap]");
  const heading = panel.querySelector("h2");
  let opener = null;
  let statusTimer = 0;

  /* Almacenamiento de la elección ------------------------------------------ */
  const read = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (
        stored &&
        stored.version === VERSION &&
        stored.choices &&
        typeof stored.timestamp === "number" &&
        Date.now() - stored.timestamp < MAX_AGE_MS
      ) {
        return stored;
      }
    } catch {
      /* almacenamiento bloqueado o dato dañado: se trata como «sin elegir» */
    }
    return null;
  };

  const write = (choices) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, timestamp: Date.now(), choices }));
    } catch {
      /* sin almacenamiento: la elección vale para esta página y se volverá a preguntar */
    }
  };

  const describe = (stored) => {
    if (!stored) return MESSAGES.pending;
    return categories.every((category) => stored.choices[category]) ? MESSAGES.accepted : MESSAGES.rejected;
  };

  /* Cookies y scripts ------------------------------------------------------ */
  // Borra las cookies de una categoría en el dominio actual y en sus dominios
  // superiores (Google Analytics las guarda en .rafaelmaderas.es).
  const purgeCookies = (category) => {
    const patterns = (panel.getAttribute(`data-purge-${category}`) || "").split(/\s+/).filter(Boolean);
    if (!patterns.length || !document.cookie) return;
    const matches = (name) =>
      patterns.some((pattern) => (pattern.endsWith("*") ? name.startsWith(pattern.slice(0, -1)) : name === pattern));
    const names = document.cookie
      .split(";")
      .map((cookie) => cookie.split("=")[0].trim())
      .filter(matches);
    const parts = location.hostname.split(".");
    const domains = [""];
    for (let i = 0; i < parts.length - 1; i += 1) domains.push(`; domain=.${parts.slice(i).join(".")}`);
    names.forEach((name) => {
      domains.forEach((domain) => {
        document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
      });
    });
  };

  const activateScripts = (choices) => {
    document.querySelectorAll('script[type="text/plain"][data-consent]').forEach((placeholder) => {
      if (!choices[placeholder.dataset.consent] || placeholder.dataset.consentActivated) return;
      const script = document.createElement("script");
      Array.from(placeholder.attributes).forEach((attr) => {
        if (!["type", "data-consent", "data-src"].includes(attr.name)) {
          script.setAttribute(attr.name, attr.value);
        }
      });
      script.src = placeholder.dataset.src;
      placeholder.dataset.consentActivated = "true";
      placeholder.after(script);
    });
  };

  /* Estado visible --------------------------------------------------------- */
  const updateState = () => {
    const text = describe(read());
    document.querySelectorAll("[data-consent-state]").forEach((element) => {
      element.textContent = `Estado actual: ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
      element.hidden = false;
    });
  };

  const announce = (message) => {
    if (!status) return;
    clearTimeout(statusTimer);
    status.textContent = "";
    // Pequeña espera para que los lectores de pantalla detecten el cambio.
    statusTimer = setTimeout(() => {
      status.textContent = message;
      statusTimer = setTimeout(() => {
        status.textContent = "";
      }, 10000);
    }, 150);
  };

  /* Abrir y cerrar el aviso ------------------------------------------------ */
  const open = (trigger) => {
    const stored = read();
    opener = trigger || null;
    current.textContent = stored ? describe(stored) : "";
    current.hidden = !stored;
    closeWrap.hidden = !stored;
    root.classList.add("consent-open");
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  };

  const close = () => {
    const returnTo = opener;
    opener = null;
    root.classList.remove("consent-pending", "consent-open");
    if (returnTo && returnTo.isConnected) returnTo.focus({ preventScroll: true });
    return returnTo;
  };

  const decide = (accepted, event) => {
    const previous = read();
    const choices = Object.fromEntries(categories.map((category) => [category, accepted]));
    const hadFocus = panel.contains(document.activeElement);
    write(choices);
    const returnedTo = close();

    categories.forEach((category) => {
      if (!choices[category]) purgeCookies(category);
    });

    // Aviso a los scripts ya activos (analytics.js deja de enviar datos al momento si
    // se retira el consentimiento).
    document.dispatchEvent(new CustomEvent("consentchange", { detail: { choices } }));
    const message = `${describe(read() || { choices })} ${MESSAGES.change}`;

    // Si se retira un consentimiento dado, se recarga la página para detener por
    // completo los scripts que ya estaban funcionando (al recargar ya no se cargan).
    if (previous && categories.some((category) => previous.choices[category] && !choices[category])) {
      try {
        sessionStorage.setItem(ANNOUNCE_KEY, message);
      } catch {
        /* sin almacenamiento de sesión: se recarga sin anunciarlo */
      }
      window.location.reload();
      return;
    }

    activateScripts(choices);
    updateState();
    announce(message);

    // Con teclado, en la primera visita, se sigue por el enlace «Saltar al contenido»,
    // que es lo siguiente en el orden de la página.
    if (hadFocus && !returnedTo && event.detail === 0) {
      const skipLink = document.querySelector(".skip-link");
      if (skipLink) skipLink.focus({ preventScroll: true });
    }
  };

  panel.querySelectorAll("[data-consent-choice]").forEach((button) => {
    button.addEventListener("click", (event) => decide(button.dataset.consentChoice === "accept", event));
  });

  panel.querySelector("[data-consent-close]").addEventListener("click", close);

  document.querySelectorAll("[data-consent-open]").forEach((button) => {
    button.addEventListener("click", () => open(button));
  });

  // Escape cierra el aviso solo si se abrió para revisar una elección ya hecha.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root.classList.contains("consent-open") && read()) close();
  });

  /* Inicio ----------------------------------------------------------------- */
  const stored = read();
  if (stored) {
    root.classList.remove("consent-pending");
    categories.forEach((category) => {
      if (!stored.choices[category]) purgeCookies(category);
    });
    activateScripts(stored.choices);
  } else {
    root.classList.add("consent-pending");
    categories.forEach(purgeCookies);
  }
  updateState();

  try {
    const pending = sessionStorage.getItem(ANNOUNCE_KEY);
    if (pending) {
      sessionStorage.removeItem(ANNOUNCE_KEY);
      announce(pending);
    }
  } catch {
    /* sin almacenamiento de sesión */
  }
})();
