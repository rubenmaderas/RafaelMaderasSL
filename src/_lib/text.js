/**
 * Utilidades de texto para los contenidos editables.
 * ---------------------------------------------------------------------------
 * - Comodines: {empresa}, {telefono}, {correo}, {años}… se sustituyen por los
 *   datos actuales de la empresa (así un cambio de teléfono llega a todos los
 *   textos sin tener que editarlos uno a uno).
 * - Markdown: negrita, cursiva, enlaces y listas. El HTML escrito a mano se
 *   muestra como texto (html: false), de modo que no puede romper la página.
 */
import MarkdownIt from "markdown-it";
import { getSite } from "./site.js";

export function tokenValues(site = getSite()) {
  const years = String(site.founder.yearsExperience);
  return {
    empresa: site.name,
    razon_social: site.registeredName,
    cif: site.taxId,
    telefono: site.phone.display,
    correo: site.email.address,
    "años": years,
    anos: years,
    fundacion: String(site.foundedYear),
    fundador: site.founder.name,
    cargo: site.founder.role,
    oficio: site.founder.trade,
  };
}

const warned = new Set();

/** Sustituye los comodines {…} por su valor. Los desconocidos se dejan tal cual. */
export function applyTokens(value, site) {
  if (value === undefined || value === null) return "";
  const values = tokenValues(site);
  // El editor de texto enriquecido puede escribir {razon\_social}: se ignoran las barras.
  return String(value).replace(/\{([a-zA-ZñÑ_\\]+)\}/g, (match, key) => {
    const normalized = key.replace(/\\/g, "").toLowerCase();
    if (normalized in values) return values[normalized];
    if (!warned.has(match)) {
      warned.add(match);
      console.warn(`[contenido] Comodín desconocido ${match}: se muestra tal cual.`);
    }
    return match;
  });
}

const md = new MarkdownIt({ html: false, linkify: false, typographer: false, breaks: false });

// Enlaces externos en pestaña nueva, con aviso accesible.
const defaultLinkOpen =
  md.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet("href") || "";
  if (/^https?:\/\//i.test(href)) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noopener");
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};
md.renderer.rules.link_close = (tokens, idx, options, env, self) => {
  let before = "";
  const open = tokens.slice(0, idx).reverse().find((t) => t.type === "link_open");
  if (open && open.attrGet("target") === "_blank") {
    before = '<span class="visually-hidden"> (se abre en una nueva pestaña)</span>';
  }
  return before + self.renderToken(tokens, idx, options);
};

/** Markdown en bloque (párrafos, listas…). */
export function renderMarkdown(value, site) {
  const source = applyTokens(value, site).trim();
  return source ? md.render(source).trim() : "";
}

/** Markdown en línea (sin párrafos): para textos que ya van dentro de un <p>, <li>… */
export function renderMarkdownInline(value, site) {
  const source = applyTokens(value, site).trim().replace(/\s*\n\s*/g, " ");
  return source ? md.renderInline(source) : "";
}

/**
 * Markdown en línea en el que la negrita se pinta como <span class="…"> en vez de <strong>.
 * Para etiquetas visuales (insignias de la portada, nombre de cada fase de obra): se ven igual,
 * pero no cuentan como énfasis del texto. Así las negritas de verdad (<strong>) se reservan
 * para las ideas clave y no se diluyen.
 */
export function renderMarkdownInlineLabel(value, className, site) {
  return renderMarkdownInline(value, site)
    .replace(/<strong>/g, `<span class="${escapeHtml(className)}">`)
    .replace(/<\/strong>/g, "</span>");
}

/** Texto sin marcas de formato (para metadatos y datos estructurados). */
export function plainText(value, site) {
  return applyTokens(value, site)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|\*|_)(\S(?:.*?\S)?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();
}

const escapeHtml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Título con una palabra destacada entre asteriscos: «Trabajos de yeso y reformas en *Jaén*».
 * Las palabras de una letra (y, o, a, e, u) se unen a la siguiente con un espacio duro para
 * que no queden colgando al final de una línea.
 */
export function renderHighlight(value, site) {
  return escapeHtml(applyTokens(value, site).trim())
    .replace(/\s+/g, (space, offset, whole) =>
      /(?:^|\s)[aeouy]$/i.test(whole.slice(0, offset)) ? "&nbsp;" : space
    )
    .replace(/\*([^*]+)\*/g, '<span class="highlight">$1</span>');
}

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
