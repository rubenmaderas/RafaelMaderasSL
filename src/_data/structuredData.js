import { getSite } from "../_lib/site.js";
import { getFaq, getServices } from "../_lib/data.js";
import { applyTokens, plainText } from "../_lib/text.js";

/**
 * DATOS ESTRUCTURADOS (JSON-LD, Schema.org)
 * ---------------------------------------------------------------------------
 * Se generan a partir de los contenidos editables (empresa, servicios y preguntas
 * frecuentes). No edites aquí los datos del negocio: cámbialos en /admin.
 */

function business(site, abs, businessId) {
  const services = getServices();
  const sameAs = site.social.filter((s) => s.url).map((s) => s.url);

  const node = {
    "@type": "GeneralContractor",
    "@id": businessId,
    name: site.name,
    legalName: site.registeredName,
    taxID: site.taxId,
    description: plainText(site.description, site),
    founder: { "@type": "Person", name: site.founder.name, jobTitle: "Fundador y gerente" },
    foundingDate: String(site.foundedYear),
    url: abs("/"),
    telephone: site.phone.e164,
    email: site.email.address,
    image: abs(site.seo.ogImage),
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      postalCode: site.address.postalCode,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
    areaServed: site.areaServed.map((area) => ({ "@type": area.type, name: area.name })),
    knowsAbout: [...services.yeso, ...services.reformas].map((s) => applyTokens(s.titulo, site)),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios de yeso y reformas",
      itemListElement: [...services.yeso, ...services.reformas].map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: plainText(s.titulo, site),
          description: plainText(s.resumen, site),
          url: abs(`/servicios/#${s.id}`),
        },
      })),
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: site.phone.e164,
      email: site.email.address,
      areaServed: "ES",
      availableLanguage: "es",
    },
  };

  if (!site.founder.name) delete node.founder;
  if (sameAs.length) node.sameAs = sameAs;
  return node;
}

export default {
  /**
   * @param {{url: string, title: string, description: string, breadcrumb?: string, includeFaq?: boolean}} page
   */
  forPage({ url, title, description, breadcrumb, includeFaq }) {
    const site = getSite();
    const abs = (path) => new URL(path, site.url + "/").href;
    const businessId = abs("/#empresa");
    const websiteId = abs("/#web");
    const pageUrl = abs(url);
    const isHome = url === "/";

    const webPage = {
      "@type": "WebPage",
      "@id": `${pageUrl}#pagina`,
      url: pageUrl,
      name: title,
      description,
      inLanguage: "es-ES",
      isPartOf: { "@id": websiteId },
      about: { "@id": businessId },
    };

    const graph = [
      business(site, abs, businessId),
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: abs("/"),
        name: site.name,
        inLanguage: "es-ES",
        publisher: { "@id": businessId },
      },
      webPage,
    ];

    if (!isHome && breadcrumb) {
      const breadcrumbId = `${pageUrl}#migas`;
      webPage.breadcrumb = { "@id": breadcrumbId };
      graph.push({
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: abs("/") },
          { "@type": "ListItem", position: 2, name: breadcrumb, item: pageUrl },
        ],
      });
    }

    if (includeFaq) {
      graph.push({
        "@type": "FAQPage",
        "@id": `${pageUrl}#preguntas-frecuentes`,
        mainEntity: getFaq().map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.paragraphs.join(" ") },
        })),
      });
    }

    return { "@context": "https://schema.org", "@graph": graph };
  },
};