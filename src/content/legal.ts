// Textos legales de Mis Gastos. Se muestran en las páginas públicas /privacidad y /eliminar-cuenta.
// CONTACT_EMAIL es un placeholder: reemplazarlo antes de publicar.

export const CONTACT_EMAIL = 'CONTACTO@EJEMPLO.COM'

export const privacyPolicy: {
  title: string
  updated: string
  intro: string
  sections: { heading: string; body: string[] }[]
} = {
  title: 'Política de privacidad de Mis Gastos',
  updated: '18 de noviembre de 2026',
  intro:
    'Esta política explica qué datos personales recolectamos cuando usás Mis Gastos, para qué los usamos, con quién los compartimos y qué derechos tenés sobre ellos. Se rige por la Ley 25.326 de Protección de los Datos Personales de la República Argentina.',
  sections: [
    {
      heading: '1. Quién es responsable',
      body: [
        'Mis Gastos es una aplicación de uso personal publicada por ZyannPlay. El responsable del tratamiento de tus datos es ZyannPlay.',
        `Para cualquier consulta sobre privacidad podés escribirnos a ${CONTACT_EMAIL}.`,
      ],
    },
    {
      heading: '2. Qué datos recolectamos',
      body: [
        'Dirección de email y contraseña, cuando creás una cuenta con email. La contraseña se guarda cifrada: nosotros no podemos verla.',
        'Si ingresás con Google: tu dirección de email, tu nombre y tu foto de perfil, según lo que Google comparte con la app.',
        'Los datos que cargás vos: gastos e ingresos (monto, moneda, categoría, fecha y nota), categorías propias, presupuestos, y gastos fijos y cuotas.',
        'La cotización del dólar blue que se guarda junto con cada movimiento. No es un dato personal, pero forma parte de tus registros.',
        'Datos técnicos mínimos para mantener tu sesión iniciada, como el token de sesión, y algunas preferencias guardadas en el dispositivo (por ejemplo, la última moneda elegida).',
      ],
    },
    {
      heading: '3. Para qué usamos tus datos',
      body: [
        'Para que puedas ingresar a tu cuenta y usar la app: guardar, editar y mostrar tus movimientos, calcular presupuestos, generar reportes y gráficas, y crear automáticamente los movimientos de tus gastos fijos y cuotas.',
        'Para convertir montos entre ARS y USD usando la cotización del dólar blue.',
        'Para atender tus consultas y tus pedidos de acceso, corrección o eliminación.',
        'No usamos tus datos para publicidad, perfilado ni análisis de comportamiento. La app no tiene anuncios ni analíticas.',
      ],
    },
    {
      heading: '4. Dónde se guardan',
      body: [
        'Tus datos se guardan en Supabase, una plataforma de base de datos y autenticación que funciona en servidores en la nube.',
        'La versión web de la app se publica en Vercel, que entrega los archivos de la aplicación a tu navegador o celular.',
      ],
    },
    {
      heading: '5. Con quién compartimos datos',
      body: [
        'Supabase: presta el servicio de base de datos y de inicio de sesión. Es el proveedor donde se almacenan tus datos.',
        'Vercel: aloja la aplicación web. Puede registrar datos técnicos de las conexiones, como la dirección IP, según sus propias políticas.',
        'Google: solo si elegís ingresar con Google. Ese inicio de sesión lo procesa Google según sus propias políticas.',
        'dolarapi.com: la app consulta la cotización del dólar blue a este servicio. Esa consulta no incluye datos personales ni datos de tu cuenta.',
        'Estos proveedores pueden procesar datos en servidores fuera de Argentina.',
        'No vendemos tus datos, no los compartimos con terceros para publicidad y no los cedemos a nadie más que a los proveedores necesarios para que la app funcione.',
      ],
    },
    {
      heading: '6. Seguridad',
      body: [
        'La comunicación entre la app y los servidores está cifrada (HTTPS/TLS).',
        'Cada usuario solo puede ver y modificar sus propios datos. La base de datos aplica reglas de seguridad por usuario (Row Level Security) que lo impiden.',
        'Las contraseñas se guardan cifradas con el sistema de autenticación de Supabase.',
        'Ningún sistema es totalmente seguro. Si detectamos una vulnerabilidad que afecte tus datos, lo vamos a informar a los usuarios afectados y, cuando corresponda, a la autoridad de control.',
      ],
    },
    {
      heading: '7. Cuánto tiempo guardamos tus datos',
      body: [
        'Guardamos tus datos mientras tu cuenta esté activa.',
        'Podés borrar tu cuenta desde Ajustes → Eliminar mi cuenta. El borrado es inmediato y permanente: se eliminan tu cuenta y todos tus movimientos, categorías, presupuestos, gastos fijos y cuotas.',
        `Si no podés ingresar a la app, también podés pedir la eliminación escribiendo a ${CONTACT_EMAIL}.`,
        'Las copias de seguridad que mantiene el proveedor de base de datos se eliminan en hasta 30 días.',
      ],
    },
    {
      heading: '8. Tus derechos',
      body: [
        `Tenés derecho a acceder a tus datos, a rectificarlos o actualizarlos y a pedir su supresión. Podés ejercer estos derechos desde la app o escribiendo a ${CONTACT_EMAIL}.`,
        'Según la Ley 25.326, el acceso a tus datos personales es gratuito. La ley también prevé la acción de protección de los datos personales (habeas data).',
        'Si considerás que no atendimos tu pedido, podés presentar un reclamo ante la Agencia de Acceso a la Información Pública (AAIP), órgano de control de la Ley 25.326.',
      ],
    },
    {
      heading: '9. Menores de edad',
      body: [
        'Mis Gastos está pensada para personas adultas. No está dirigida a niños ni a menores de 13 años.',
        'Si nos enteramos de que se creó una cuenta de un menor de 13 años, la vamos a eliminar.',
      ],
    },
    {
      heading: '10. Cambios en esta política',
      body: [
        'Podemos actualizar esta política. Si hay cambios importantes, lo vamos a avisar dentro de la app. La fecha de última actualización aparece arriba.',
      ],
    },
    {
      heading: '11. Contacto',
      body: [
        `Para consultas, pedidos de acceso, corrección o eliminación, escribinos a ${CONTACT_EMAIL}.`,
      ],
    },
  ],
}

