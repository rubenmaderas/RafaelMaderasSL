/*
 * Gestor de consentimiento de cookies — PREPARADO PERO DESACTIVADO.
 * ---------------------------------------------------------------------------
 * Solo se carga si en src/_lib/site.js se pone COOKIE_CONSENT.enabled = true.
 *
 * Cómo condicionar un script al consentimiento (ejemplo de analítica):
 *
 *   <script type="text/plain" data-consent="analytics"
 *           data-src="https://ejemplo-analitica.com/script.js"></script>
 *
 *   <script type="text/plain" data-consent="analytics">
 *     // código en línea que solo se ejecutará tras aceptar "analytics"
 *   </script>
 *
 * Mientras el usuario no acepte la categoría, el navegador no ejecuta nada.
 * El consentimiento se guarda en localStorage (preferencia técnica necesaria),
 * caduca a los 12 meses y puede cambiarse desde «Configurar cookies».
 */
(() => {
  "use strict";

  const panel = document.querySelector("[data-consent]");
  if (!panel) return;

  const STORAGE_KEY = panel.dataset.storageKey || "consent";
  const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

  const form = panel.querySelector("[data-consent-form]");
  const options = panel.querySelector("[data-consent-options]");
  const saveWrap = panel.querySelector("[data-consent-save-wrap]");
  const configureBtn = panel.querySelector("[data-consent-configure]");
  const checkboxes = Array.from(panel.querySelectorAll("[data-consent-category]"));
  const categories = checkboxes.map((input) => input.dataset.consentCategory);

  const read = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!stored || Date.now() - stored.timestamp > MAX_AGE_MS) return null;
      return stored;
    } catch {
      return null;
    }
  };

  const write = (choices) => {
    const previous = read();
    const record = { timestamp: Date.now(), choices };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      /* almacenamiento no disponible: se volverá a preguntar */
    }
    return previous;
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
      if (placeholder.dataset.src) script.src = placeholder.dataset.src;
      else script.textContent = placeholder.textContent;
      placeholder.dataset.consentActivated = "true";
      placeholder.after(script);
    });
  };

  const showOptions = (show) => {
    options.hidden = !show;
    saveWrap.hidden = !show;
    configureBtn.setAttribute("aria-expanded", String(show));
  };

  const open = (withOptions = false, moveFocus = false) => {
    const stored = read();
    checkboxes.forEach((input) => {
      input.checked = Boolean(stored && stored.choices[input.dataset.consentCategory]);
    });
    showOptions(withOptions);
    panel.hidden = false;
    if (moveFocus) {
      const heading = panel.querySelector("h2");
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  };

  const close = () => {
    panel.hidden = true;
  };

  const apply = (choices) => {
    const previous = write(choices);
    close();
    // Si se retira un consentimiento ya dado, se recarga para detener los scripts.
    const revoked = previous && categories.some((c) => previous.choices[c] && !choices[c]);
    if (revoked) {
      window.location.reload();
      return;
    }
    activateScripts(choices);
  };

  const all = (value) => Object.fromEntries(categories.map((c) => [c, value]));

  panel.querySelector("[data-consent-accept]").addEventListener("click", () => apply(all(true)));
  panel.querySelector("[data-consent-reject]").addEventListener("click", () => apply(all(false)));
  configureBtn.addEventListener("click", () => showOptions(options.hidden));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    apply(Object.fromEntries(checkboxes.map((input) => [input.dataset.consentCategory, input.checked])));
  });

  document.querySelectorAll("[data-consent-open]").forEach((button) => {
    button.addEventListener("click", () => open(true, true));
  });

  const stored = read();
  if (stored) activateScripts(stored.choices);
  else open(false);
})();
