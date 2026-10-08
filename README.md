# Web de Rafael Maderas S.L. · Trabajos de yeso y reformas en Jaén

Web estática para **Rafael Maderas S.L.**: trabajos de yeso (actividad principal) y reformas con gremios coordinados en Jaén capital, la provincia de Jaén y el resto de Andalucía.

Está hecha con [Eleventy 3](https://www.11ty.dev/), que genera HTML estático sin frameworks en el navegador. Las imágenes se optimizan al compilar (AVIF, WebP y JPEG con `srcset` y dimensiones declaradas), la tipografía (Manrope) se sirve desde el propio dominio y no se carga **ningún servicio de terceros**: ni píxeles, ni fuentes externas. La única excepción es opcional: **Google Analytics**, que se activa desde el gestor y solo se carga si el visitante lo acepta en el aviso de cookies (ver [Cookies y consentimiento](#cookies-y-consentimiento)). 

Los textos, las fotos y los datos de la empresa se editan **sin tocar código** desde el gestor de contenidos en **`/admin`** (usuario y contraseña). Ver [Gestor de contenidos](#gestor-de-contenidos-admin).

> ⚠️ **Antes de publicar**, revisa las afirmaciones de la sección [Afirmaciones que hay que validar](#afirmaciones-que-hay-que-validar) y pide a una gestoría o asesoría que revise los textos legales. Si algún dato legal vuelve a quedar como `PENDIENTE DE SUSTITUIR ANTES DE PUBLICAR`, la página legal afectada mostrará automáticamente un aviso de «Texto provisional».

---

## Requisitos

- Node.js 22 o superior (probado con Node 24).
- En Windows PowerShell, usa `npm.cmd` en lugar de `npm` si la política de ejecución bloquea los scripts.

## Uso

```bash
npm install
npm run dev
npm run build
npm run preview
npm run clean
npm run og
npx decap-server
```

| Comando | Para qué sirve |
| --- | --- |
| `npm install` | Instala las dependencias (solo la primera vez). |
| `npm run dev` | Servidor local con recarga automática: http://localhost:8080 |
| `npm run build` | Genera la web lista para publicar en `_site/`. |
| `npm run preview` | Compila y sirve `_site/` como en producción: http://localhost:8090 |
| `npm run clean` | Borra `_site/`. |
| `npm run og` | Regenera la imagen para redes sociales y el icono de iOS. |
| `npx decap-server` | En otra terminal: permite usar /admin en local, sin Netlify. |

Los comandos van sin comentarios para poder ejecutarlos desde el botón ▶ del IDE: en Windows, un `# comentario` al final de la línea se pasa como argumento y Eleventy falla con «We don’t know what '#' is».

> **Para medir con Lighthouse usa `npm run preview`, no `npm run dev`.** El servidor de desarrollo no comprime, no envía cabeceras de caché e inyecta un script de recarga automática, así que Lighthouse avisaría de problemas que en producción no existen. `preview` aplica las mismas cabeceras (`_headers`) y la compresión que tendrá la web publicada. Mantén la pestaña en primer plano mientras se analiza; si no, Chrome no pinta la página y Lighthouse da el error `NO_FCP`.

El dominio definitivo (`https://rafaelmaderas.es`) ya está en `src/_lib/site.js` (constante `DOMAIN`) y se usa en canonical, sitemap, Open Graph y datos estructurados. Solo si cambiara, compila con la variable `SITE_URL` o edita esa constante (y `site_url` en `src/admin/config.yml`):

```bash
# macOS / Linux
SITE_URL=https://otrodominio.es npm run build
# Windows PowerShell
$env:SITE_URL="https://otrodominio.es"; npm.cmd run build
```

## Estructura

```
eleventy.config.js        Configuración: imágenes, CSS/JS minificados, filtros, CSP, copia de recursos
netlify.toml              Despliegue en Netlify
scripts/generate-og.js    Genera la imagen Open Graph y el icono de iOS
scripts/preview.js        Servidor local que imita producción (npm run preview)
src/
  _data/
    contenido/            ★ CONTENIDO EDITABLE (lo modifica el gestor /admin)
      empresa.json          Nombre, teléfono, correo, WhatsApp, fundador, datos legales, redes
      paginas/*.json        Textos y SEO de Inicio, Servicios, Reformas, Zonas, Quiénes somos, Contacto
      servicios.json        Trabajos de yeso, tipos de reforma y gremios
      preguntas.json        Preguntas frecuentes por página (HTML visible + JSON-LD FAQPage)
      imagenes.json         Fotos de la web (archivo, texto alternativo, créditos)
      comun.json            Textos compartidos: marca, proceso de trabajo, bloque de contacto, pie
    site.js · images.js · services.js · faq.js · hasIllustrativeImages.js
                          Adaptadores: pasan el contenido a las plantillas (no hace falta tocarlos)
    navigation.js         Menú principal y enlaces del pie
    structuredData.js     Datos estructurados JSON-LD (GeneralContractor, etc.)
    domainRedirects.js    Redirecciones 301 de dominio (www, *.netlify.app) para Netlify
  _lib/
    site.js               Dominio, ajustes técnicos (cookies y analítica) y datos derivados (enlaces, años de oficio…)
    content.js · data.js · text.js   Lectura y validación del contenido, comodines y formato
  admin/
    index.njk             Página del gestor (/admin/), con su propia CSP
    config.yml            ★ Qué se puede editar en el gestor, con etiquetas y ayudas en español
    cms.js                Vistas previas del gestor (y vista de Google)
  _includes/
    layouts/              Plantilla base y plantilla de páginas legales
    partials/             Cabecera, pie, CTA, barra móvil, FAQ, proceso, cookies…
    macros/icons.njk      Iconos SVG en línea
  assets/
    css/main.css          Estilos (paleta y tipografía en variables al principio)
    css/consent.css       Estilos del aviso de cookies (solo si Google Analytics está activado)
    js/main.js            Menú móvil y barra de contacto móvil
    js/consent.js         Aviso de cookies y consentimiento (solo si Google Analytics está activado)
    js/analytics.js       Google Analytics 4 (solo se ejecuta si el visitante acepta las cookies)
    img/originals/        ★ Fotos originales (se optimizan al compilar; el gestor sube aquí las nuevas)
    img/og/               Imagen para redes sociales (1200×630)
    favicon.svg · apple-touch-icon.png
  index.njk               Inicio                  → /
  servicios.njk           Servicios               → /servicios/
  reformas.njk            Reformas                → /reformas/
  zonas-de-servicio.njk   Zonas de servicio       → /zonas-de-servicio/
  quienes-somos.njk       Quiénes somos           → /quienes-somos/
  contacto.njk            Contacto                → /contacto/
  aviso-legal.njk         Aviso legal             → /aviso-legal/
  politica-de-privacidad.njk                      → /politica-de-privacidad/
  politica-de-cookies.njk                         → /politica-de-cookies/
  404.njk                 Página de error         → /404.html
  robots.njk · sitemap.njk                        → /robots.txt · /sitemap.xml
  headers.njk · redirects.njk · htaccess.njk      → /_headers · /_redirects · /.htaccess
```

Los textos de las seis páginas principales, su título y su descripción para Google están en `src/_data/contenido/` y se cambian desde **/admin**. Las plantillas `.njk` solo contienen la maquetación. Los textos legales, el menú, las etiquetas de los botones y la página 404 siguen en código.

### Tono de los textos

La web habla como **empresa**: «nosotros» (hacemos, coordinamos, te llamamos) y trata al cliente de **tú**. Es lo habitual en las webs de empresas de reformas y de yeso que se analizaron. Rafael aparece por su nombre solo en «Quiénes somos», como **fundador y gerente** (en /admin → «Datos de la empresa» → «Fundador»). En el resto de la web se habla de «nuestro fundador» para explicar los 40 años de oficio.

Los **40 años** son de oficio del fundador, no de la empresa, que se constituyó el 27/12/2011 («Fecha de constitución»). La cifra se calcula al compilar a partir del año en que empezó en el oficio (1986), así que sube sola cada año cuando se vuelve a publicar la web. En los textos se escribe con el comodín `{años}`. Mantén esta distinción si se reescribe algún texto, y no añadas cifras de plantilla, obras u opiniones que no se puedan demostrar.

### Estilo de redacción

Los textos se han reescrito dos veces. La segunda, a partir de un análisis de unas 50 webs de servicios:
- empresas de reformas y yeso de España (Adiós Gotelé, Adrisan, Irureform, Reformas Dodo, Reformeo, Honra2…);
- oficios cercanos (HUMIX, Todo Humedad, Te Lo Pinto, Gracias Paco);
- yesistas del Reino Unido y EE. UU. (AJS Plastering, Beams, Boston Plastering);
- guías de redacción web (Nielsen Norman Group, GOV.UK, CXL);
- las búsquedas que sugiere Google en España.

Al añadir o cambiar textos desde /admin, conviene mantener estas pautas:

- **Primer párrafo con tres respuestas**: qué hacemos, dónde y por qué nosotros.
- **Beneficio antes que técnica**: primero lo que nota el cliente en casa (paredes lisas, listas para pintar) y después, si hace falta, el nombre técnico, explicado una sola vez.
- **Las dudas del cliente, con sus palabras**: «¿Y si al final cuesta más?», «¿Tendré que organizar yo a los gremios?». Cada duda lleva una respuesta concreta, no adjetivos.
- **Contar también lo incómodo**: el yeso mancha, una grieta puede necesitar un técnico, una humedad hay que resolverla antes de tapar. Da más confianza que prometer que todo saldrá perfecto.
- **Precio: explicar de qué depende**, sin cifras, y pedir fotos para orientar.
- **Llamadas a la acción de poco esfuerzo**: «Mándanos unas fotos por WhatsApp», con lo que conviene enviar y lo que pasa después.
- **Frases cortas y listas**: una idea por párrafo, con la palabra clave al principio de cada viñeta. En los textos largos, el botón de lista del editor crea las viñetas (una línea que empiece por `- ` también funciona).
- **Negrita con moderación**: una o dos ideas clave por bloque (`**texto**` o el botón **B**). Si todo va en negrita, nada destaca. Resalta el beneficio, no el término técnico que se explica en la misma frase (maestras, guardavivos) ni lo que ya dice el título de encima. Como referencia, **no más de una negrita por cada 50 palabras** de la página: los analizadores SEO avisan si hay más. En las insignias de la portada y en el «Orden de obra» de Reformas, la negrita se muestra como etiqueta y no cuenta.
- **Las palabras de quien busca**: «quitar el gotelé», «yesista» o «yesero», «licencia para reformar». Las preguntas frecuentes responden a lo que más se busca: precio, gotelé, secado, proyectado o a mano, grietas y licencias.
- **No prometer lo que no esté confirmado**: garantías por escrito, presupuesto gratuito o cerrado, plazos de respuesta o precios. Si alguno es cierto, se puede añadir, y es de lo que más convence.

### Rigor técnico

En 2026 se revisaron todos los textos de obra como lo haría un contratista, contrastándolos con fuentes técnicas y legales:
- el *Manual de ejecución de revestimientos con yeso* de ATEDY (2023);
- el CTE DB-HS, el REBT y el generador de precios de CYPE;
- la ley andaluza LISTA, la Ley de Propiedad Horizontal y las ordenanzas del Ayuntamiento de Jaén.

Al editar textos de obra, conviene respetar estas pautas:

- **El espesor del yeso no es igual en toda la pared**: varía para absorber los desniveles del soporte, normalmente entre 1 y 2 cm. Lo que el proyectado deja uniforme es la mezcla, la superficie plana y la ausencia de empalmes. No vuelvas a escribir «el mismo espesor en toda la pared».
- **Guarnecido y enlucido** es el sistema tradicional en dos capas, pero no el único correcto: el proyectado puede quedar terminado en una sola capa.
- **El yeso es solo para interiores** y no para zonas con humedad permanente. Sobre hormigón liso o pintura necesita antes un puente de unión.
- **Gotelé**: el de temple se rasca tras humedecerlo; el de pintura plástica se rebaja y se cubre, sobre una imprimación de agarre.
- **Secado**: ningún plazo fijo; como referencia, al menos dos semanas, y una imprimación selladora antes de la pintura plástica. El color claro indica que está seco, pero no lo prueba: eso se comprueba con un medidor.
- **Orden de una reforma**:
  1. demoliciones;
  2. tabiques y premarcos;
  3. instalaciones, probadas a la vista;
  4. recrecido del suelo;
  5. yeso y falsos techos;
  6. alicatado y solado;
  7. carpintería y pintura;
  8. montaje final.

  El recrecido nunca va antes de las tuberías que pasan por el suelo.
- **Electricidad y gas**: solo los ejecuta una empresa instaladora habilitada. No escribas que la empresa «emite el boletín» salvo que esté habilitada como instaladora.
- **Licencias**: no digas «sin licencia» ni «sin papeles». La declaración responsable también es un trámite municipal, con su impuesto (ICIO) y su tasa.

En las preguntas frecuentes, las respuestas son texto sin formato: una línea en blanco separa párrafos. Así la respuesta visible y la de los datos estructurados coinciden siempre. Cada pregunta tiene un campo **Página** que decide dónde se muestra:
- **Inicio**: las dudas generales.
- **Servicios**: las del yeso.
- **Reformas**: las de obras.

---

## Gestor de contenidos (/admin)

En **`https://rafaelmaderas.es/admin/`** hay un panel en español, protegido con **correo y contraseña**, para cambiar la web sin tocar código. Está hecho con [Decap CMS](https://decapcms.org/) (código abierto, alojado en la propia web) y con **Netlify Identity** para el acceso. No hay base de datos: cada vez que alguien pulsa «Publicar», el gestor guarda el cambio en el repositorio de GitHub y Netlify vuelve a construir y publicar la web en uno o dos minutos. Así queda un historial de todos los cambios, y cualquiera se puede deshacer.

### Qué se puede editar

| Sección del gestor | Qué contiene |
| --- | --- |
| **Páginas** | Textos de Inicio, Servicios, Reformas, Zonas de servicio, Quiénes somos y Contacto, cada uno con su título y descripción para Google |
| **Servicios** | Trabajos de yeso, tipos de reforma y gremios que se coordinan |
| **Preguntas frecuentes** | Preguntas y respuestas de Inicio, Servicios y Reformas; cada pregunta elige su página y se actualiza a la vez en la web y en los datos para Google |
| **Fotos de la web** | Cada foto, su encuadre, su descripción (texto alternativo), si es ilustrativa y sus créditos |
| **Textos comunes** | Proceso de trabajo, bloque final de contacto, textos del pie y chat de WhatsApp |
| **Datos de la empresa** | Nombre, teléfono, correo, mensaje de WhatsApp, fundador, datos legales y redes sociales |

**Chat de WhatsApp** («Textos comunes → Chat de WhatsApp»): ventana de chat propia, gratuita, sin cookies ni scripts de terceros. En ordenador se abre con un botón flotante abajo a la derecha; en el móvil, con el botón «WhatsApp» de la barra inferior. Muestra un saludo y unas opciones («Pedir presupuesto», «Consultar una reforma»…); cada una abre WhatsApp con su mensaje ya escrito, que el cliente puede completar antes de enviarlo. Sin JavaScript, el botón de la barra abre WhatsApp directamente. Con Google Analytics activo, cada opción pulsada se mide como `clic_whatsapp` con `ubicacion: chat` y `opcion`. Para las respuestas automáticas (bienvenida, ausencia fuera de horario, respuestas rápidas) usa la app gratuita **WhatsApp Business** en el móvil de la empresa: Herramientas para la empresa → Mensaje de bienvenida / Mensaje de ausencia / Respuestas rápidas.

A la derecha de cada formulario hay una **vista previa** con el aspecto de la web y, en las páginas, una simulación del resultado en Google con el recuento de caracteres. En el móvil la vista previa se oculta para dejar sitio al formulario; se puede editar desde el móvil, aunque en una tableta o un ordenador es más cómodo.

Trucos para escribir:
- **Comodines**: `{empresa}`, `{telefono}`, `{correo}`, `{años}`, `{fundacion}`, `{fundador}`, `{cargo}`, `{oficio}`, `{razon_social}` y `{cif}` se sustituyen solos por los datos de «Datos de la empresa». Si cambia el teléfono, cambia en toda la web.
- **Palabra resaltada en color** en los títulos: escríbela entre asteriscos, por ejemplo `Yesista en *Jaén*: alisados, proyectados y reformas sin complicaciones`. En el título de portada, las palabras de una letra («y», «o», «a») se unen solas a la siguiente y las dos últimas palabras van juntas, para que nunca quede una palabra suelta al final de una línea; en tableta el tamaño se ajusta al ancho de la columna. Si el título pasa de 45 caracteres, la letra se reduce un poco de forma automática para que los botones «Llamar ahora» y «WhatsApp» sigan a la vista sin desplazarse en portátiles de 1366×768.
- **Negrita** en los textos largos: botón **B** del editor (o `**así**`).
- En la portada, la **nota bajo los botones** («Sin compromiso…») es opcional, y cada tarjeta de «Por qué elegirnos» puede llevar una **duda del cliente** que aparece encima del título. Si se dejan vacías, no se muestran.
- Los campos tienen ayudas y validaciones (longitud del título para Google, formato de teléfono, CIF, etc.). Si algo no es válido, el gestor no deja publicar y señala el campo.

**Cambiar una foto:** «Fotos de la web» → abre la foto → «Elige una imagen diferente» → «Subir nuevo» → elige la foto → «Confirmar selección». Después:
1. Escribe en **Descripción** lo que se ve en la foto nueva.
2. Si es un **trabajo real de la empresa**, desmarca **Imagen ilustrativa** (desaparecen la etiqueta y, cuando no quede ninguna, el aviso del pie) y deja los créditos vacíos.
3. Si al recortarse se corta una cabeza o lo importante, cambia el **Encuadre** («Arriba» para fotos de personas, «Abajo» si el motivo está en la parte baja).
4. Pulsa **Publicar → Publicar ahora**.

Las fotos deben ser **JPG o PNG** (no HEIC: en el iPhone, Ajustes → Cámara → Formatos → «Más compatible», o compártelas por WhatsApp o correo primero). El gestor las reduce a 2000 px de ancho y **elimina los metadatos** (ubicación GPS, modelo del móvil) antes de subirlas. Al compilar se generan las versiones AVIF, WebP y JPEG de cada tamaño. Pide permiso al cliente y evita que se vean datos personales, matrículas o direcciones reconocibles.

### Puesta en marcha (una sola vez)

1. **Sube el proyecto a GitHub** en un repositorio privado, con la rama `main`. Si el repositorio es público o se llama `usuario.github.io`, GitHub intenta publicarlo además con **GitHub Pages** (Jekyll), que no sabe compilar esta web: falla en cada cambio y te envía un correo. Hazlo privado o, en *Settings → Pages*, despublícalo (*Unpublish site*). La web se publica en Netlify.
2. En **Netlify**: *Add new site → Import an existing project* → elige el repositorio. `netlify.toml` ya indica el comando (`npm run build`) y la carpeta (`_site`).
3. En la pestaña **Identity** del proyecto de Netlify, pulsa **Enable Identity**. Está incluido en el plan gratuito.
   - En la configuración de Identity (*Registration preferences*), marca **Invite only**. Es importante: así nadie puede registrarse por su cuenta.
   - No hace falta activar proveedores externos (Google, GitHub…). Basta con correo y contraseña.
4. En **Identity → Services → Git Gateway**, pulsa **Enable Git Gateway**. Permite que el gestor guarde los cambios en GitHub sin que los editores tengan cuenta de GitHub. Si ya está conectado el dominio propio, comprueba antes que el HTTPS funciona (lo pide Netlify).
5. En **Identity → Invite users**, invita a los correos de las personas que vayan a editar la web. Cada una recibe un correo; al pulsar el enlace llega a la web, que la lleva sola a `/admin/` para **elegir su contraseña**. A partir de ahí entra en `/admin/` con su correo y contraseña. La recuperación de contraseña funciona igual.
6. Conecta el dominio (ver [Despliegue](#despliegue)).

Nota: Netlify marca **Git Gateway** como función en fase *beta*, aunque lleva años en uso con este mismo tipo de gestor. Si algún día dejara de estar disponible, el gestor se puede conectar directamente a GitHub (`backend: github` en `config.yml`; los editores entrarían con una cuenta de GitHub) sin cambiar el contenido.

### Si un cambio no aparece en la web

- Espera 1–2 minutos y recarga la página.
- En Netlify → **Deploys**, mira si la última publicación ha fallado (en rojo). El registro indica el motivo, por ejemplo una foto dañada o un dato no válido en `empresa.json` (el mensaje dice qué corregir en /admin).
- Para deshacer un cambio: en Netlify → Deploys, abre una publicación anterior y pulsa **Publish deploy**. Después corrige el texto en /admin. También se puede revertir el cambio en GitHub.

### Editar en local (para desarrollo)

Con `npm run dev` en una terminal y `npx decap-server` en otra, abre `http://localhost:8080/admin/`. Los cambios se guardan directamente en los archivos del proyecto, sin contraseña y sin publicar nada.

### Límites del gestor

- **Textos legales** (aviso legal, privacidad, cookies), menú, etiquetas de los botones y la página 404: se cambian en código. Los datos que contienen (razón social, CIF, domicilio, correo, alojamiento, fecha) sí salen de «Datos de la empresa».
- **Imagen para redes sociales** (`og-rafael-maderas.jpg`): incluye el nombre, el teléfono y los años de oficio, y se genera en local con `npm run og`. Si cambian esos datos, regenérala y súbela.
- Las **secciones de las páginas** son fijas: se cambian los textos, las listas y las fotos, pero no se pueden añadir secciones nuevas sin programar. Por ahora el gestor tampoco permite borrar entradas completas.
- Decap CMS está fijado en la versión 3.16.3. Si se actualiza, comprueba el gestor en el móvil (los ajustes de pantalla estrecha de `src/admin/index.njk` dependen de sus clases CSS).

---

## Qué hay que sustituir antes de publicar

### 1. Datos legales (/admin → «Datos de la empresa» → «Datos legales»)

Están **todos completos** y se guardan en `src/_data/contenido/empresa.json`. Los datos registrales proceden del **BORME n.º 19 de 27/01/2012** (Registro Mercantil de Jaén, anuncio 42487, constitución de la sociedad); la empresa ha confirmado que la sociedad sigue activa. Si cambia algún dato (domicilio, administración…), actualízalo desde el gestor:

| Campo | Valor actual | Dónde aparece |
| --- | --- | --- |
| Razón social (`razonSocial`) | Rafael Maderas Sociedad Limitada | Aviso legal, JSON-LD (`legalName`) |
| CIF (`cif`) | B23691108 | Aviso legal, pie, privacidad, JSON-LD (`taxID`) |
| Domicilio social (`domicilio`) | Calle Perú, 2 A, 23002 Jaén (Jaén) | Aviso legal, privacidad, JSON-LD |
| Registro Mercantil (`registroMercantil`) | Registro Mercantil de Jaén, tomo 498, folio 51, sección 8.ª, hoja J-19041, inscripción 1.ª | Aviso legal |
| Dominio (constante `DOMAIN` en `src/_lib/site.js`, en código) | rafaelmaderas.es | Aviso legal, canonical, sitemap, Open Graph |
| Responsable del tratamiento | Se compone con la razón social, el CIF y el domicilio | Política de privacidad |
| Contacto para ejercer derechos | Correo electrónico o correo postal al domicilio social | Política de privacidad |
| Alojamiento (`hosting`) | Netlify, Inc. (EE. UU., adherida al Marco de Privacidad de Datos UE-EE. UU.) | Política de privacidad |
| Última actualización (`ultimaActualizacion`) | 30 de septiembre de 2026 | Las tres páginas legales |

- **Redes sociales:** solo está publicado el Perfil de Empresa de Google. El aviso legal solo muestra el apartado de perfiles si alguna red tiene URL.
- **Cookies:** mientras no se active Google Analytics, la política de cookies indica que la web no instala ninguna para los visitantes. Netlify no añade cookies a un sitio estático como este; compruébalo tras publicar en DevTools → Application → Cookies. La única excepción es el acceso a **/admin**: Netlify Identity guarda una cookie técnica de sesión (`nf_jwt`) y la sesión en el almacenamiento local, solo a quien inicia sesión. Ya figura en la política. Si se activa Google Analytics, las políticas de cookies y de privacidad se completan solas (ver [Cookies y consentimiento](#cookies-y-consentimiento)). Si se activan otras funciones de Netlify que usen cookies (pruebas A/B…), hay que añadirlas a `src/politica-de-cookies.njk`.
- **Aviso «Texto provisional»:** ya no aparece porque no queda ningún `PENDIENTE`. Vuelve a salir solo si se vacía algún dato legal.

Aun así, **pide a una gestoría o asesoría que revise los textos** y actualiza la fecha de «Última actualización» cada vez que cambien. Son una base de trabajo, no asesoramiento jurídico.

### 2. Dominio: `rafaelmaderas.es`

Está configurado como URL canónica (sin `www`) en `src/_lib/site.js` y en `src/admin/config.yml` (`site_url`). Antes de publicar hay que **registrarlo** (a 30/09/2026 no existe en el DNS) en un registrador acreditado para `.es` y conectarlo a Netlify (ver [Despliegue](#despliegue)).

### 3. Redes sociales (/admin → «Datos de la empresa» → «Redes sociales»)

Facebook e Instagram están sin URL y no se muestran. El **Perfil de Empresa de Google** sí está enlazado (`https://www.google.com/search?kgmid=/g/11zy0mhnvy`, el identificador permanente de la ficha): aparece en el pie («Encuéntranos») y en el aviso legal, y se añade a `sameAs` en los datos estructurados. Cualquier red con URL real se muestra igual.

**Fichas en portales** (/admin → «Datos de la empresa» → «Fichas en portales y directorios»): las fichas de la empresa en Empresite y Milanuncios se añaden a `sameAs` para que Google las relacione con la web, pero no se muestran en ella. Si un anuncio caduca o se borra, quítalo de esa lista.

### 4. Imágenes (/admin → «Fotos de la web»)

La **foto principal de la portada es real**: un yesista de la empresa en obra (`principal.jpg`, encuadre «Arriba»). No lleva etiqueta ni créditos. Las demás fotos son **provisionales**, de Unsplash (licencia Unsplash, apta para uso comercial sin atribución obligatoria). Se muestran con la etiqueta «Imagen ilustrativa» y hay un aviso en el pie que indica que no son obras de la empresa. En el Aviso legal figuran los créditos.

| Foto en el gestor (clave) | Archivo | Se usa en | Autor |
| --- | --- | --- | --- |
| Portada: foto principal (`hero_yeso`) | principal.jpg | Inicio (portada, con el efecto «llana») | Foto propia de la empresa |
| Reformas (`reforma_interior`) | reforma-interior.jpg | Inicio (reformas) y Reformas (cabecera) | immo RENOVATION |
| Albañilería (`albanileria`) | albanileria.jpg | Servicios (reformas) y Reformas (gremios) | Solømen |
| Alicatado (`alicatado`) | alicatado.jpg | Reformas (gremios) | charlesdeluvio |
| Acabado interior (`acabado_interior`) | acabado-interior.jpg | Servicios (trabajos de yeso) | Clay Banks |
| Herramientas (`herramientas`) | herramientas.jpg | Quiénes somos | Annie Spratt |
| Jaén (`jaen`) | jaen.jpg | Inicio (zonas) y Zonas de servicio | Sergio Guardiola Herrador (Baños de la Encina, Jaén) |

**Cómo sustituir una imagen:** desde el gestor, como se explica en [Gestor de contenidos](#gestor-de-contenidos-admin). Sin gestor: copia la foto (JPG o PNG, de 1600 px de ancho o más) en `src/assets/img/originals/`, cambia `foto` y `alt` en `src/_data/contenido/imagenes.json`, pon `"ilustrativa": false` si es un trabajo real (y `"encuadre": "arriba"` o `"abajo"` si hace falta) y ejecuta `npm run build`.

Consejos para las fotos reales: pide permiso al cliente, no muestres datos personales ni direcciones reconocibles, y prioriza el antes y el después de paredes, techos y reformas. La foto de portada («Portada: foto principal») se recorta cuadrada en móvil y vertical (4:5) en tableta y escritorio; en móvil aparece debajo del título y de los botones de contacto. Si es de una persona, usa el encuadre «Arriba», y deja libres las esquinas, donde van las tarjetas de «Experiencia» y «Un único interlocutor».

La imagen para redes sociales (`src/assets/img/og/og-rafael-maderas.jpg`) es tipográfica. Se regenera en local con `npm run og` a partir de «Datos de la empresa» (no se actualiza sola al editar en /admin). También puedes sustituirla por una foto real de 1200×630 px.

### 5. Logotipo y colores de marca

El azul y el coral de la web salen de la rotulación de la furgoneta de la empresa. Son valores **aproximados**, tomados de una foto:

| Variable (`main.css`) | Valor | Uso |
| --- | --- | --- |
| `--color-accent` | `#1f4f9c` | Enlaces, botón de WhatsApp, detalles (contraste AA sobre fondos claros) |
| `--color-accent-strong` | `#173d7a` | Estado *hover* del acento |
| `--color-accent-on-dark` | `#f5a598` | Títulos pequeños sobre fondo oscuro |
| `--color-brand-coral` | `#f08070` | Solo decorativo (franja bajo la cabecera). No usar para texto sobre fondo claro: no tiene contraste suficiente. |

La cabecera usa, de momento, la marca tipográfica «Rafael Maderas S.L.». No se ha recreado el logotipo de la furgoneta a partir de la foto, porque quedaría de baja calidad.

**Pide al rotulista el logotipo original en vectorial (SVG, PDF o AI) y los colores exactos (Pantone o CMYK).** Con eso:
1. Ajusta los colores en las variables del principio de `src/assets/css/main.css` y en `scripts/generate-og.js`. Comprueba que el texto sigue teniendo contraste AA (4,5:1).
2. Guarda el logotipo como `src/assets/img/logo.svg` y sustituye el texto de la marca en `src/_includes/partials/header.njk` (bloque `.brand`) por `<img src="/assets/img/logo.svg" alt="Rafael Maderas S.L." width="…" height="…">`, con sus dimensiones reales.
3. Añade la URL del logotipo como `logo` en el JSON-LD (`src/_data/structuredData.js`, objeto `GeneralContractor`). Si has cambiado los colores, ejecuta `npm run og`.

El teléfono se define una sola vez (/admin → «Datos de la empresa» → «Teléfono y WhatsApp»). Desde ahí se generan todos los enlaces, textos, FAQ y datos estructurados.

---

## Despliegue

La carpeta que se publica es **`_site/`** (se genera con `npm run build`). Incluye `404.html`, `robots.txt`, `sitemap.xml` y tres archivos de configuración de servidor: `_headers` (Netlify y Cloudflare Pages), `_redirects` (Netlify) y `.htaccess` (Apache).

### Netlify (alojamiento elegido)
1. Conecta el repositorio. `netlify.toml` ya define el comando (`npm run build`), la carpeta (`_site`) y la versión de Node. No hace falta `SITE_URL`: el dominio ya está en `src/_lib/site.js`. Para activar el gestor /admin, sigue [Puesta en marcha](#puesta-en-marcha-una-sola-vez).
2. **Desactiva la insignia «Powered by Netlify»** en *Project configuration → General → Powered by Netlify badge*; el cambio se aplica sin volver a publicar. En los proyectos gratuitos creados desde agosto de 2026, Netlify inyecta en cada página un script propio (`/.netlify/scripts/hud`) con un anuncio para los visitantes. La política de seguridad (CSP) de la web lo bloquea, así que no llega a verse, pero carga 10 KB de JavaScript en cada visita y deja dos errores en la consola, que bajan «Best Practices» en Lighthouse a 92. Para comprobarlo: `curl.exe -s -A "Mozilla/5.0 Chrome/140" https://rafaelmaderas.netlify.app/ | Select-String "netlify/scripts/hud"` no debe devolver nada.
3. En *Domain management*, añade `rafaelmaderas.es` como **dominio principal** (*primary domain*) y `www.rafaelmaderas.es` como alias (Netlify redirige el `www` al principal).
4. En el registrador del `.es`, lo más sencillo es cambiar los servidores DNS por los de **Netlify DNS**, que indica el propio panel. Así el dominio sin `www` también se sirve desde su CDN.
5. Netlify emite el certificado HTTPS (Let's Encrypt) automáticamente. Actívalo y marca *Force HTTPS* si aparece la opción.
6. Con el dominio ya como principal y el HTTPS activo, **vuelve a publicar** (*Deploys → Trigger deploy → Deploy site*). En esa compilación se genera `_redirects` con redirecciones 301, en un solo salto, de `www.rafaelmaderas.es` y de la dirección `*.netlify.app` a `https://rafaelmaderas.es` (ver `src/_data/domainRedirects.js`). Mientras el dominio principal de Netlify no sea `rafaelmaderas.es`, el archivo sale sin reglas y el registro de la compilación lo avisa: así nunca se redirige a un dominio que aún no funciona.
7. Comprueba después que `https://rafaelmaderas.es/robots.txt` y `https://rafaelmaderas.es/sitemap.xml` cargan, y que `http://rafaelmaderas.es/`, `https://www.rafaelmaderas.es/` y la dirección `*.netlify.app` redirigen con un 301 a `https://rafaelmaderas.es/`. En PowerShell: `curl.exe -sI https://www.rafaelmaderas.es/` (busca `301` y `location: https://rafaelmaderas.es/`) y `curl.exe -sI -H "Accept-Encoding: br, gzip" https://rafaelmaderas.es/` (busca `content-encoding: br`).

### Cloudflare Pages
1. Conecta el repositorio. Comando de compilación: `npm run build`. Directorio de salida: `_site`.
2. Variable de entorno: `NODE_VERSION = 22` (el dominio ya está en `src/_lib/site.js`).
3. Cloudflare Pages lee automáticamente `_headers` y `404.html`. El gestor /admin **no funciona** aquí (necesita Netlify Identity); habría que cambiarlo a `backend: github`.

### Hosting tradicional con Apache (FTP)
1. En tu ordenador: `npm run build`.
2. Sube **todo el contenido** de `_site/`, incluido el archivo oculto `.htaccess`, a la carpeta pública (`public_html`, `www`, `htdocs`…).
3. Con el certificado SSL activo, descomenta en `src/htaccess.njk` las reglas de redirección a HTTPS, la unificación con o sin `www` y la cabecera HSTS. Después vuelve a compilar y subir.
4. El gestor /admin no funciona en Apache (necesita Netlify). Conviene no subir la carpeta `admin/`.

### Rendimiento, seguridad y caché
- **CSS:** se minifica al compilar y se incrusta en cada página (`<style>`). Así no hay ninguna petición que bloquee el primer pintado. Edita siempre `src/assets/css/main.css`; el resultado minificado se genera solo.
- **JavaScript:** se publica minificado, con `defer` y `?v=hash` para invalidar la caché cuando cambia.
- **Content-Security-Policy estricta** (solo recursos propios y, si se activa Google Analytics, sus dominios), en dos partes:
  - Cada página lleva en `<meta http-equiv="Content-Security-Policy">` la política completa, con los hashes de su script y su CSS en línea. Viaja con el propio HTML, así que nunca queda desfasada aunque se suba la web sin el `.htaccess` actualizado.
  - `_headers` y `.htaccess` envían la parte que no cambia, más lo que un `<meta>` no admite (`frame-ancestors`, protección contra *clickjacking*).
- **Otras cabeceras:** `nosniff`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`.
- **Caché:** los recursos de `/assets/` (JS versionado, imágenes con hash en el nombre y fuente) se cachean un año; el HTML se revalida siempre.
- **Compresión:** la aplican automáticamente Netlify y Cloudflare, y en Apache el bloque `mod_deflate` de `.htaccess`.

La CSP se define en `eleventy.config.js`. Allí están el shortcode `cspMeta` (política de cada página), `GA_CSP` (dominios de Google Analytics, que solo se añaden si hay ID de medición) y `cspHeader` (cabecera). El gestor **/admin** tiene su propia política en `src/admin/index.njk`, más permisiva porque Decap CMS la necesita (`'unsafe-eval'` y estilos en línea). No afecta a la web pública. Además, /admin se envía con `noindex` y está excluido en `robots.txt` y en el sitemap.

### Animaciones

Todo el movimiento es decorativo y opcional. Con «reducir movimiento» activado en el móvil o el ordenador (`prefers-reduced-motion`) no se reproduce nada, y sin JavaScript la web se ve completa. Los estilos están en la sección «Animaciones y transiciones» de `src/assets/css/main.css` y la lógica al final de `src/assets/js/main.js`.

- **Efecto «llana» en la foto principal**: la foto aparece cubierta de yeso rugoso y una llana (hoja de acero y mango azul de la marca) la alisa en tres pasadas, en unos 2,5 s. Después aparecen las etiquetas y se dibuja el círculo de los años.
  - Solo se reproduce al entrar en la web. Al volver a la portada desde otra página no se repite.
  - Empieza cuando al menos la mitad de la foto está en pantalla. En móviles pequeños, donde la foto queda debajo de los botones, el yeso la espera tapada y se alisa al bajar hasta ella.
  - No se reproduce si la pestaña está en segundo plano o la carga tarda más de 3 s.
  - Si algo falla, la foto queda visible igualmente a los pocos segundos.
  - La textura de yeso es un SVG generado, sin peso extra de descarga, en la variable `--plaster` de `.js .hero .media`. **Para desactivar el efecto**, borra esa línea: el script detecta que falta y muestra la foto directamente.
- **Entrada del contenido**: el texto de cabecera aparece escalonado, y los bloques que están por debajo de la pantalla se revelan con un ligero desplazamiento al hacer scroll. Lo que ya está a la vista nunca se oculta.
- **Transiciones entre páginas** (fundido suave) en navegadores compatibles (Chrome, Edge y Safari recientes). En el resto se navega como siempre.
- **Desplazamiento suavizado con la rueda del ratón**, solo en ordenador. En móvil y tableta se mantiene el desplazamiento táctil nativo, que ya es fluido. Se detiene al usar el teclado o hacer clic, y respeta el zoom con Ctrl y las zonas con scroll propio.
- **Microinteracciones**: sombra en la cabecera al desplazarse (escritorio), elevación de tarjetas con enlace al pasar el ratón y apertura suave de las preguntas frecuentes.

Las animaciones usan solo `opacity` y `transform` (no desplazan el diseño, CLS 0). Las posiciones se obtienen con `IntersectionObserver` para no forzar cálculos de diseño.

---

## Cookies y consentimiento

La web está preparada para usar **Google Analytics 4** con un aviso de cookies según la [Guía sobre el uso de las cookies de la AEPD](https://www.aepd.es/guias/guia-cookies.pdf) (edición de mayo de 2024). Se activa o se desactiva desde el gestor, sin tocar código:

| ID de Google Analytics en /admin | Qué ocurre |
|---|---|
| Vacío (así está ahora) | La web **no usa cookies ni conecta con terceros** para los visitantes, así que **no se muestra ningún aviso**: sería engañoso pedir consentimiento para algo que no existe. Las políticas lo explican así. |
| `G-…` | Aparece el aviso de cookies y Google Analytics **solo se carga si el visitante pulsa «Aceptar»**. Las políticas de cookies y de privacidad añaden solas la información de Google Analytics, y la CSP, sus dominios. |

La cookie técnica de sesión de /admin (solo para quien edita la web) está exenta de consentimiento y figura en la política de cookies en los dos casos.

### Cómo funciona el aviso
- **Qué dice:** quién usa las cookies, para qué (analítica, no publicidad), que son de un tercero (Google), cómo cambiar de opinión y el enlace a la política de cookies.
- **«Rechazar» y «Aceptar» son iguales** y están juntos. No hay casillas marcadas de antemano, y seguir navegando no cuenta como aceptar. No bloquea la web: se puede navegar sin elegir, y entonces no se instala nada.
- **Sin panel de configuración:** con una sola finalidad, basta con aceptar o rechazar. Si algún día se añade otra (publicidad, vídeos, mapas…), habrá que añadir un panel por categorías y nuevos textos.
- **Nada antes de aceptar:** sin elección, o tras rechazar, el script de Google ni siquiera se descarga. Se usa el modo de consentimiento de Google «básico», con los permisos publicitarios siempre denegados, Google Signals y la personalización de anuncios desactivados, y cookies de 1 año en lugar de 2.
- **Retirar el consentimiento es igual de fácil:** botón «Configurar cookies» en el pie de todas las páginas y en la política de cookies. Al retirarlo se borran las cookies de Google Analytics y la página se recarga sin él.
- **La elección se recuerda 12 meses** en el almacenamiento local del navegador (`rm-consent`, técnico y exento). Pasado ese plazo, o si cambian las finalidades o el proveedor, se vuelve a preguntar automáticamente: la versión se calcula sola en `src/_lib/site.js`.
- **Accesible y ligero:** se maneja con teclado y anuncia la elección a los lectores de pantalla. En móvil oculta la barra de contacto mientras está abierto. Aparece desde el primer pintado, sin parpadeos para quien ya eligió, y mantiene Lighthouse en 100.
- **Clics de contacto:** con la analítica aceptada, se registran como eventos `clic_telefono`, `clic_whatsapp` y `clic_correo`, con el parámetro `ubicacion` (`cabecera`, `barra_movil`, `pie` o `contenido`). No se envía el número, el correo ni el mensaje.

### Cómo activar Google Analytics
1. En [analytics.google.com](https://analytics.google.com/), crea una cuenta y una propiedad de Google Analytics 4 (zona horaria de España, moneda euro) y un **flujo de datos web** para `https://rafaelmaderas.es`. Copia el **ID de medición** (`G-…`).
2. Antes de activarlo, en **Administrar**:
   - **Retención de datos:** 14 meses (es lo que indican las políticas).
   - **Google Signals:** desactivado.
   - **Configuración de uso compartido de datos** (en la cuenta): desactiva «Productos y servicios de Google». Así Google trata los datos solo como encargado del tratamiento, como dicen las políticas.
   - Acepta las condiciones de tratamiento de datos si Analytics te lo pide.
3. En **/admin → Datos de la empresa → Analítica web**, pega el ID. En la misma pantalla, cambia **Datos legales → Fecha de última actualización**, porque los textos legales cambian. Publica.
4. Cuando Netlify termine de publicar, compruébalo en una ventana de incógnito (DevTools → pestañas Network y Application → Cookies):
   - Antes de elegir y tras «Rechazar»: ninguna petición a `googletagmanager.com` ni a `google-analytics.com`, y ninguna cookie `_ga`.
   - Tras «Aceptar»: aparecen las cookies `_ga` y `_ga_…`, y tu visita en Analytics → Informes → Tiempo real.
5. En Analytics → Administrar → Eventos, marca `clic_telefono`, `clic_whatsapp` y `clic_correo` como **eventos clave**: son los contactos que genera la web. Opcional: registra `ubicacion` como dimensión personalizada (ámbito «Evento») para saber desde qué botón llaman.
6. Opcional: vincula Search Console con Analytics (Administrar → Vinculaciones de productos).
7. Pide a la gestoría o asesoría que revise los textos legales con Google Analytics ya activado.

**Para desactivarlo**, borra el ID en el gestor y actualiza la fecha de los textos legales: desaparecen el aviso, los scripts, los dominios de Google en la CSP y la información de Google Analytics de las políticas. Las cookies `_ga` que ya tuvieran algunos visitantes dejan de usarse y caducan solas.

### A tener en cuenta
- **Prueba del consentimiento:** la elección (con su fecha y versión) se guarda solo en el navegador del visitante; una web estática no tiene servidor ni base de datos donde registrarla. Es lo habitual en webs pequeñas. Para un registro centralizado haría falta una plataforma de gestión del consentimiento (CMP).
- **Transferencias a EE. UU.:** Google LLC está adherida al Marco de Privacidad de Datos UE-EE. UU. El Tribunal General de la UE lo avaló en septiembre de 2025 (asunto T-553/23), pero hay un recurso pendiente ante el Tribunal de Justicia (C-703/25 P). Si se anulara, habría que revisar las políticas.
- **Alternativa:** existen herramientas de analítica sin cookies que pueden evitar el aviso. Consúltalo antes con quien revise los textos legales.
- **Dónde está el código:** aviso en `src/_includes/partials/cookie-consent.njk`, lógica en `src/assets/js/consent.js`, estilos en `src/assets/css/consent.css`, Google Analytics en `src/assets/js/analytics.js`, cookies, duraciones y versión en `src/_lib/site.js`, y textos en `src/politica-de-cookies.njk` y `src/politica-de-privacidad.njk`.

---

## SEO: qué incluye y qué hacer después de publicar

**Incluye:**
- `title`, meta description y canonical únicos en cada página. Título principal: «Yesista y Reformas en Jaén | Rafael Maderas S.L.».
- URLs legibles en español, un único H1 por página y encabezados jerárquicos.
- Open Graph y Twitter Card con imagen propia.
- JSON-LD: `GeneralContractor` (nombre, teléfono, email, área de servicio, catálogo de servicios, `sameAs` con las redes reales y las fichas en portales), `WebSite`, `WebPage`, `BreadcrumbList` y `FAQPage` en la portada, Servicios y Reformas, cada una con sus propias preguntas. El FAQ se genera desde `preguntas.json` (/admin → «Preguntas frecuentes»), igual que el HTML visible, así que siempre coinciden. Google solo muestra resultados enriquecidos de FAQ para sitios muy concretos, pero el marcado es correcto y no perjudica.
- `sitemap.xml` (sin legales ni 404) y `robots.txt`. Las páginas legales llevan `noindex, follow`.
- Una única página de zonas con contenido útil, sin páginas duplicadas por municipio (evita las «páginas puerta»).

**Resultado de las pruebas locales** (Lighthouse 13, con `npm run preview`, incluido el efecto «llana»): 100 en rendimiento, accesibilidad, buenas prácticas y SEO en las páginas indexables, tanto en móvil como en escritorio. En móvil, el primer pintado (FCP) llega en unos 0,8 s y el LCP entre 1,1 y 1,4 s. Las legales puntúan menos en SEO porque son `noindex` a propósito.

**Acciones después de publicar** (ninguna garantiza una posición concreta en Google; el posicionamiento local depende sobre todo de la relevancia, la proximidad y la reputación real):
1. **Google Search Console**: verifica el dominio, envía `https://rafaelmaderas.es/sitemap.xml` y revisa la cobertura y los errores cada cierto tiempo.
2. **Perfil de Empresa de Google**: créalo o reclámalo y configúralo así:
   - **Categoría principal**: Google no ofrece «Yesero» ni «Yesista». Escribe «yeso», «enlucido» o «escayola» en el buscador de categorías y elige la más parecida que salga. Si ninguna encaja, usa «Empresa de reformas» como principal. Añade como secundarias las que encajen con el yeso y con las reformas. Las palabras «yesero» y «yesista» ya están en la web y en la descripción del perfil, así que la categoría no tiene que coincidir con ellas.
   - **Descripción**: ya está modificada. Si la cambias, que no contradiga la web (yeso con equipo propio, reformas con gremios coordinados, Jaén y alrededores) y no incluyas enlaces, ofertas ni teléfonos.
   - **Fecha de apertura**: **27/12/2011**, la misma que la «Fecha de constitución» de /admin → «Datos de la empresa», que es la que usa la web («Quiénes somos», inicio y `foundingDate` de los datos estructurados).
   - Configúralo como empresa de área de servicio (Jaén y alrededores), sin mostrar el domicilio si no se atiende allí al público. Usa **exactamente** el mismo nombre, teléfono y web que en la web y enlaza el perfil en /admin → «Datos de la empresa» → «Redes sociales».
3. **Fotos reales** de trabajos (antes y después) en la web y en el Perfil de Empresa, sustituyendo las imágenes de stock.
4. **Reseñas reales**: pídeselas a clientes satisfechos, sin incentivos, y contéstalas. No publiques reseñas en la web que no se puedan verificar.
5. Opcional: Bing Places / Bing Webmaster Tools, y alta en directorios locales serios con los mismos datos de nombre, dirección y teléfono.
6. **Enlaces desde otras webs** (*backlinks*): no se arreglan con código. Llegan del Perfil de Empresa de Google, de directorios serios (por ejemplo, Páginas Amarillas o plataformas de reformas), de proveedores, fabricantes y almacenes con los que se trabaja, de asociaciones del sector o de comercio de Jaén, de colaboradores y de la prensa local. Pocos y de webs reales y cercanas valen más que muchos. **No compres enlaces** ni uses granjas de enlaces: Google lo penaliza.
7. Con el tiempo, añade contenido útil y real: obras terminadas (con permiso del cliente), explicaciones de trabajos concretos o dudas frecuentes nuevas.
8. Opcional: para saber cuántas visitas y llamadas genera la web, activa **Google Analytics** siguiendo [Cómo activar Google Analytics](#cómo-activar-google-analytics).

### Analizadores SEO y de velocidad (Seobility, SEOquake, SEO Tester Online, PageSpeed…)

Analiza siempre la dirección definitiva, **`https://rafaelmaderas.es/`**, cuando ya esté publicada. Antes de corregir nada, comprueba que el informe es de esta web: el título y la URL analizados deben ser los de la web (es fácil pegar por error la dirección del propio analizador).

**No analices a través de ngrok** ni de otros túneles hacia el ordenador. La versión gratuita de ngrok enseña a navegadores y analizadores su propia página de aviso, en inglés, y añade `X-Robots-Tag: noindex, nofollow` a todo lo que sirve. El analizador mide esa página de aviso (unos 740 KB de fuentes y scripts de ngrok: primer pintado de más de 4 s en móvil) o cree que la web bloquea a Google. Para medir antes de tener el dominio, publica en Netlify y pasa [PageSpeed Insights](https://pagespeed.web.dev/) a la dirección `*.netlify.app`; en local, usa `npm run preview`.

Si se analiza una dirección provisional (`*.netlify.app`, una vista previa de Netlify, ngrok o el servidor local), estos avisos son **esperables** y no indican un fallo de la web:

| Aviso | Por qué sale en una dirección provisional | En `rafaelmaderas.es` |
| --- | --- | --- |
| «La página bloquea la indexación» | ngrok añade `X-Robots-Tag: noindex` a todo; Netlify, a las vistas previas; y la canonical apunta a otro dominio | Las páginas llevan `index, follow` y `robots.txt` solo excluye `/admin/` |
| «El canonical apunta a otro dominio» | La canonical siempre apunta a `https://rafaelmaderas.es` (es lo correcto) | Coincide con la dirección |
| «Sin redirección de www / a HTTPS» | Solo se puede comprobar en el dominio propio | Netlify fuerza HTTPS y `_redirects` lleva `www` y `*.netlify.app` al dominio (301) |
| «No se usa compresión GZip» | `npm run dev` no comprime | Netlify comprime el HTML con Brotli o gzip |
| Velocidad baja (FCP, LCP, Speed Index…) | Por ngrok se mide su página de aviso; `npm run dev` no comprime ni guarda en caché | Lighthouse da 100 en móvil con `npm run preview` (FCP 0,7–0,8 s; LCP 1,4 s) y en `rafaelmaderas.netlify.app` (FCP 1,0 s; LCP 1,5 s; TBT 30–40 ms) |

Si pasas **Lighthouse desde tu propio Chrome** (DevTools), hazlo en una **ventana de incógnito**. Las extensiones del navegador también se miden y ensucian el resultado: añaden JavaScript (avisos de «Reduce unused JavaScript» o «Minify JavaScript» de cientos de KB que no son de la web), suben el *Total Blocking Time* y dejan errores en la consola, como `chrome-extension://…`. [PageSpeed Insights](https://pagespeed.web.dev/) no tiene ese problema.

Otros avisos habituales:
- **Errores de CSP en `about:srcdoc` y un recurso `/.netlify/scripts/hud` con caché de 1 minuto**: son de la insignia «Powered by Netlify», no de la web. Desactívala (paso 2 de [Netlify](#netlify-alojamiento-elegido)).
- **«Improve image delivery» en la foto principal**: las fotos ya se sirven en AVIF/WebP en cuatro anchos, y el navegador elige el que necesita según la pantalla. Lighthouse calcula ese ahorro sin tener en cuenta la densidad de píxeles de los móviles, así que no merece la pena reducirlas más: se verían borrosas.
- **Negritas**: ver la pauta de [Estilo de redacción](#estilo-de-redacción) (no más de una por cada 50 palabras).
- **Encabezados repetidos**: cada título de una misma página debe ser distinto, también los del pie («Contacto», «La web», «Legal»). Por eso el primer paso del proceso se llama «Primer contacto».
- **Textos de enlace repetidos**: el menú y el pie usan textos distintos para la misma página (`navigation.js`). En las páginas interiores, «Inicio» sale en el menú y en las migas de pan: es normal y no perjudica.
- **Pocos backlinks**: ver el punto 6 de la lista anterior.
- «La cabecera X-Powered-By no se envía» es **correcto**: no dar pistas del servidor es una buena práctica de seguridad.
- «Enlaces sin atributo `title`»: no se añade. No mejora el posicionamiento y, si repite el texto del enlace, los lectores de pantalla lo leen dos veces; los enlaces ya tienen texto descriptivo.
- «Falta `twitter:site`»: solo tiene sentido con una cuenta real de X (Twitter). La empresa no tiene, y las tarjetas se ven bien sin ella.
- «Faltan palabras del título en el H1 o en la URL»: el H1 y las URL están escritos para leerse con naturalidad («Yesista en Jaén: alisados, proyectados y reformas sin complicaciones», `/reformas/`). Forzar palabras clave para subir esa nota sería relleno.
- «Título corto» (SEOquake pide 50–60 caracteres; el de inicio tiene 48): no es un problema. Google corta los títulos largos, no los cortos, y este lleva primero lo que se busca («Yesista y Reformas en Jaén») y la marca después. Lo que sí importa es no pasar de unos **60 caracteres**: todos los títulos están entre 48 y 60.
- «La meta description puede cortarse» (SEOquake avisa por encima de 135 caracteres): las de las páginas públicas tienen entre 139 y 152. Google corta por ancho en píxeles, no por caracteres, y lo importante va al principio, así que, aunque se corte en el móvil, se entiende. No conviene recortarlas quitando palabras útiles como «reformas integrales».
- «Meta robots / noindex: revisar»: es un aviso automático. Las páginas públicas llevan `index, follow, max-image-preview:large`, que es lo correcto; la última parte solo permite a Google mostrar las fotos en grande. Las páginas legales, la 404 y `/admin/` llevan `noindex` a propósito: no aportan nada en los resultados de búsqueda.
- «Google Analytics no detectado»: es lo esperado. Mientras el campo `googleAnalytics` de `empresa.json` esté vacío no hay medición, y aunque se active, el código solo se carga cuando el visitante acepta las cookies, así que los analizadores no lo verán (ver [Cookies y consentimiento](#cookies-y-consentimiento)).
- «Sin hreflang»: la web está solo en español; `hreflang` solo hace falta si hay versiones en otros idiomas o países.

---

## Afirmaciones que hay que validar

Los textos se han redactado a partir de la información facilitada. Antes de publicar, confirma que todo es exacto:

- **Datos registrales, CIF y domicilio social** (ver la tabla de datos legales). La empresa ha confirmado que la sociedad está activa.
- **Domicilio en la web**: Calle Perú, 2 A figura en el aviso legal, la política de privacidad y los datos estructurados, pero no en el pie ni en la página de contacto. Si se prefiere no mostrarlo en los datos estructurados, quita `streetAddress` y `postalCode` en `structuredData.js` (el aviso legal sí debe incluirlo).
- **«Sociedad limitada inscrita en el Registro Mercantil de Jaén», constituida el 27/12/2011** (fecha confirmada por la empresa; la inscripción en el Registro es del 18/01/2012 según el BORME). En «Quiénes somos» y en el inicio se muestra el año (2011), y en los datos estructurados la fecha completa (`foundingDate`). Coincide con la fecha de apertura del Perfil de Empresa de Google.
- **40 años de oficio del fundador** como yesista (confirmado por la empresa en 2026). Se calcula con el año de inicio en el oficio (1986, en «Datos de la empresa» → «Fundador») y el año de compilación. Aparece en el inicio, en «Quiénes somos», en los datos estructurados y en la imagen para redes sociales. Esa imagen se genera en tu ordenador: ejecuta `npm run og` una vez al año (o al cambiar datos) y publica el resultado. No se genera en Netlify porque el servidor no tiene las mismas fuentes. Si el año de inicio exacto es otro, cámbialo en el gestor.
- **Rafael Maderas, «fundador y gerente»** («Datos de la empresa» → «Fundador»), en «Quiénes somos» y en los datos estructurados. Según el BORME, es el administrador único desde la constitución. Si prefieres otro cargo o su nombre completo, cámbialo en el gestor.
- **Servicios de yeso** anunciados (el yeso proyectado coincide con el «Proyectador de yeso» de la furgoneta): yeso proyectado, guarnecido y enlucido, alisado de paredes y gotelé, regularización de paredes antiguas y reparación de grietas, desconchones y rozas (/admin → «Servicios»). *No se anuncian* escayola ni placa de yeso laminado (pladur). Añádelos solo si se hacen.
- **Gremios coordinados** (/admin → «Servicios» → «Oficios que coordinamos»):
  - Albañilería, alicatado y solado, fontanería, electricidad y «otros oficios», con la carpintería y la pintura como ejemplos.
  - En Electricidad se dice que la instalación la hace **una empresa instaladora habilitada, que emite el certificado (boletín) cuando la normativa lo exige**. Es obligatorio por el REBT: confirma que el electricista con el que trabajáis lo está.
- **«Equipo propio» / «equipo propio de yesistas»**: que los trabajos de yeso los hace personal de la empresa (inicio, Servicios, Reformas, «Quiénes somos», FAQ). Además, que para el resto de oficios se **coordina** a profesionales con los que se colabora habitualmente.
- **«Un único interlocutor»**: que el cliente tiene un mismo contacto en la empresa desde la primera llamada hasta el final de la obra (inicio, Reformas, «Quiénes somos»). El proceso de trabajo dice además que se visita la obra cuando hace falta y que se revisa el resultado con el cliente al terminar.
- **Disponibilidad y trato**: si el equipo está en obra, se devuelve la llamada o se contesta el WhatsApp lo antes posible. Además, «te respondemos nosotros, sin centralitas» y «hablas directamente con nosotros, sin intermediarios» (inicio y Contacto).
- **Mensaje predefinido de WhatsApp**: «Hola, os escribo desde la web. Quiero consultaros una obra o reforma.» («Datos de la empresa» → «Mensaje inicial de WhatsApp»).
- **Zonas**: Jaén capital como zona habitual («del casco antiguo al Bulevar») y los municipios listados en /admin → «Páginas» → «Zonas de servicio», que son una selección orientativa. También la atención en el resto de Andalucía «según el trabajo». Los ejemplos de viviendas (casas antiguas del casco histórico, pisos de los años 70, 80 y 90 con gotelé) son generales.
- **Respuestas del FAQ** (/admin → «Preguntas frecuentes»), sobre todo:
  - «Sí» a los **trabajos pequeños** («Si no es algo que hagamos, también te lo diremos»).
  - **Gotelé**: la prueba del trapo húmedo para distinguir temple de pintura plástica. El de temple se rasca tras humedecerlo; el de pintura plástica se rebaja y se cubre con yeso o pasta de alisar, sobre una imprimación de agarre.
  - **Secado**: sin plazos fijos, «como referencia, al menos dos semanas», imprimación selladora antes de la pintura plástica y «al terminar te decimos cuándo puedes pintar».
  - **Duración de una reforma**: fases con tiempos de espera, como el secado del recrecido o del yeso.
  - **Vivir en casa**: «trabajamos por estancias».
  - **Oficios**: el yeso, con equipo propio; el resto, profesionales a los que se coordina.
- **Licencias** (Reformas, «¿Necesito licencia para reformar mi casa en Jaén?»): es un texto general, contrastado con estas fuentes:
  - la ley andaluza LISTA (Ley 7/2021, art. 138): la declaración responsable permite empezar el día en que se presenta, con la documentación y las autorizaciones previas;
  - la Ley de Propiedad Horizontal (art. 7.1): hay que avisar a la comunidad antes de las obras, y hace falta acuerdo de la junta para los elementos comunes;
  - la sede electrónica del Ayuntamiento de Jaén: el trámite 12303 se presenta en la **Gerencia Municipal de Urbanismo**, y el contenedor en la vía pública necesita su propia autorización. El casco histórico es Conjunto Histórico, con autorizaciones de Patrimonio en algunos casos.

  Confírmalo con la Gerencia o con quien os tramite las licencias. No se dice que la empresa gestione los permisos ni el contenedor; si lo hace, añadirlo es un buen argumento.
- **Compromisos de forma de trabajar**. Son fieles al proceso descrito, pero confírmalos:
  - «**Presupuesto claro** antes de empezar» / «tienes el presupuesto antes de empezar» (inicio, proceso, Reformas y Contacto).
  - «**Si surge un imprevisto**, te lo enseñamos y decides tú antes de seguir» (inicio, Reformas y FAQ).
  - Limpieza: «protegemos suelos y muebles» y «al terminar recogemos / retiramos los restos» (proceso, «Quiénes somos», FAQ y consejos de Servicios).
  - Fotos: «mándanos unas fotos por WhatsApp y te decimos cómo lo haríamos» (portada) y «te orientamos con lo que nos cuentes y las fotos» (Contacto).
  - Preparación: «hace falta agua y luz en la obra» y «mientras aplicamos el yeso, mejor sin corrientes de aire» (consejos de Servicios).
  - Oficio (Servicios), prácticas habituales de un buen yesista que hay que confirmar:
    - «picamos lo que está suelto y las enderezamos con un guarnecido sobre maestras»;
    - «en las esquinas salientes colocamos guardavivos»;
    - «donde se juntan materiales distintos colocamos malla de fibra de vidrio»;
    - «si la pared está muy desplomada, te explicamos antes cómo corregirla».
  - Reformas: el orden de obra dice que las tuberías se prueban a la vista antes de taparlas y que la ducha se impermeabiliza antes de alicatar (también en «Cocinas y baños»). Además, si hay que quitar una pared, primero se comprueba si es de carga.
  - Grietas: «si una grieta pudiera tener origen estructural […] si lo vemos, te lo diremos» (Servicios y FAQ).
- **«Empresa familiar»** (inicio y «Quiénes somos») y que el fundador **creó la empresa en 2011** (inicio).
- **Propiedades del yeso** en Servicios: material **incombustible (Euroclase A1)** que **ayuda a regular la humedad** (absorbe la humedad que sobra en el ambiente y la devuelve cuando el aire está seco), según el manual de ATEDY. Del yeso proyectado se dice:
  - «menos días de obra»;
  - «sin empalmes» (cada pared de una sola vez, sin empalmes entre amasadas) y «acabado homogéneo»;
  - un grosor de «normalmente entre 1 y 2 cm».

  El guarnecido lleva «de 1 a 2 cm» y el yeso «admite unos 2 cm por capa». Son datos generales de la técnica.
- **«Sin compromiso»**: aparece en la portada, en el bloque final de contacto y en Contacto («Pedir presupuesto no te compromete a nada»). Pedir presupuesto nunca obliga a contratar, pero confirma que estáis cómodos con la expresión.
- **No se afirma** a propósito: presupuesto gratuito, cerrado o por escrito, garantía por escrito, plazo de respuesta, horario ni precios. Si alguno es cierto, añadirlo refuerza mucho la confianza. Por ejemplo:
  - «Presupuesto por escrito»;
  - «Te respondemos en el día»;
  - el horario de llamadas junto al teléfono.
- **Privacidad**: que a otros profesionales solo se les pasan los datos imprescindibles de la obra. (Confirmado: el correo de Hotmail y el WhatsApp son los de la empresa.)
- La foto «Jaén» es de **Baños de la Encina** (provincia de Jaén), no de la capital. El texto alternativo lo indica.
- **Foto principal**: que la persona que aparece está de acuerdo en salir en la web. Su texto alternativo dice «Yesista de Rafael Maderas S.L. en plena obra…», sin nombre. Si se quiere, puede decir quién es (por ejemplo, el fundador), en /admin → «Fotos de la web».

Servicios que se pueden añadir si se confirman: escayola, placa de yeso laminado, falsos techos, molduras, aislamiento, pintura como servicio propio. El objeto social inscrito incluye además **enfoscados, revestimientos exteriores e interiores y decoración** en yeso y escayola, a mano o proyectado; anúncialos solo si se hacen hoy en día.

Otros datos útiles para el cliente, si se confirman:
- **Contenedor y escombros**: «nos encargamos del contenedor, con su permiso municipal, y de llevar los escombros a un gestor autorizado».
- **Permisos**: «te ayudamos a preparar la declaración responsable».
- **IVA del 10 %** en reformas de vivienda (Ley del IVA, art. 91.Uno.2.10º). Se aplica si se cumplen tres condiciones:
  - el cliente es un particular y la vivienda es para su uso;
  - la vivienda se construyó o rehabilitó hace más de dos años;
  - los materiales que aporta la empresa no superan el 40 % de la base imponible.

  Desde el 1 de diciembre de 2026 (Real Decreto-ley 26/2026, pendiente de convalidación) se exige además pagar por tarjeta, transferencia, cheque nominativo o ingreso en cuenta. Confírmalo con la asesoría antes de publicarlo.

---

## Accesibilidad

Enlace «Saltar al contenido», foco visible, navegación completa por teclado (el menú se cierra con Escape), contraste AA comprobado en toda la paleta, objetivos táctiles de al menos 44 px, textos alternativos descriptivos, `prefers-reduced-motion` respetado (sin ninguna animación) y la web funciona sin JavaScript (mejora progresiva). La barra fija de contacto en móvil se oculta mientras hay otros botones de contacto visibles.
