/**
 * DATOS DEL NEGOCIO
 * ---------------------------------------------------------------------------
 * Los datos editables (nombre, teléfono, correo, datos registrales…) están en
 * src/_data/contenido/empresa.json y se cambian desde el gestor de contenidos
 * (/admin → «Datos de la empresa»). Aquí solo se calculan los valores derivados
 * (enlaces tel: y wa.me, años de oficio, textos legales…) y se definen los
 * ajustes técnicos que no deben tocarse desde el gestor.
 */
import crypto from "node:crypto";
import { readContent } from "./content.js";

export const PENDING_MARK = "PENDIENTE DE SUSTITUIR ANTES DE PUBLICAR";

// Dominio definitivo (sin www). Hay que registrarlo y apuntarlo a Netlify.
export const DOMAIN = "rafaelmaderas.es";

// URL canónica (sin barra final): canonical, sitemap, robots.txt, Open Graph y JSON-LD.
// Se puede sobrescribir con la variable de entorno SITE_URL al compilar.
export const SITE_URL = (process.env.SITE_URL || `https://${DOMAIN}`).replace(/\/+$/, "");

/*
 * COOKIES Y CONSENTIMIENTO (ver README → «Cookies y consentimiento»)
 * El aviso de cookies solo existe si la web usa algo que necesita consentimiento.
 * Hoy eso solo ocurre con Google Analytics 4, que se activa escribiendo su ID de
 * medición en /admin → «Datos de la empresa» → «Analítica web». Sin ID, la web no
 * instala cookies y no muestra ningún aviso (pedir permiso para nada sería engañoso).
 */
export const CONSENT_STORAGE_KEY = "rm-consent";
// La elección del visitante (aceptar o rechazar) se recuerda 12 meses; después se
// vuelve a preguntar. La AEPD considera buena práctica no superar los 24 meses.
export const CONSENT_MAX_AGE_DAYS = 365;
// Duración de las cookies de Google Analytics (en su valor por defecto serían 2 años).
export const ANALYTICS_COOKIE_DAYS = 365;

const GA_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;

function analyticsCategory(gaId) {
  return {
    id: "analytics",
    label: "Analítica",
    service: "Google Analytics",
    provider: "Google Ireland Limited",
    purpose:
      "Saber cuántas personas visitan la web, qué páginas consultan, desde qué tipo de dispositivo y zona aproximada, y cuántas pulsan los botones de llamar, WhatsApp o correo.",
    cookies: [
      {
        name: "_ga",
        purpose: "Distingue un navegador de otro mediante un número aleatorio, para contar visitantes únicos. No contiene tu nombre ni tus datos de contacto.",
        duration: "1 año desde la última visita",
      },
      {
        name: `_ga_${gaId.slice(2)}`,
        purpose: "Guarda el estado de la visita (sesión) para medir cuántas páginas se ven y cuánto dura.",
        duration: "1 año desde la última visita",
      },
    ],
    // Cookies que se borran si el visitante rechaza o retira el consentimiento.
    purge: ["_ga", "_ga_*"],
  };
}

// Versión del consentimiento: cambia sola si cambian las finalidades o los
// proveedores, y entonces se vuelve a preguntar a todos los visitantes.
function consentVersion(categories) {
  const signature = JSON.stringify(categories.map((c) => [c.id, c.service, c.provider, c.purpose]));
  return crypto.createHash("sha256").update(signature).digest("hex").slice(0, 8);
}

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

  const gaId = text((data.analitica || {}).googleAnalytics).toUpperCase();
  if (gaId && !GA_ID_PATTERN.test(gaId)) {
    fail(`El ID de Google Analytics «${gaId}» no es válido: debe empezar por G- (por ejemplo, G-AB12CD34EF)`);
  }
  const consentCategories = gaId ? [analyticsCategory(gaId)] : [];

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

    // Fichas de la empresa en portales y directorios. No se muestran en la web: solo se
    // añaden a "sameAs" para que Google relacione esas fichas con la empresa.
    profiles: (data.perfiles || [])
      .map((p) => ({ name: text(p.nombre), url: text(p.url) }))
      .filter((p) => p.name && p.url),

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

    // Aviso de cookies: solo se activa si hay alguna categoría que necesite consentimiento.
    cookieConsent: {
      enabled: consentCategories.length > 0,
      storageKey: CONSENT_STORAGE_KEY,
      maxAgeDays: CONSENT_MAX_AGE_DAYS,
      version: consentVersion(consentCategories),
      categories: consentCategories,
    },

    // Google Analytics 4 (vacío = sin analítica). Solo se carga tras aceptar las cookies.
    analytics: {
      gaId,
      cookieExpires: ANALYTICS_COOKIE_DAYS * 24 * 60 * 60,
    },

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
