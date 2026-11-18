# Play Console: respuestas sugeridas para Mis Gastos

App: **Mis Gastos** · Paquete: `com.zyannplay.misgastos` · Publicador: ZyannPlay

> Nota: la interfaz de Play Console cambia seguido. Los nombres de las secciones y opciones pueden variar un poco; usá esta guía como lista de respuestas y verificá cada pantalla antes de enviar.

## Antes de empezar

- Tener listo el título, la descripción y las capturas de `store/listing-es.md`.
- Tener publicadas las dos URLs: política de privacidad y eliminación de cuenta (ver sección 8). Si todavía no existen, Play no deja enviar la app.
- Crear una cuenta de prueba dedicada (ver sección 5), porque Google revisa la app con esas credenciales.

## 1. Seguridad de los datos (Data safety)

Ruta: **Política → Seguridad de los datos**.

### 1.1 Recopilación y uso de datos

Respondé **Sí** a "¿Tu app recopila o comparte datos de usuarios?" Aunque los datos no se compartan, sí se recopilan, así que la respuesta es Sí.

| Categoría | Tipo | ¿Recopilado? | ¿Compartido? | Notas |
|---|---|---|---|---|
| Información personal | Dirección de correo electrónico | Sí | No | Siempre (login con email o Google). |
| Información personal | Nombre | Sí | No | Solo si entran con Google y la app lo guarda. Verificar. |
| Fotos y videos | Fotos | Solo si se guarda | No | La foto de perfil de Google. Si la app no la guarda, no marcar. Verificar en la base. |
| Información financiera | Otra información financiera | Sí | No | Los montos, monedas, categorías, presupuestos y gastos fijos que carga el usuario. |
| Identificadores | ID de usuario | Sí | No | El ID de la cuenta de Supabase. Play lo considera identificador. |

Qué no marcar: ubicación, contactos, mensajes, archivos, fotos del dispositivo, analíticas, diagnósticos de fallos, historial de navegación, ID publicitario. La app no tiene anuncios ni analíticas. Si en el futuro agregás un reporte de fallos (por ejemplo Firebase Crashlytics), actualizá esta sección.

### 1.2 Compartir datos

- ¿Compartís datos con terceros? **No** para todas las categorías de arriba.
- Aclaración: Supabase (base de datos y login) y Vercel (hosting) son proveedores que procesan datos en nombre de la app. Según la definición de Play, un proveedor de servicios que actúa en nombre del desarrollador no cuenta como "compartir". Google, en el login, es el proveedor de autenticación del propio usuario.

### 1.3 Prácticas de seguridad

- **Los datos se cifran en tránsito:** Sí (HTTPS/TLS).
- **Los usuarios pueden pedir que se borren sus datos:** Sí. Indicar la URL de eliminación (sección 8) y que también se puede hacer desde Ajustes → Eliminar mi cuenta.
- **Propósitos de uso** (para cada dato recolectado):
  - Funcionalidad de la app: iniciar sesión, guardar y mostrar movimientos, presupuestos, gastos fijos y cuotas.
  - Administración de la cuenta: crear, mantener y borrar la cuenta.
  - No marcar publicidad, analíticas ni personalización.
- **Datos opcionales vs. obligatorios:** el email es obligatorio para crear cuenta. Los datos financieros se cargan a voluntad, así que se pueden marcar como opcionales.

### 1.4 Verificación

Revisá que la descripción de Data safety coincida con la política de privacidad (`src/content/legal.ts`, sección 2 y 5). Si cambian los datos que se guardan, actualizá las dos cosas.

## 2. Clasificación de contenido (IARC)

Ruta: **Política → Clasificación de contenido → Cuestionario**.