export const deleteAccountInfo: {
  title: string
  intro: string
  inAppSteps: string[]
  requestSteps: string[]
  dataDeleted: string[]
  retention: string
} = {
  title: 'Eliminar tu cuenta de Mis Gastos',
  intro:
    'Podés eliminar tu cuenta de Mis Gastos y todos tus datos en cualquier momento. El borrado es inmediato y permanente: no se puede deshacer.',
  inAppSteps: [
    'Abrí la app Mis Gastos e ingresá con tu cuenta.',
    'Entrá a Ajustes.',
    'Tocá Eliminar mi cuenta.',
    'Confirmá la acción. Tu cuenta y todos tus datos se borran de inmediato.',
  ],
  requestSteps: [
    `Si no podés ingresar a la app, escribí desde el mail de tu cuenta a ${CONTACT_EMAIL}.`,
    'En el asunto poné "Eliminar mi cuenta" e indicá el email con el que te registraste.',
    'Te respondemos para confirmar que sos el titular de la cuenta.',
    'Procesamos el pedido y te confirmamos por mail cuando esté hecho. El borrado es permanente.',
  ],
  dataDeleted: [
    'Tu cuenta y tu dirección de email.',
    'Tu nombre y foto de perfil, si ingresaste con Google.',
    'Todos tus gastos e ingresos.',
    'Tus categorías propias.',
    'Tus presupuestos.',
    'Tus gastos fijos y cuotas.',
    'Tu sesión iniciada en el dispositivo.',
  ],
  retention:
    'No conservamos ningún dato de tu cuenta después de borrarla. La única excepción son las copias de seguridad del proveedor de base de datos, que se eliminan en hasta 30 días.',
}
