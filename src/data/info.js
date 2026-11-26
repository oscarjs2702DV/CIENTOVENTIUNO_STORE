// Páginas informativas y legales del pie de página (#/info/<slug>).
// Cada sección tiene un título y bloques: texto, o { list: [...] }.

export const CONTACT = {
  email: 'c121clothes@gmail.com',
  // Número en formato internacional sin espacios ni "+", p. ej. '573001234567'.
  // Vacío = no se muestra el WhatsApp.
  whatsapp: '573026925030',
  whatsappLabel: '+57 302 692 5030',
  instagram: 'https://www.instagram.com/ciento21.clothing/',
  instagramUser: '@ciento21.clothing',
  facebook: 'https://www.facebook.com/profile.php?id=61596765699983',
  place: 'Fontibón, La Cabaña · Bogotá, Colombia',
}

export const FREE_SHIPPING_FROM = 70000
// Envío cuando ninguna prenda supera FREE_SHIPPING_FROM (igual en worker/orders.js):
// Bogotá paga tarifa fija; fuera de Bogotá se paga a la transportadora al recibir.
export const BOGOTA_SHIPPING = 10000
const UPDATED = '26 de noviembre de 2026'
const BRAND = 'CIENTOVEINTIUNO'

export const PAGES = {
  novedades: {
    kicker: 'Lo nuevo',
    title: 'Novedades',
    intro:
      'Lo último que está pasando en CIENTOVEINTIUNO: lanzamientos, colores nuevos y todo lo que viene en camino.',
    sections: [
      {
        date: 'Noviembre 2026',
        h: 'Llegó la Camiseta Oversize',
        body: [
          'Hombro caído, manga ancha y un cuello grueso en RIB acanalado que no se deforma con las lavadas. Lleva el bordado CIENTOVEINTIUNO pequeño en la espalda, justo bajo el cuello: se nota de cerca, no a gritos.',
          'Viene en seis colores: lila, azul oscuro, negro, beige, rojo y café, en tallas S, M y L.',
        ],
        product: { id: 'dcf80d3f-9d9b-4e22-8f90-11de0099220f', label: 'Ver la camiseta' },
      },
      {
        date: 'Noviembre 2026',
        h: 'Estrenamos tienda en línea',
        body: [
          'Ahora puedes ver toda la colección, elegir color y talla, y crear tu cuenta con tu correo o con Google. Seguimos atendiendo por Instagram para pedidos personalizados.',
          `Y desde ya, el envío es gratis cuando tu compra incluye una prenda de más de $70.000.`,
        ],
      },
      {
        date: 'Siempre',
        h: 'Diseños únicos y personalizados',
        body: [
          'Cada pieza la pensamos en Bogotá y la hacemos en ediciones cortas. Si tienes una idea para tu grupo, tu iglesia o tu evento, escríbenos y la diseñamos contigo.',
        ],
      },
      {
        date: 'Muy pronto',
        h: 'Lo que viene',
        body: [
          'Pagos en línea directamente en la tienda, nuevos colores para los hoodies y una colección de accesorios. Síguenos en Instagram para enterarte primero.',
        ],
      },
    ],
  },

  envios: {
    kicker: 'Tienda',
    title: 'Envíos',
    intro:
      'Enviamos a toda Colombia. Empacamos cada prenda a mano y te avisamos cuando sale para que sepas dónde va tu pedido.',
    highlight: 'Envío gratis cuando tu compra incluye al menos una prenda de más de $70.000.',
    sections: [
      {
        h: '¿Cuánto cuesta?',
        body: [
          'Si tu pedido tiene al menos una prenda con precio superior a $70.000, el envío no tiene costo, a cualquier ciudad del país.',
          'En los demás pedidos, el envío dentro de Bogotá cuesta $10.000 y se paga junto con tu compra. Fuera de Bogotá lo despachamos por Servientrega o Interrapidísimo y el valor del envío lo pagas directamente a la transportadora al recibir, según su tarifa para tu ciudad.',
        ],
      },
      {
        h: 'Tiempos de entrega',
        body: [
          {
            list: [
              'Preparación del pedido: 1 a 2 días hábiles desde que se confirma el pago.',
              'Bogotá: 1 a 2 días hábiles después del despacho.',
              'Ciudades principales: 2 a 4 días hábiles.',
              'Municipios y zonas de difícil acceso: 4 a 8 días hábiles.',
            ],
          },
          'Las prendas personalizadas o hechas por encargo tienen su propio tiempo de producción, que te confirmamos antes de que pagues.',
        ],
      },
      {
        h: 'Seguimiento',
        body: [
          'Cuando tu pedido sale, te enviamos al correo o por WhatsApp el nombre de la transportadora y el número de guía para que lo sigas.',
        ],
      },
      {
        h: 'Recibir el pedido',
        body: [
          'Revisa que el paquete llegue cerrado y en buen estado. Si ves la caja abierta o dañada, déjalo anotado en la guía de la transportadora y escríbenos el mismo día con una foto.',
          'Si nadie puede recibirlo, la transportadora intentará de nuevo o lo dejará en su oficina más cercana. Si el pedido vuelve a nosotros por una dirección equivocada, el nuevo envío corre por cuenta del cliente.',
        ],
      },
    ],
  },

  devoluciones: {
    kicker: 'Tienda',
    title: 'Devoluciones y garantía',
    intro:
      'Revisamos cada prenda antes de empacarla, pero si algo se nos pasó, lo solucionamos. Aquí te contamos cómo.',
    highlight: 'Si tu prenda llegó con un defecto, te la cambiamos o te devolvemos el dinero, y el envío lo pagamos nosotros.',
    sections: [
      {
        h: '¿Qué cubre la garantía?',
        body: [
          'Defectos de fabricación: costuras que se sueltan, bordados que se deshacen, manchas o huecos de fábrica, cremalleras o cordones que fallan, o una talla o color distinto al que pediste.',
          'Tienes 90 días calendario desde que recibes el pedido para reportarlo.',
        ],
      },
      {
        h: '¿Qué no cubre?',
        body: [
          {
            list: [
              'El desgaste normal por uso.',
              'Daños por lavado o planchado que no sigue la etiqueta de cuidado (agua caliente, blanqueador, secadora, plancha directa sobre el bordado).',
              'Arreglos o modificaciones hechos por fuera de CIENTOVEINTIUNO.',
              'Cambios de talla o de gusto en prendas sin defecto, salvo lo que explica el derecho de retracto más abajo.',
            ],
          },
        ],
      },
      {
        h: 'Cómo hacer la solicitud',
        body: [
          {
            list: [
              `Escríbenos a ${CONTACT.email}, al WhatsApp ${CONTACT.whatsappLabel} o por Instagram con tu nombre, el número de pedido y fotos donde se vea el defecto.`,
              'Te respondemos en máximo 3 días hábiles y, si aplica, te enviamos la guía para recoger la prenda sin costo.',
              'Revisamos la prenda cuando llega y, según lo que prefieras, te enviamos una nueva igual (o de otro color si no queda), o te devolvemos el dinero.',
            ],
          },
          'La devolución del dinero se hace por el mismo medio de pago en máximo 15 días hábiles después de recibir la prenda.',
        ],
      },
      {
        h: 'Derecho de retracto',
        body: [
          'Como compraste por internet, la ley colombiana (artículo 47 de la Ley 1480 de 2011) te da 5 días hábiles desde la entrega para arrepentirte de la compra, aunque la prenda no tenga ningún defecto.',
          'Para usarlo, la prenda debe estar sin usar, sin lavar y con sus etiquetas, en el mismo estado en que la recibiste. En este caso el envío de vuelta lo pagas tú, y te devolvemos todo lo que pagaste en máximo 30 días calendario. No aplica a prendas personalizadas o hechas a tu medida.',
        ],
      },
      {
        h: 'Reversión del pago',
        body: [
          'Si pagaste con tarjeta u otro medio electrónico y fuiste víctima de fraude, la compra no se hizo, no recibiste el producto o llegó defectuoso, puedes pedir la reversión del pago dentro de los 5 días hábiles siguientes, según el artículo 51 de la Ley 1480 de 2011. Avísanos y avisa a tu banco al mismo tiempo.',
        ],
      },
    ],
  },

  'preguntas-frecuentes': {
    kicker: 'Ayuda',
    title: 'Preguntas frecuentes',
    intro: 'Lo que más nos preguntan. Si no encuentras tu respuesta, escríbenos.',
    sections: [
      {
        h: '¿Cómo sé qué talla pedir?',
        body: [
          'Nuestras camisetas y buzos son de corte oversize: quedan amplios a propósito. Si te gusta un ajuste más clásico, pide una talla menos de la que usas normalmente. ¿Dudas? Escríbenos con tu estatura y la talla que sueles usar y te ayudamos.',
        ],
      },
      {
        h: '¿Cómo cuido mi prenda?',
        body: [
          {
            list: [
              'Lávala al revés, en agua fría y con colores parecidos.',
              'Sin blanqueador ni suavizante fuerte.',
              'Sécala a la sombra; evita la secadora para que no encoja.',
              'Si la planchas, hazlo al revés y nunca directo sobre el bordado.',
            ],
          },
        ],
      },
      {
        h: '¿Hacen diseños personalizados?',
        body: [
          'Sí. Hacemos prendas personalizadas para grupos, iglesias, eventos y marcas. Escríbenos por Instagram o al correo con tu idea y la cantidad, y te enviamos la propuesta.',
        ],
      },
      {
        h: '¿Puedo cambiar la talla si no me quedó?',
        body: [
          'Los cambios por defecto siempre los cubrimos. Para cambios de talla sin defecto, puedes usar el derecho de retracto dentro de los 5 días hábiles siguientes a la entrega, con la prenda sin usar y con etiquetas. Mira los detalles en Devoluciones.',
        ],
      },
      {
        h: '¿Necesito una cuenta para comprar?',
        body: [
          'La cuenta te sirve para guardar tus datos y ver tus pedidos. Puedes crearla con tu correo o con Google en un par de clics.',
        ],
      },
      {
        h: '¿Los precios incluyen IVA?',
        body: ['Sí. Todos los precios están en pesos colombianos e incluyen IVA.'],
      },
    ],
  },

  terminos: {
    kicker: 'Legal',
    title: 'Términos y condiciones',
    updated: UPDATED,
    intro: `Estas condiciones regulan el uso de la tienda en línea de ${BRAND} y las compras que hagas en ella. Al navegar o comprar aquí, las aceptas.`,
    sections: [
      {
        h: '1. Quiénes somos',
        body: [
          `${BRAND} es una marca de ropa urbana con sede en ${CONTACT.place}. Puedes escribirnos a ${CONTACT.email}, al WhatsApp ${CONTACT.whatsappLabel} o por Instagram en ${CONTACT.instagramUser}.`,
        ],
      },
      {
        h: '2. Tu cuenta',
        body: [
          'Para comprar puedes crear una cuenta con tu correo y una contraseña, o con tu cuenta de Google. Los datos que nos des deben ser reales y estar al día. Cuida tu contraseña: lo que se haga con tu cuenta es tu responsabilidad, y si crees que alguien más la está usando, avísanos de inmediato.',
          'Podemos suspender cuentas que se usen para fraude, suplantación o para afectar el funcionamiento de la tienda.',
        ],
      },
      {
        h: '3. Productos y precios',
        body: [
          'Las fotos muestran las prendas lo más fielmente posible, pero el color puede variar un poco según tu pantalla. Algunas imágenes son representaciones del diseño y pueden diferir en detalles menores de la prenda final.',
          'Los precios están en pesos colombianos (COP) e incluyen IVA. El precio que vale es el que ves cuando confirmas la compra. Si por un error evidente un precio sale muy por debajo de su valor real, te avisaremos antes de despachar y podrás aceptar el precio correcto o cancelar con devolución total.',
          'Las prendas están sujetas a disponibilidad. Si después de tu compra nos damos cuenta de que no hay existencias, te avisamos y te devolvemos el dinero completo.',
        ],
      },
      {
        h: '4. Compra y pago',
        body: [
          'El pedido se confirma cuando recibimos el pago por los medios que se muestran al finalizar la compra. Te enviaremos la confirmación a tu correo. Nosotros no vemos ni guardamos los datos de tu tarjeta: el pago lo procesa directamente la pasarela de pagos.',
        ],
      },
      {
        h: '5. Envíos',
        body: [
          'Hacemos envíos a todo Colombia. El envío es gratis cuando tu compra incluye al menos una prenda de más de $70.000; en los demás casos, cuesta $10.000 dentro de Bogotá, y fuera de Bogotá se paga a la transportadora (Servientrega o Interrapidísimo) al recibir, según su tarifa. Los tiempos y condiciones están en la página de Envíos.',
        ],
      },
      {
        h: '6. Garantía, retracto y reversión del pago',
        body: [
          'Las prendas tienen garantía de 90 días por defectos de fabricación. Además, tienes los derechos de retracto (5 días hábiles desde la entrega) y de reversión del pago que da la Ley 1480 de 2011, Estatuto del Consumidor. Todo el detalle está en la página de Devoluciones y garantía.',
        ],
      },
      {
        h: '7. Propiedad intelectual',
        body: [
          `La marca ${BRAND}, el logo, los diseños, las fotos y los textos de esta tienda son de ${BRAND} o se usan con permiso. No puedes copiarlos, reproducirlos ni usarlos con fines comerciales sin autorización escrita.`,
        ],
      },
      {
        h: '8. Uso de la tienda',
        body: [
          'No está permitido usar la tienda para actividades ilegales, intentar acceder a partes restringidas, automatizar compras o interferir con su funcionamiento.',
        ],
      },
      {
        h: '9. Responsabilidad',
        body: [
          'Hacemos lo posible para que la tienda funcione siempre, pero puede haber interrupciones por mantenimiento o por causas fuera de nuestro control. Nada de esto limita los derechos que te da la ley como consumidor.',
        ],
      },
      {
        h: '10. Cambios a estas condiciones',
        body: [
          'Podemos actualizar estas condiciones. La fecha de la última versión aparece arriba, y a cada compra se le aplican las que estaban vigentes en el momento en que la hiciste.',
        ],
      },
      {
        h: '11. Ley aplicable y quejas',
        body: [
          'Estas condiciones se rigen por las leyes de Colombia. Si tienes una queja, escríbenos primero y la resolvemos en máximo 15 días hábiles. También puedes acudir a la Superintendencia de Industria y Comercio (www.sic.gov.co).',
        ],
      },
    ],
  },

  privacidad: {
    kicker: 'Legal',
    title: 'Política de privacidad',
    updated: UPDATED,
    intro: `En ${BRAND} cuidamos tus datos personales según la Ley 1581 de 2012 y el Decreto 1377 de 2013. Aquí te explicamos qué datos recogemos, para qué y cómo puedes controlarlos.`,
    sections: [
      {
        h: 'Responsable del tratamiento',
        body: [`${BRAND}, ${CONTACT.place}. Correo: ${CONTACT.email}.`],
      },
      {
        h: 'Qué datos recogemos',
        body: [
          {
            list: [
              'Datos de la cuenta: nombre, correo y contraseña. La contraseña se guarda cifrada con un algoritmo de un solo sentido; nadie, ni nosotros, puede leerla.',
              'Si entras con Google: tu nombre, correo y foto de perfil, que Google nos comparte con tu permiso.',
              'Datos que tú agregas a tu perfil, como tu foto o tu fecha de nacimiento.',
              'Datos del pedido: dirección de entrega, teléfono y los productos que compraste.',
              'Datos técnicos mínimos para que la tienda funcione y sea segura, como la dirección IP para frenar intentos de acceso abusivos.',
            ],
          },
          'No recogemos datos sensibles ni datos de tu tarjeta. Los pagos los procesa directamente la pasarela de pagos.',
        ],
      },
      {
        h: 'Para qué los usamos',
        body: [
          {
            list: [
              'Crear y mantener tu cuenta y dejarte entrar a ella.',
              'Procesar, enviar y hacer seguimiento a tus pedidos.',
              'Atender tus preguntas, garantías y devoluciones.',
              'Enviarte correos sobre tu cuenta y tus compras, como el de bienvenida o la confirmación de un pedido.',
              'Enviarte novedades y promociones, solo si nos lo autorizas, y puedes darte de baja cuando quieras.',
              'Prevenir fraudes y proteger la seguridad de la tienda.',
            ],
          },
        ],
      },
      {
        h: 'Con quién los compartimos',
        body: [
          'No vendemos ni alquilamos tus datos. Solo los compartimos con quienes nos ayudan a prestar el servicio, y únicamente lo necesario:',
          {
            list: [
              'Cloudflare, que aloja la tienda y la base de datos.',
              'Google, si eliges entrar con tu cuenta de Google.',
              'El servicio que usamos para enviar correos.',
              'La transportadora, que recibe tu nombre, dirección y teléfono para entregar el pedido.',
              'La pasarela de pagos, que procesa tu pago.',
            ],
          },
          'Algunos de estos proveedores guardan los datos en servidores fuera de Colombia, con medidas de seguridad adecuadas. Al aceptar esta política autorizas esa transferencia.',
        ],
      },
      {
        h: 'Cuánto tiempo los guardamos',
        body: [
          'Mientras tengas tu cuenta activa. Si la eliminas, borramos tus datos, salvo los de tus compras que la ley nos obliga a conservar por motivos contables y tributarios.',
        ],
      },
      {
        h: 'Tus derechos',
        body: [
          'Como titular de tus datos puedes:',
          {
            list: [
              'Conocer, actualizar y corregir tus datos.',
              'Pedir prueba de la autorización que nos diste.',
              'Saber cómo hemos usado tus datos.',
              'Revocar la autorización o pedir que borremos tus datos, cuando no haya una obligación legal de conservarlos.',
              'Presentar quejas ante la Superintendencia de Industria y Comercio.',
            ],
          },
          `Para ejercerlos, escríbenos a ${CONTACT.email}. Respondemos las consultas en máximo 10 días hábiles y los reclamos en máximo 15 días hábiles, como dice la ley. También puedes actualizar tu nombre y tu foto desde tu cuenta.`,
        ],
      },
      {
        h: 'Seguridad',
        body: [
          'La tienda funciona solo con conexión cifrada (HTTPS), las contraseñas se guardan cifradas y las sesiones usan cookies protegidas que el navegador no deja leer a otros sitios.',
        ],
      },
      {
        h: 'Menores de edad',
        body: [
          'Si eres menor de 18 años, crea tu cuenta y compra con el acompañamiento de tu mamá, papá o acudiente.',
        ],
      },
      {
        h: 'Cambios a esta política',
        body: [
          'Si cambiamos algo importante, lo publicaremos aquí con la nueva fecha y, si afecta cómo usamos tus datos, te avisaremos por correo.',
        ],
      },
    ],
  },

  cookies: {
    kicker: 'Legal',
    title: 'Política de cookies',
    updated: UPDATED,
    intro:
      'Las cookies son pequeños archivos que un sitio guarda en tu navegador. Nosotros usamos muy pocas y solo las necesarias para que la tienda funcione.',
    highlight: 'No usamos cookies de publicidad ni de seguimiento, y no compartimos cookies con redes sociales.',
    sections: [
      {
        h: 'Cookies que usamos',
        body: [
          {
            list: [
              '__Host-cliente: mantiene tu sesión abierta cuando entras a tu cuenta. Dura 30 días o hasta que cierres sesión.',
              '__Host-google: protege el inicio de sesión con Google mientras se completa. Dura 10 minutos.',
              '__Host-admin: solo la usa el equipo de la tienda para entrar al panel de administración. Dura 12 horas.',
            ],
          },
          'Las tres son técnicas y estrictamente necesarias: sin ellas no podrías entrar a tu cuenta. Por eso no te pedimos permiso para usarlas, y ninguna sirve para seguirte por otros sitios.',
        ],
      },
      {
        h: 'Servicios externos',
        body: [
          'Las tipografías de la tienda se cargan desde Google Fonts, lo que hace que tu navegador se conecte a los servidores de Google. El enlace a Instagram te lleva a su sitio, que tiene sus propias políticas.',
        ],
      },
      {
        h: 'Cómo controlarlas',
        body: [
          'Puedes ver y borrar las cookies desde la configuración de tu navegador. Si las bloqueas, la tienda se podrá ver, pero no podrás iniciar sesión.',
        ],
      },
      {
        h: 'Cambios',
        body: [
          'Si algún día agregamos cookies de otro tipo, como de estadísticas, actualizaremos esta página y te pediremos tu permiso antes de usarlas.',
        ],
      },
    ],
  },

  'aviso-legal': {
    kicker: 'Legal',
    title: 'Aviso legal',
    updated: UPDATED,
    intro: 'Información sobre quién está detrás de esta tienda y las reglas básicas para usarla.',
    sections: [
      {
        h: 'Titular del sitio',
        body: [
          {
            list: [
              `Marca: ${BRAND}`,
              `Ubicación: ${CONTACT.place}`,
              `Correo: ${CONTACT.email}`,
              `WhatsApp: ${CONTACT.whatsappLabel}`,
              `Instagram: ${CONTACT.instagramUser}`,
            ],
          },
        ],
      },
      {
        h: 'Objeto',
        body: [
          'Este sitio sirve para mostrar y vender en línea las prendas de la marca a consumidores en Colombia.',
        ],
      },
      {
        h: 'Propiedad intelectual',
        body: [
          `El nombre ${BRAND}, el logo, los diseños de las prendas, las fotografías, los textos y el diseño del sitio están protegidos por las normas de propiedad intelectual. Queda prohibida su reproducción, distribución o uso comercial sin autorización escrita. Compartir enlaces a la tienda o a nuestros productos sí está permitido, y nos encanta.`,
        ],
      },
      {
        h: 'Contenido y enlaces',
        body: [
          'Revisamos que la información del sitio sea correcta, pero puede haber errores de digitación o cambios de disponibilidad que corregiremos apenas los veamos. Los enlaces a otros sitios, como Instagram, se ofrecen por comodidad; no controlamos su contenido.',
        ],
      },
      {
        h: 'Uso adecuado',
        body: [
          'Al usar el sitio te comprometes a no dañarlo, no intentar entrar a zonas restringidas y no usarlo para fines ilegales o que afecten a otras personas.',
        ],
      },
      {
        h: 'Ley aplicable',
        body: [
          'Este sitio y su uso se rigen por las leyes de la República de Colombia. Las condiciones de compra están en los Términos y condiciones, y el uso de tus datos en la Política de privacidad.',
        ],
      },
    ],
  },
}

export const FOOTER_LINKS = {
  tienda: [
    ['novedades', 'Novedades'],
    ['envios', 'Envíos'],
    ['devoluciones', 'Devoluciones'],
    ['preguntas-frecuentes', 'Preguntas frecuentes'],
  ],
  legal: [
    ['terminos', 'Términos y condiciones'],
    ['privacidad', 'Privacidad'],
    ['cookies', 'Cookies'],
    ['aviso-legal', 'Aviso legal'],
  ],
}
