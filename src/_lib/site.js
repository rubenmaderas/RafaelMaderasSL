/**
 * DATOS DEL NEGOCIO
 * ---------------------------------------------------------------------------
 * Los datos editables (nombre, teléfono, correo, datos registrales…) están en
 * src/_data/contenido/empresa.json y se cambian desde el gestor de contenidos
 * (/admin → «Datos de la empresa»). Aquí solo se calculan los valores derivados
 * (enlaces tel: y wa.me, años de oficio, textos legales…) y se definen los
 * ajustes técnicos que no deben tocarse desde el gestor.
 */
import { readContent } from "./content.js";

export const PENDING_MARK = "PENDIENTE DE SUSTITUIR ANTES DE PUBLICAR";

// Dominio definitivo (sin www). Hay que registrarlo y apuntarlo a Netlify.
export const DOMAIN = "rafaelmaderas.es";

// URL canónica (sin barra final): canonical, sitemap, robots.txt, Open Graph y JSON-LD.
// Se puede sobrescribir con la variable de entorno SITE_URL al compilar.
export const SITE_URL = (process.env.SITE_URL || `https://${DOMAIN}`).replace(/\/+$/, "");

// Consentimiento de cookies. Mantener "enabled: false" mientras la web no use
// cookies ni tecnologías de seguimiento no técnicas (situación actual).
// Consulta el README antes de activarlo.
export const COOKIE_CONSENT = {
  enabled: false,
  storageKey: "rm-consent-v1",
  categories: [
    {
      id: "analytics",
      label: "Analítica",
      description: "Permiten saber cuántas personas visitan la web y qué páginas consultan.",
    },
    {
      id: "marketing",
      label: "Publicidad",
      description: "Permiten medir campañas publicitarias y mostrar anuncios relacionados.",
    },
  ],
};

function fail(message) {
  throw new Error(`[empresa.json] ${message}. Corrígelo en /admin → «Datos de la empresa».`);
}

function text(value) {
  return String(value ?? "").trim();
}

export function buildSite() {
  const data = readContent("empresa");
  const legal = data.legal || {};
  const founder = data.fundador || {};
  const address = legal.domicilio || {};

  const phoneDigits = text(data.telefono).replace(/\D/g, "").replace(/^34(?=\d{9}$)/, "");
  if (!/^[6789]\d{8}$/.test(phoneDigits)) fail(`El teléfono «${data.telefono}» debe tener 9 cifras`);
  const phoneDisplay = phoneDigits.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");
  const phoneE164 = `+34${phoneDigits}`;

  const email = text(data.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(`El correo «${email}» no es válido`);

  const currentYear = new Date().getFullYear();
  const tradeStartYear = Number(founder.inicioOficio);
  const foundedYear = Number(data.anoConstitucion);
  if (!Number.isInteger(tradeStartYear) || tradeStartYear < 1950 || tradeStartYear > currentYear) {
    fail("El año de inicio en el oficio no es válido");
  }
  if (!Number.isInteger(foundedYear) || foundedYear < 1950 || foundedYear > currentYear) {
    fail("El año de constitución no es válido");
  }

  const name = text(data.nombre);
  const registeredName = text(legal.razonSocial);
  const cif = text(legal.cif);
  const whatsappMessage = text(data.mensajeWhatsapp);

  const siteAddress = {
    street: text(address.calle),
    postalCode: text(address.codigoPostal),
    locality: text(address.localidad),
    region: text(address.provincia),
    country: "ES",
  };
  const domicilio = `${siteAddress.street}, ${siteAddress.postalCode} ${siteAddress.locality} (${siteAddress.region})`;

  // Marca tipográfica de la cabecera y el pie: «Rafael Maderas» + «S.L.».
  const brandMatch = name.match(/^(.*?)\s+(S\.\s?L\.(?:\s?U\.)?|S\.\s?A\.)$/i);
  const brand = brandMatch ? { name: brandMatch[1], suffix: brandMatch[2] } : { name, suffix: "" };

  const tagline = text(data.eslogan);

  return {
    name,
    legalName: name,
    // Denominación exacta inscrita en el Registro Mercantil (Aviso legal y JSON-LD).
    registeredName,
    taxId: cif,
    shortName: text(data.nombreCorto) || brand.name,
    brand,
    tagline,
    description: text(data.descripcion),

    url: SITE_URL,
    lang: "es",
    locale: "es_ES",

    // Los años de experiencia son los de oficio del fundador como yesista (anteriores
    // a la empresa) y se calculan con el año de compilación. "foundedYear" es el año
    // de inscripción de la sociedad.
    founder: {
      name: text(founder.nombre),
      role: text(founder.cargo),
      trade: text(founder.oficio),
      tradeStartYear,
      yearsExperience: currentYear - tradeStartYear,
    },
    foundedYear,

    phone: {
      digits: phoneDigits,
      e164: phoneE164,
      display: phoneDisplay,
      displayIntl: `+34 ${phoneDisplay}`,
      href: `tel:${phoneE164}`,
    },

    whatsapp: {
      display: phoneDisplay,
      message: whatsappMessage,
      href: `https://wa.me/34${phoneDigits}${whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ""}`,
    },

    email: {
      address: email,
      href: `mailto:${email}`,
    },

    // Domicilio social. Se usa en los textos legales y en los datos estructurados;
    // no se muestra en la cabecera, el pie ni la página de contacto porque la empresa
    // trabaja en casa del cliente y no atiende al público allí.
    address: siteAddress,

    areaServed: [
      { type: "City", name: "Jaén" },
      { type: "AdministrativeArea", name: "Provincia de Jaén" },
      { type: "State", name: "Andalucía" },
    ],

    // Solo las redes con URL se muestran en el pie y en el aviso legal, y se añaden
    // a "sameAs" en los datos estructurados.
    social: (data.redes || [])
      .map((s) => ({ name: text(s.nombre), url: text(s.url) }))
      .filter((s) => s.name),

    legal: {
      pendingMark: PENDING_MARK,
      domicilio,
      cif,
      registroMercantil: text(legal.registroMercantil) || PENDING_MARK,
      dominio: DOMAIN,
      responsableTratamiento: `${registeredName} (${name}), CIF ${cif}, con domicilio en ${domicilio}`,
      contactoDerechos: `Por correo electrónico a ${email}, indicando «Protección de datos» en el asunto, o por correo postal a ${domicilio}`,
      hosting: text(legal.hosting) || PENDING_MARK,
      lastUpdated: text(legal.ultimaActualizacion),
    },

    cookieConsent: COOKIE_CONSENT,

    seo: {
      ogImage: "/assets/img/og/og-rafael-maderas.jpg",
      ogImageWidth: 1200,
      ogImageHeight: 630,
      ogImageAlt: `${name} · ${tagline} · ${phoneDisplay}`,
      themeColor: "#2b2a27",
    },
  };
}

let cached = null;
let cachedSource = null;

/** Datos del negocio de la compilación actual (se recalculan si cambia empresa.json). */
export function getSite() {
  const source = readContent("empresa");
  if (source !== cachedSource) {
    cached = buildSite();
    cachedSource = source;
  }
  return cached;
}
