/*
 * Gestor de contenidos (Decap CMS): idioma del inicio de sesión y vistas previas.
 * ---------------------------------------------------------------------------
 * Las vistas previas imitan la web con sus mismos estilos (/admin/preview.css,
 * generado en cada compilación) para que se vea el resultado antes de publicar.
 * Los comodines ({empresa}, {telefono}…) se muestran con los datos publicados.
 */
(() => {
  "use strict";

  // Ventana de inicio de sesión en español (antes de que se inicie sola en inglés).
  if (window.netlifyIdentity) window.netlifyIdentity.init({ locale: "es" });

  const CMS = window.CMS;
  const h = window.h;
  if (!CMS || !h) return;

  /* Comodines -------------------------------------------------------------- */
  let tokens = {};
  try {
    tokens = JSON.parse(document.getElementById("cms-tokens").textContent);
  } catch (error) {
    tokens = {};
  }

  const applyTokens = (value) =>
    String(value == null ? "" : value).replace(/\{([a-zA-ZñÑ_\\]+)\}/g, (match, key) => {
      const normalized = key.replace(/\\/g, "").toLowerCase();
      return Object.prototype.hasOwnProperty.call(tokens, normalized) ? tokens[normalized] : match;
    });

  /* Markdown básico (negrita, cursiva, enlaces, listas) ---------------------- */
  const escapeHtml = (value) =>
    String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const inline = (value) => {
    const escapes = [];
    let html = escapeHtml(applyTokens(value).trim().replace(/\s*\n\s*/g, " "));
    html = html.replace(/\\([\\`*_{}[\]()#+\-.!])/g, (match, char) => {
      escapes.push(char);
      return `\uE000${escapes.length - 1}\uE001`;
    });
    html = html
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, url) =>
        /^(https?:|mailto:|tel:|\/|#)/i.test(url) ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>` : label
      )
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/(^|[^\w])_([^_]+)_(?!\w)/g, "$1<em>$2</em>");
    return html.replace(/\uE000(\d+)\uE001/g, (match, index) => escapeHtml(escapes[Number(index)]));
  };

  const block = (value) =>
    applyTokens(value)
      .trim()
      .split(/\n\s*\n/)
      .filter((part) => part.trim())
      .map((part) => {
        const lines = part.split("\n").filter((line) => line.trim());
        if (lines.every((line) => /^\s*[-*+]\s+/.test(line))) {
          return `<ul>${lines.map((line) => `<li>${inline(line.replace(/^\s*[-*+]\s+/, ""))}</li>`).join("")}</ul>`;
        }
        if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
          return `<ol>${lines.map((line) => `<li>${inline(line.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`;
        }
        return `<p>${inline(part)}</p>`;
      })
      .join("");

  const highlight = (value) =>
    escapeHtml(applyTokens(value).trim())
      .replace(/\s+/g, (space, offset, whole) => (/(?:^|\s)[aeouy]$/i.test(whole.slice(0, offset)) ? "&nbsp;" : space))
      .replace(/\*([^*]+)\*/g, '<span class="highlight">$1</span>');

  const plainParagraphs = (value) =>
    applyTokens(value)
      .split(/\n\s*\n/)
      .map((part) => part.trim().replace(/\s*\n\s*/g, " "))
      .filter(Boolean);

  /* Ayudas para crear elementos -------------------------------------------- */
  const html = (tag, content, props = {}) => h(tag, { ...props, dangerouslySetInnerHTML: { __html: content } });
  const text = (value) => applyTokens(value).trim();
  const toJS = (value) => (value && typeof value.toJS === "function" ? value.toJS() : value || {});
  const labelOf = (fields, name) => {
    const field = fields && fields.find && fields.find((item) => item.get("name") === name);
    return field ? field.get("label") : name;
  };
  const list = (items) => (Array.isArray(items) ? items.filter((item) => item != null) : []);

  /* Vista en Google ---------------------------------------------------------- */
  const Snippet = (seo) => {
    const title = text(seo.titulo);
    const description = text(seo.descripcion);
    const titleLong = title.length > 70;
    const descriptionBad = description.length > 160 || description.length < 70;
    return h(
      "aside",
      { className: "cms-snippet", key: "seo" },
      h("p", { className: "cms-snippet__label" }, "Vista aproximada en Google"),
      h("p", { className: "cms-snippet__url" }, "rafaelmaderas.es"),
      h("p", { className: "cms-snippet__title" }, title || "(sin título)"),
      h("p", { className: "cms-snippet__desc" }, description || "(sin descripción)"),
      h(
        "p",
        { className: "cms-snippet__count" },
        h("span", { className: titleLong ? "cms-warn" : "" }, `Título: ${title.length} caracteres`),
        " · ",
        h("span", { className: descriptionBad ? "cms-warn" : "" }, `Descripción: ${description.length} caracteres`),
        " (recomendado: título hasta unos 60–70 y descripción entre 120 y 160)."
      )
    );
  };

  /* Bloques de página -------------------------------------------------------- */
  const renderBlock = (data, level, fields) => {
    const out = [];
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (value == null || value === "") return;
      switch (key) {
        case "antetitulo":
          out.push(h("p", { key, className: "eyebrow" }, text(value)));
          break;
        case "titulo":
          out.push(level === 1 ? html("h1", highlight(value), { key }) : h(`h${level}`, { key }, text(value)));
          break;
        case "entradilla":
          out.push(html("p", inline(value), { key, className: level === 1 ? "lead" : "" }));
          break;
        case "texto":
          out.push(html("div", block(value), { key, className: "prose" }));
          break;
        case "lista":
          out.push(h("ul", { key, className: "check-list" }, list(value).map((item, i) => html("li", inline(item), { key: i }))));
          break;
        case "localidades":
          out.push(h("ul", { key, className: "tag-list" }, list(value).map((item, i) => h("li", { key: i }, text(item)))));
          break;
        case "pasos":
          out.push(h("ol", { key, className: "steps" }, list(value).map((item, i) => html("li", inline(item), { key: i }))));
          break;
        case "tarjetas":
          out.push(
            h(
              "div",
              { key, className: "grid grid--2" },
              list(value).map((card, i) =>
                h(
                  "article",
                  { key: i, className: "card" },
                  card.duda ? h("p", { className: "card__doubt" }, text(card.duda)) : null,
                  h(`h${Math.min(level + 1, 4)}`, null, text(card.titulo)),
                  html("div", block(card.texto))
                )
              )
            )
          );
          break;
        case "filas":
          out.push(
            h(
              "dl",
              { key, className: "cms-rows" },
              list(value).map((row, i) => h("div", { key: i }, h("dt", null, text(row.etiqueta)), html("dd", inline(row.valor))))
            )
          );
          break;
        case "nota":
          out.push(html("p", inline(value), { key, className: "small" }));
          break;
        case "enlace":
          out.push(h("p", { key }, h("span", { className: "link-arrow" }, `${text(value)} →`)));
          break;
        case "insignias":
          out.push(
            h(
              "ul",
              { key, className: "tag-list" },
              h("li", null, `${text(value.oficio)}: ${tokens["años"] || "?"} años`),
              html("li", inline(value.interlocutor)),
              html("li", inline(value.zona))
            )
          );
          break;
        default:
          if (typeof value === "string") {
            out.push(html("p", inline(value), { key }));
          } else if (typeof value === "object" && !Array.isArray(value)) {
            out.push(
              h(
                "article",
                { key, className: "card" },
                h("p", { className: "eyebrow" }, labelOf(fields, key)),
                ...renderBlock(value, Math.min(level + 1, 4))
              )
            );
          }
      }
    });
    return out;
  };

  const PagePreview = (data, fields) => {
    const sections = Object.keys(data)
      .filter((key) => key !== "seo" && data[key] && typeof data[key] === "object")
      .map((key, index) => {
        const hero = key === "cabecera" || key === "portada";
        const field = fields && fields.find && fields.find((item) => item.get("name") === key);
        const subFields = field ? field.get("fields") : null;
        return h(
          "section",
          { key, className: hero ? "page-hero" : `section${index % 2 ? " section--surface" : ""}` },
          h("div", { className: "container stack" }, ...renderBlock(data[key], hero ? 1 : 2, subFields))
        );
      });
    return h("div", { className: "cms-preview" }, data.seo ? Snippet(data.seo) : null, ...sections);
  };

  /* Servicios ---------------------------------------------------------------- */
  const ServicesPreview = (data, fields) =>
    h(
      "div",
      { className: "cms-preview" },
      ["yeso", "reformas", "gremios"].map((key, index) =>
        h(
          "section",
          { key, className: `section${index % 2 ? " section--surface" : ""}` },
          h(
            "div",
            { className: "container" },
            h("h2", null, labelOf(fields, key)),
            h(
              "div",
              { className: "grid grid--2" },
              list(data[key]).map((item, i) =>
                h(
                  "article",
                  { key: i, className: `card${item.destacado ? " card--accent-top" : ""}` },
                  h("h3", null, text(item.titulo)),
                  item.resumen ? html("p", inline(item.resumen), { className: "lead" }) : null,
                  html("div", block(item.descripcion || item.texto || ""))
                )
              )
            )
          )
        )
      )
    );

  /* Preguntas frecuentes (agrupadas por la página donde aparecen) ------------ */
  const FAQ_PAGES = [
    ["inicio", "la portada"],
    ["servicios", "Servicios"],
    ["reformas", "Reformas"],
  ];

  const FaqPreview = (data) => {
    const items = list(data.preguntas);
    const pageOf = (item) => (FAQ_PAGES.some(([key]) => key === item.pagina) ? item.pagina : "inicio");
    return h(
      "div",
      { className: "cms-preview" },
      FAQ_PAGES.map(([key, label], index) => {
        const group = items.filter((item) => pageOf(item) === key);
        return h(
          "section",
          { key, className: `section${index % 2 ? " section--surface" : ""}` },
          h(
            "div",
            { className: "container stack" },
            h("h2", null, `Preguntas en ${label} (${group.length})`),
            group.length
              ? group.map((item, i) =>
                  h(
                    "div",
                    { key: i, className: "card" },
                    h("h3", null, text(item.pregunta)),
                    plainParagraphs(item.respuesta).map((paragraph, j) => h("p", { key: j }, paragraph))
                  )
                )
              : h("p", { className: "small" }, "Ninguna pregunta asignada: esta página no muestra la sección de preguntas.")
          )
        );
      })
    );
  };

  /* Textos comunes ----------------------------------------------------------- */
  const CommonPreview = (data) => {
    const cta = data.cta || {};
    const pie = data.pie || {};
    return h(
      "div",
      { className: "cms-preview" },
      h(
        "section",
        { className: "section" },
        h(
          "div",
          { className: "container stack" },
          h("p", { className: "eyebrow" }, "Cabecera"),
          h("p", null, h("strong", null, tokens.empresa || ""), " — ", text((data.marca || {}).lema)),
          h("h2", null, "Proceso de trabajo"),
          h(
            "ol",
            { className: "grid grid--2 cms-plain-list" },
            list(data.proceso).map((step, i) =>
              h("li", { key: i, className: "card" }, h("h3", null, `${i + 1}. ${text(step.titulo)}`), html("div", block(step.texto)))
            )
          )
        )
      ),
      h(
        "section",
        { className: "section section--dark" },
        h(
          "div",
          { className: "container stack" },
          h("p", { className: "eyebrow eyebrow--light" }, text(cta.antetitulo)),
          h("h2", null, text(cta.titulo)),
          html("div", block(cta.texto))
        )
      ),
      h(
        "section",
        { className: "section section--surface" },
        h("div", { className: "container stack" }, h("p", { className: "eyebrow" }, "Pie de página"), html("div", block(pie.texto)), h("p", null, text(pie.zona)))
      )
    );
  };

  /* Fotos -------------------------------------------------------------------- */
  const PhotosPreview = (data, fields, getAsset) =>
    h(
      "div",
      { className: "cms-preview" },
      h(
        "div",
        { className: "cms-photos" },
        Object.keys(data).map((key) => {
          const photo = data[key] || {};
          const asset = photo.foto ? getAsset(photo.foto) : null;
          const src = asset ? String(asset) : "";
          const credit = photo.credito || {};
          return h(
            "figure",
            { key, className: "cms-photo" },
            src
              ? h("img", { src, alt: photo.alt || "", style: { objectPosition: { arriba: "center 20%", abajo: "center 72%" }[photo.encuadre] || "center" } })
              : h("div", { className: "cms-photo__empty" }, "Sin foto"),
            h(
              "figcaption",
              null,
              h("strong", null, labelOf(fields, key)),
              photo.ilustrativa ? h("span", { className: "cms-badge" }, "Imagen ilustrativa") : h("span", { className: "cms-badge cms-badge--own" }, "Foto propia"),
              photo.alt ? h("span", null, photo.alt) : h("span", { className: "cms-warn" }, "Falta la descripción de la foto."),
              photo.ilustrativa && credit.autor ? h("small", null, `Autor: ${credit.autor}${credit.fuente ? ` · ${credit.fuente}` : ""}`) : null
            )
          );
        })
      )
    );

  /* Datos de la empresa ------------------------------------------------------ */
  const CompanyPreview = (data) => {
    const digits = String(data.telefono || "").replace(/\D/g, "");
    const phone = digits.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");
    const founder = data.fundador || {};
    const legal = data.legal || {};
    const address = legal.domicilio || {};
    const year = new Date().getFullYear();
    const years = Number(founder.inicioOficio) ? year - Number(founder.inicioOficio) : "?";
    const rows = [
      ["Nombre", data.nombre],
      ["Eslogan", data.eslogan],
      ["Teléfono y WhatsApp", /^[6789]\d{8}$/.test(digits) ? phone : h("span", { className: "cms-warn" }, `${data.telefono || ""} (revisa el número)`)],
      ["Mensaje de WhatsApp", data.mensajeWhatsapp],
      ["Correo", data.email],
      ["Sociedad constituida en", data.anoConstitucion],
      ["Fundador", [founder.nombre, founder.cargo].filter(Boolean).join(", ")],
      ["Años de oficio (se calcula solo)", `${years} (desde ${founder.inicioOficio || "?"})`],
      ["Razón social", legal.razonSocial],
      ["CIF", legal.cif],
      ["Domicilio social", [address.calle, [address.codigoPostal, address.localidad].filter(Boolean).join(" "), address.provincia].filter(Boolean).join(", ")],
      ["Registro Mercantil", legal.registroMercantil],
      ["Alojamiento web", legal.hosting],
      ["Textos legales actualizados el", legal.ultimaActualizacion],
      ["Redes sociales", list(data.redes).filter((red) => red.url).map((red) => red.nombre).join(", ") || "Ninguna (no se muestran)"],
    ];
    return h(
      "div",
      { className: "cms-preview" },
      h(
        "section",
        { className: "section" },
        h(
          "div",
          { className: "container stack" },
          h("h2", null, "Datos de la empresa"),
          h("p", { className: "cms-note" }, "Estos datos se usan en toda la web. Al publicar, se actualizan también los textos con comodines como {empresa} o {telefono}."),
          h("dl", { className: "cms-rows" }, rows.map(([label, value], i) => h("div", { key: i }, h("dt", null, label), h("dd", null, value == null || value === "" ? "—" : value))))
        )
      )
    );
  };

  /* Registro ----------------------------------------------------------------- */
  const Preview = (props) => {
    const data = toJS(props.entry.get("data"));
    const fields = props.fields;
    switch (props.entry.get("slug")) {
      case "trabajos":
        return ServicesPreview(data, fields);
      case "preguntas":
        return FaqPreview(data);
      case "comun":
        return CommonPreview(data);
      case "fotos":
        return PhotosPreview(data, fields, props.getAsset);
      case "empresa":
        return CompanyPreview(data);
      default:
        return PagePreview(data, fields);
    }
  };

  CMS.registerPreviewStyle("/admin/preview.css");
  CMS.registerPreviewStyle(
    `
    .cms-preview { padding-bottom: 3rem; }
    .cms-snippet { max-width: 38rem; margin: 1.5rem auto 0; padding: 1rem 1.25rem; border: 1px dashed #b9b2a6; border-radius: 12px; background: #fff; font-family: Arial, Helvetica, sans-serif; }
    .cms-snippet p { margin: 0; }
    .cms-snippet__label { font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; color: #5f5a52; margin-bottom: .5rem !important; }
    .cms-snippet__url { font-size: .85rem; color: #202124; }
    .cms-snippet__title { font-size: 1.2rem; line-height: 1.3; color: #1a0dab; margin: .2rem 0 !important; }
    .cms-snippet__desc { font-size: .9rem; line-height: 1.5; color: #4d5156; }
    .cms-snippet__count { font-size: .8rem; color: #5f5a52; margin-top: .75rem !important; }
    .cms-warn { color: #b3261e; font-weight: 700; }
    .cms-note { padding: .75rem 1rem; border-radius: 8px; background: #fff4d6; font-size: .9rem; }
    .cms-rows { display: grid; gap: .5rem; margin: 0; }
    .cms-rows > div { display: grid; grid-template-columns: minmax(10rem, 16rem) 1fr; gap: 1rem; padding: .5rem 0; border-bottom: 1px solid rgba(0,0,0,.08); }
    .cms-rows dt { font-weight: 700; }
    .cms-rows dd { margin: 0; }
    .cms-plain-list { list-style: none; padding: 0; }
    .cms-photos { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); padding: 1.5rem; }
    .cms-photo { margin: 0; display: grid; gap: .5rem; }
    .cms-photo img, .cms-photo__empty { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 12px; display: grid; place-items: center; background: #ece6dc; }
    .cms-photo figcaption { display: grid; gap: .35rem; font-size: .9rem; }
    .cms-badge { justify-self: start; font-size: .75rem; font-weight: 700; padding: .15rem .6rem; border-radius: 999px; background: #ece6dc; }
    .cms-badge--own { background: #dbe7f7; }
    `,
    { raw: true }
  );

  ["inicio", "servicios", "reformas", "zonas", "quienes-somos", "contacto", "trabajos", "preguntas", "fotos", "comun", "empresa"].forEach(
    (name) => CMS.registerPreviewTemplate(name, Preview)
  );
})();