- **Correo de contacto:** el mismo que `CONTACT_EMAIL` de la app (reemplazar el placeholder antes).
- **Categoría:** Utilidad, productividad, comunicación u otra (o "Otra app"). No elegir juegos.
- **Violencia:** No.
- **Sexo o desnudez:** No.
- **Lenguaje soez:** No.
- **Sustancias controladas (drogas, alcohol, tabaco):** No.
- **Apuestas o juegos de azar:** No.
- **¿Los usuarios pueden interactuar o compartir contenido entre sí?** No. Cada usuario ve solo sus datos y no hay chat ni publicaciones.
- **¿Compartís la ubicación del usuario?** No.
- **¿La app permite compras dentro de la app?** No (confirmar; si después se agregan, actualizar).
- **¿Hay contenido generado por el usuario visible para otros?** No. Las notas de los movimientos son privadas.

Al enviar, IARC asigna una clasificación automática. Se espera una clasificación apta para todo público, pero la responde IARC, no nosotros.

## 3. Público objetivo y contenido

Ruta: **Política → Público objetivo y contenido**.

- **Grupos de edad:** elegir **18 años o más**.
  - Motivo: la app maneja datos financieros personales y no está pensada para niños. Elegir 18+ evita los requisitos extra del programa Diseñado para familias.
  - La política de privacidad dice lo mismo (personas adultas, no dirigida a menores de 13).
- **¿La app atrae a niños?** No.
- Si después querés incluir 13+, hay que revisar la política y el texto de la ficha, y se activan requisitos extra de Play.

## 4. Anuncios

Ruta: **Política → Anuncios**.

- **¿La app contiene anuncios?** No.

## 5. Acceso a la app (credenciales de prueba)

Ruta: **Política → Acceso a la app**.

- **¿Hay partes de la app con restricciones de acceso?** Sí. Se requiere iniciar sesión para usar la app.
- **Credenciales para el revisor:**
  1. Crear una cuenta dedicada, por ejemplo `revisor@TU-DOMINIO` (email que no uses para nada más), con contraseña fuerte. Hacerlo desde la app o desde Supabase Auth.
  2. Confirmar que el email esté verificado (si Supabase pide confirmación de mail) para que el login funcione sin pasos extra.
  3. Cargar en la cuenta algunos movimientos, categorías y presupuestos de ejemplo, para que el revisor vea la app con datos.
  4. En la ficha de Play, cargar en "Instrucciones" el email y la contraseña, y aclarar: "Ingresar con email y contraseña. El login con Google no es necesario para revisar la app."
- **Importante:** no usar una cuenta personal. Las credenciales se pueden cambiar después desde Supabase si hace falta.
- Las credenciales "se crearán" antes de enviar a revisión, así que no hace falta que existan al cargar la guía, pero sí antes del envío.

## 6. App gubernamental

Ruta: **Política → App gubernamental**.

- **¿Es una app gubernamental?** No.

## 7. Funciones financieras

Ruta: **Política → Funciones financieras** (o el cuestionario que pida Play sobre servicios financieros).

- **¿La app ofrece funciones financieras?** Sí, pero solo de registro personal.
- **Aclaración para el formulario:** "Mis Gastos es una herramienta de registro personal de gastos e ingresos en ARS y USD. No ofrece préstamos, créditos, inversiones, pagos, transferencias, cuentas bancarias ni ningún otro servicio financiero. No se conecta con bancos. La cotización del dólar blue se consulta a dolarapi.com solo como referencia."
- Si el formulario pide tipo de servicio, elegir la opción de **gestión de finanzas personales** (presupuesto y registro), no banca, criptomonedas, préstamos ni seguros.

## 8. URLs obligatorias

Ruta: **Política → Información de la app** (o **Política de privacidad**) y **Política → Eliminación de cuenta**.

- **URL de la política de privacidad:** `https://control-gastos-ten-beta.vercel.app/privacidad`
- **URL de eliminación de cuenta:** `https://control-gastos-ten-beta.vercel.app/eliminar-cuenta`

Pendiente antes de enviar (son cosas del proyecto, no de Play):

