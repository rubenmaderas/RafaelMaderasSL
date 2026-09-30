/* Rafael Maderas S.L. — interacciones mínimas (mejora progresiva). */
(() => {
  "use strict";

  /* Los enlaces de invitación y de recuperación de contraseña del gestor de
     contenidos llegan a la portada; se reenvían a /admin/ con su token. */
  if (/^#(invite|recovery|confirmation|email_change)_token=/.test(location.hash)) {
    location.replace("/admin/" + location.hash);
    return;
  }

  /* Menú móvil ------------------------------------------------------------ */
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");

  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        toggle.getAttribute("aria-expanded") === "true" &&
        !nav.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        setOpen(false);
      }
    });

    window.matchMedia("(min-width: 60em)").addEventListener("change", (event) => {
      if (event.matches) setOpen(false);
    });
  }

  /* Barra de contacto móvil: se oculta cuando el bloque de contacto o el pie
     ya están a la vista, para no duplicar botones ni tapar contenido. */
  const bar = document.querySelector("[data-mobile-cta]");
  const targets = document.querySelectorAll("[data-hides-mobile-cta], [data-cta-final], [data-site-footer]");

  if (bar && targets.length && "IntersectionObserver" in window) {
    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        });
        bar.classList.toggle("is-hidden", visible.size > 0);
        bar.inert = visible.size > 0;
        bar.classList.add("is-ready");
      },
      { threshold: 0.15 }
    );
    targets.forEach((target) => observer.observe(target));
  } else if (bar) {
    bar.classList.add("is-ready");
  }
})();
