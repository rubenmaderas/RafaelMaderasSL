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
      /* Atenua el resto de la página detrás del menú (ver main.css). */
      document.documentElement.classList.toggle("nav-open", open);
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

  /* A partir de aquí, solo movimiento decorativo: nada se ejecuta si el
     dispositivo pide reducir el movimiento. */
  const motionOK = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  /* Cabecera fija (escritorio): sombra cuando la página ya se ha desplazado. */
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    /* Primera comprobación tras el primer pintado, sin forzar el cálculo del diseño. */
    requestAnimationFrame(() => setTimeout(onScroll));
  }

  /* Efecto «llana» en la foto principal ------------------------------------
     La foto empieza cubierta de yeso rugoso (capa CSS) y una llana lo alisa
     en tres pasadas hasta descubrirla. Solo se reproduce al entrar en la web
     (no al volver a la portada desde otra página), cuando al menos la mitad
     de la foto está en pantalla (en móvil, al bajar hasta ella), y nunca
     bloquea el contenido: cualquier fallo deja la foto visible. */
  const heroMedia = document.querySelector(".hero .media");

  if (heroMedia) {
    const visual = heroMedia.closest(".hero__visual");
    const smooth = () => {
      heroMedia.classList.remove("is-troweling");
      heroMedia.classList.add("is-smooth");
      if (visual) {
        visual.classList.remove("is-pending");
        visual.classList.add("is-ready");
      }
    };
    const nav = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
    const fromInside = document.referrer.indexOf(location.origin + "/") === 0 && !(nav && nav.type === "reload");

    if (!motionOK || fromInside || !("IntersectionObserver" in window)) {
      smooth();
    } else {
      /* El observador aporta posición y tamaño sin forzar el cálculo del diseño. */
      let textureSrc = null;
      const probe = new IntersectionObserver(
        (entries) => {
          const entry = entries[entries.length - 1];
          const inView = entry.intersectionRatio >= 0.5;

          if (!textureSrc) {
            const texture = getComputedStyle(heroMedia)
              .getPropertyValue("--plaster")
              .trim()
              .match(/^url\(["']?(.+?)["']?\)$/);
            /* Si ya está a la vista pero la carga ha sido lenta, no se hace esperar. */
            if (!texture || (inView && performance.now() > 3000)) {
              probe.disconnect();
              smooth();
              return;
            }
            textureSrc = texture[1];
            if (!inView && visual) visual.classList.add("is-pending");
          }

          if (!inView) return;
          probe.disconnect();
          if (visual) visual.classList.remove("is-pending");
          if (document.visibilityState !== "visible") smooth();
          else trowel(heroMedia, textureSrc, entry.boundingClientRect, smooth);
        },
        { threshold: [0, 0.5] }
      );
      probe.observe(heroMedia);
    }
  }

  function trowel(figure, textureSrc, rect, done) {
    const photo = figure.querySelector("img");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const tool = document.createElement("div");
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(guard);
      tool.remove();
      canvas.classList.add("is-fading");
      setTimeout(() => canvas.remove(), 700);
      done();
    };
    const guard = setTimeout(finish, 7000);

    if (!ctx || !photo) return finish();

    const w = rect.width;
    const h = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.className = "plaster-canvas";
    canvas.setAttribute("aria-hidden", "true");

    /* Llana vista desde la pared: hoja de acero y mango azul de la marca. */
    const th = h * 0.5;
    const tw = th * (100 / 260);
    tool.className = "trowel";
    tool.setAttribute("aria-hidden", "true");
    tool.style.width = tw + "px";
    tool.style.height = th + "px";
    tool.style.transform = "translate(-999px, 0)";
    tool.innerHTML =
      '<svg viewBox="0 0 100 260" focusable="false">' +
      '<defs><linearGradient id="llana-hoja" x1="0" y1="0" x2="1" y2=".4">' +
      '<stop offset="0" stop-color="#f8fafb"/><stop offset=".48" stop-color="#c5ccd3"/>' +
      '<stop offset=".6" stop-color="#eaeef1"/><stop offset="1" stop-color="#9ba5af"/></linearGradient>' +
      '<linearGradient id="llana-mango" x1="0" x2="1"><stop offset="0" stop-color="#3b73d0"/>' +
      '<stop offset=".55" stop-color="#1f4f9c"/><stop offset="1" stop-color="#143668"/></linearGradient></defs>' +
      '<rect x="4" y="4" width="92" height="252" rx="9" fill="url(#llana-hoja)" stroke="#7d8791" stroke-width="1.5"/>' +
      '<rect x="9" y="9" width="82" height="242" rx="6" fill="none" stroke="#fff" stroke-opacity=".5"/>' +
      '<path d="M5 214c14-7 30 5 46-2s31-6 44 1v34a9 9 0 0 1-9 9H14a9 9 0 0 1-9-9z" fill="#efe9df" opacity=".85"/>' +
      '<rect x="45" y="34" width="10" height="192" rx="4" fill="#87919b"/>' +
      '<rect x="37" y="74" width="36" height="118" rx="18" fill="#000" opacity=".18"/>' +
      '<rect x="32" y="68" width="36" height="120" rx="18" fill="url(#llana-mango)"/>' +
      '<rect x="38" y="80" width="7" height="96" rx="3.5" fill="#fff" opacity=".3"/></svg>';

    /* Huella de la hoja con bordes suaves, para «borrar» el yeso a su paso. */
    const bw = tw * 0.92 * dpr;
    const bh = th * 0.97 * dpr;
    const pad = Math.ceil(8 * dpr);
    const brush = document.createElement("canvas");
    brush.width = Math.ceil(bw + pad * 2);
    brush.height = Math.ceil(bh + pad * 2);
    const bctx = brush.getContext("2d");
    bctx.shadowColor = "#000";
    bctx.shadowBlur = 5 * dpr;
    bctx.shadowOffsetX = brush.width;
    bctx.fillRect(pad - brush.width, pad, bw, bh);

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const texture = new Image();
    const textureReady = new Promise((resolve, reject) => {
      texture.onload = resolve;
      texture.onerror = reject;
    });
    texture.src = textureSrc;

    Promise.all([textureReady, Promise.race([photo.decode().catch(() => {}), wait(2500)])])
      .then(() => {
        if (finished) return;
        const tile = document.createElement("canvas");
        tile.width = tile.height = Math.round(240 * dpr);
        tile.getContext("2d").drawImage(texture, 0, 0, tile.width, tile.height);
        ctx.fillStyle = "#efe9df";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = ctx.createPattern(tile, "repeat");
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "destination-out";

        figure.appendChild(canvas);
        figure.appendChild(tool);
        figure.classList.add("is-troweling");
        return wait(250);
      })
      .then(() => {
        if (finished) return;
        const passes = [1 / 6, 3 / 6, 5 / 6];
        const duration = 640;
        const from = -tw * 1.1;
        const to = w + tw * 1.1;
        const ease = (t) => (1 - Math.cos(Math.PI * t)) / 2;
        let start = 0;
        let last = null;

        const stamp = (x, y, angle) => {
          const c = Math.cos(angle);
          const s = Math.sin(angle);
          ctx.setTransform(c, s, -s, c, x * dpr, y * dpr);
          ctx.drawImage(brush, -brush.width / 2, -brush.height / 2);
        };

        const frame = (now) => {
          if (finished) return;
          if (!start) start = now;
          const elapsed = now - start;
          const index = Math.min(passes.length - 1, Math.floor(elapsed / duration));
          const t = Math.min(1, (elapsed - index * duration) / duration);
          const dir = index % 2 ? -1 : 1;
          const p = ease(t);
          const x = dir > 0 ? from + (to - from) * p : to - (to - from) * p;
          const y = h * passes[index] + h * 0.025 * Math.sin(Math.PI * t);
          const angle = dir * (0.1 + 0.06 * Math.sin(Math.PI * t));

          if (last && last.index === index) {
            const steps = Math.max(1, Math.ceil(Math.hypot(x - last.x, y - last.y) / 3));
            for (let i = 1; i <= steps; i++) {
              const k = i / steps;
              stamp(last.x + (x - last.x) * k, last.y + (y - last.y) * k, last.angle + (angle - last.angle) * k);
            }
          } else {
            stamp(x, y, angle);
          }
          last = { index, x, y, angle };

          tool.style.transform =
            "translate(" + (x - tw / 2).toFixed(1) + "px," + (y - th / 2).toFixed(1) + "px) rotate(" + angle.toFixed(3) + "rad)";

          if (elapsed >= duration * passes.length) finish();
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      })
      .catch(finish);
  }

  /* Aparición suave de bloques al hacer scroll ----------------------------- */
  if (motionOK && "IntersectionObserver" in window) {
    const selector = [
      ".section-head",
      ".split > :not(.services-list)",
      ".grid > *",
      ".process__step",
      ".faq__item",
      ".service",
      ".zone-block",
      ".contact-card",
      ".media",
      ".contact-data",
      ".cta-final__inner > *",
    ].join(",");
    const candidates = Array.from(document.querySelectorAll(selector)).filter(
      (el) => !el.closest(".hero, .page-hero")
    );
    /* Solo el bloque exterior se anima (evita animaciones anidadas). */
    const items = candidates.filter(
      (el) => !candidates.some((other) => other !== el && other.contains(el))
    );

    const revealer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, i) => {
            const el = entry.target;
            const delay = Math.min(i, 4) * 90;
            revealer.unobserve(el);
            el.style.setProperty("--reveal-delay", delay + "ms");
            el.classList.add("is-visible");
            setTimeout(() => {
              el.classList.remove("reveal", "is-visible");
              el.style.removeProperty("--reveal-delay");
            }, delay + 1500);
          });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );

    /* Solo se ocultan los bloques que empiezan por debajo de la pantalla, para
       no esconder lo que ya se está viendo. El observador indica su posición
       sin forzar el cálculo del diseño. */
    const sorter = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        sorter.unobserve(entry.target);
        if (!entry.isIntersecting && entry.boundingClientRect.top > 0) {
          entry.target.classList.add("reveal");
          revealer.observe(entry.target);
        }
      });
    });

    items.forEach((el) => sorter.observe(el));
  }

  /* Desplazamiento suavizado con rueda de ratón (solo escritorio). En móvil y
     tableta se mantiene el desplazamiento táctil nativo, que ya es fluido. */
  if (motionOK && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const root = document.documentElement;
    let target = 0;
    let current = 0;
    let raf = 0;
    let last = 0;

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      root.style.removeProperty("scroll-behavior");
    };

    const step = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      current += (target - current) * (1 - Math.pow(0.9, dt / 16.67));
      if (Math.abs(target - current) < 0.5) current = target;
      window.scrollTo(0, current);
      if (current === target) stop();
      else raf = requestAnimationFrame(step);
    };

    const canScrollInside = (el, dy) => {
      for (; el && el !== document.body && el !== root; el = el.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) {
          if (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
        }
      }
      return false;
    };

    window.addEventListener(
      "wheel",
      (event) => {
        if (event.defaultPrevented || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
        const dy = event.deltaY * (event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? window.innerHeight : 1);
        if (canScrollInside(event.target, dy)) return;
        event.preventDefault();
        if (!raf) {
          current = target = window.scrollY;
          last = performance.now();
          root.style.scrollBehavior = "auto";
          raf = requestAnimationFrame(step);
        }
        target = Math.max(0, Math.min(root.scrollHeight - window.innerHeight, target + dy));
      },
      { passive: false }
    );

    /* Si el usuario desplaza de otra forma (teclado, barra, enlace), se cede. */
    window.addEventListener(
      "scroll",
      () => {
        if (raf && Math.abs(window.scrollY - current) > 3) stop();
      },
      { passive: true }
    );
    ["keydown", "mousedown", "touchstart"].forEach((type) =>
      window.addEventListener(type, () => raf && stop(), { passive: true })
    );
  }
})();