- Crear las rutas `/privacidad` y `/eliminar-cuenta` en `src/App.tsx`. Hoy no existen. Deben mostrar `privacyPolicy` y `deleteAccountInfo` de `src/content/legal.ts`. (App.tsx no se tocó; es un cambio que hay que coordinar.)
- Reemplazar `CONTACT_EMAIL` en `src/content/legal.ts`.
- Confirmar que la página `/eliminar-cuenta` se vea sin iniciar sesión, porque Play la visita como un usuario externo.
- Agregar el botón "Eliminar mi cuenta" en `src/pages/Ajustes.tsx`. Hoy no está; la función `deleteMyAccount()` de `src/lib/account.ts` ya existe, pero no tiene UI.

La URL de eliminación debe ser pública y accesible desde un navegador normal, sin login.

## 9. Prueba cerrada (requisito previo a producción)

Para cuentas personales de desarrollador creadas después de noviembre de 2023, Play exige una prueba cerrada antes de habilitar producción: **al menos 12 testers que hayan aceptado la invitación y que usen la app durante 14 días seguidos**.

### 9.1 Crear la prueba cerrada

1. Ir a **Pruebas → Prueba cerrada** y crear un track (o usar el existente).
2. Subir el AAB (`.aab`) firmado a ese track. Completar los detalles de la versión (notas de la versión, idioma español).
3. Esperar a que Play revise el AAB. Puede tardar horas o más de un día.

### 9.2 Invitar a los testers

Ruta: **Prueba cerrada → Probadores**.

Opción A: lista de mails
- Crear una lista con al menos 12 direcciones de Gmail (las cuentas de Google Play deben ser Gmail o Google Workspace).
- Pegar la lista y guardar.

Opción B: Grupo de Google (recomendado si son muchos)
- Crear un grupo en Google Groups y agregar ahí los 12 o más testers.
- En Play Console, pegar la dirección del grupo en la lista de probadores.

En ambos casos:
- Copiar el **enlace de invitación** que muestra Play Console.
- Pedir a cada tester que abra el enlace desde la cuenta Google que está en la lista, acepte la invitación y, después, instale la app desde Play.
- Los 12 testers tienen que estar optados (haber instalado la app) y usarla durante 14 días seguidos. Sin uso real, el contador no avanza.

### 9.3 Seguimiento

- Revisar en **Prueba cerrada** cuántos testers optaron y cuántos días lleva la prueba.
- Si alguno abandona, invitar a otro para no caer debajo de 12 testers. Los días que cuentan son los de los 12 o más testers activos; si el número baja, el contador puede reiniciarse, así que conviene tener alguno de más.
- Pedir a los testers que dejen comentarios o reporten bugs. Esto también sirve para la revisión de producción.

### 9.4 Solicitar acceso a producción

Cuando se cumplen los 14 días con 12 testers:

1. En Play Console aparece el botón **Solicitar acceso a producción** (o "Aplicar para producción").
2. Completar el cuestionario de producción: cómo se probó la app, qué cambios hubo desde la prueba, qué problemas se resolvieron y cómo se garantiza la calidad.
3. Enviar la solicitud. Google la revisa; a veces pide más información.
4. Una vez aprobada, elegir países y publicar la versión en producción.

## Checklist antes de enviar

- [ ] Data safety completa y coherente con `src/content/legal.ts`.
- [ ] Clasificación IARC obtenida.
- [ ] Público objetivo: 18+.
- [ ] Anuncios: No.
- [ ] Cuenta de prueba creada y con datos de ejemplo, credenciales cargadas en "Instrucciones".
- [ ] App gubernamental: No.
- [ ] Funciones financieras aclaradas.
- [ ] `https://control-gastos-ten-beta.vercel.app/privacidad` responde (rutas en `App.tsx`).
- [ ] `https://control-gastos-ten-beta.vercel.app/eliminar-cuenta` responde sin login.
- [ ] `CONTACT_EMAIL` reemplazado por el mail real.
- [ ] Prueba cerrada: 12 testers, 14 días, optados.
- [ ] Ficha (título, descripción, capturas) cargada desde `store/listing-es.md`.
