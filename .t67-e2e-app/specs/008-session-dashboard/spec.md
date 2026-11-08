# Spec 008 — Sesión autenticada y dashboard base

Estado: implementada (2026-10-27) — cambio 2026-10-27 en revisión; cambio 2026-10-28 implementado con la spec 009 (2026-10-29)

## Contexto y objetivo

La aplicación permite iniciar sesión mediante `POST /api/auth/login`, pero actualmente no conserva una sesión autenticada: después de una respuesta exitosa solamente redirige a `/home`.

El backend confirmó que una autenticación exitosa devuelve un JWT y los datos del usuario. El token contiene identificador, correo, rol y vencimiento. Los roles existentes son `ADMINISTRADOR`, `ADMINISTRATIVO` y `TUTOR`.

El objetivo es crear una sesión después del login, conservarla hasta el vencimiento del token y permitir el acceso de los tres roles a un dashboard base privado. El dashboard recibe al usuario con un saludo que incluye su nombre y un subtítulo según su rol. También debe ser posible cerrar la sesión.

Cambio 2026-10-27: el dashboard del `TUTOR` incorpora una barra de navegación privada, una campana de notificaciones visual y un estado vacío de alumnos. Las tarjetas de resumen quedan pendientes hasta contar con endpoints. El cierre de sesión se ubica temporalmente en la barra privada, en el lugar que ocupaba “Registrarse”. Los roles `ADMINISTRADOR` y `ADMINISTRATIVO` conservan el dashboard base.

Cambio 2026-10-28 (implementado con la spec 009 el 2026-10-29): la barra privada y el cierre de sesión temporal fueron reemplazados por el menú lateral. En escritorio el menú lateral concentra identidad, campana y cuenta; en tablet y móvil una barra compacta mantiene hamburguesa, logotipo y campana. Las referencias de esta spec a la “barra privada” se leen como “menú lateral” o “barra compacta” según el tamaño de pantalla.

Esta spec no incluye los módulos funcionales, la navegación a ellos, las tarjetas de resumen ni el contador de notificaciones. La campana es solo visual y el botón “Registrar un alumno” no navega en esta versión.

## Usuarios

- Personas con rol `ADMINISTRADOR`.
- Personas con rol `ADMINISTRATIVO`.
- Personas con rol `TUTOR`.
- Personas no autenticadas que intentan acceder al dashboard.

## Historias de usuario

- HU-1. Como persona registrada, quiero que mi sesión quede iniciada después de autenticarme para no tener que ingresar mis credenciales en cada pantalla.
- HU-2. Como persona autenticada, quiero acceder al dashboard para entrar al área privada de la aplicación.
- HU-3. Como persona autenticada, quiero conservar mi sesión después de recargar o reabrir el navegador para continuar trabajando mientras el token siga vigente.
- HU-4. Como persona con una sesión vencida, quiero volver al login para autenticarme nuevamente.
- HU-5. Como persona autenticada, quiero cerrar sesión para dejar de compartir mi acceso en el dispositivo.
- HU-6. Como administrador, administrativo o tutor, quiero acceder al mismo dashboard base y recibir un saludo con mi nombre para reconocer mi contexto dentro de la aplicación.

## Definiciones

- **Sesión autenticada**: estado que permite reconocer al usuario entre solicitudes a partir del JWT emitido por el backend.
- **Token utilizable**: JWT cuyo payload es un objeto con `sub` (texto no vacío), `email` (texto no vacío), `role` perteneciente a los roles conocidos y `exp` (número finito mayor que cero). El campo `iat` no es exigido.
- **Usuario mínimo**: objeto `data.user` de la respuesta de login con `id` (texto o número no vacío) y `email` (texto no vacío). `name`, `lastname` y `role` de `user` son tolerados pero no bloquean la sesión: el nombre lo devuelve el servicio de usuario actual y el rol lo aporta el token.
- **Rol conocido**: `ADMINISTRADOR`, `ADMINISTRATIVO` o `TUTOR`.
- **Sesión vigente**: sesión cuyo token es utilizable y todavía no alcanzó su vencimiento.
- **Sesión vencida**: sesión cuyo token alcanzó su vencimiento o que el backend rechaza con `401`.
- **Dashboard base**: pantalla privada inicial común a los tres roles. Muestra “Panel principal”, un saludo con el nombre del usuario, un subtítulo según su rol, su correo electrónico, la etiqueta de su rol y la acción de cierre de sesión.
- **Dashboard del tutor**: dashboard base con saludo “¡Hola, {nombre}!” y un estado vacío de alumnos; no muestra tarjetas en esta versión.
- **Barra privada**: denominación histórica de la barra superior del dashboard. Fue reemplazada por el menú lateral y la barra compacta definidos en la spec 009.
- **Campana de notificaciones**: acción visual sin contador ni consulta al servicio en esta versión.
- **Estado vacío de alumnos**: bloque central con ilustración, título, texto y acción “Registrar un alumno”, sin navegación en esta versión.
- **Cierre de sesión local**: eliminación de la sesión conservada por la aplicación web. Puede notificar al endpoint de cierre del servicio, pero no depende de él y no revoca el JWT.

## Contrato del servicio

### Inicio de sesión

- Método y ruta: `POST /api/auth/login`.
- Autenticación previa: no.
- Cuerpo: `{ "email": "usuario@ejemplo.com", "password": "..." }`.
- Respuesta exitosa: contiene `data.token`, `data.user` y `message`.
- El token contiene al menos `sub`, `email`, `role`, `iat` y `exp`.
- El usuario contiene al menos `id`, `name`, `lastname`, `email` y `role`.
- La aplicación tolera campos adicionales sin necesidad de utilizarlos o exponerlos.
- El vencimiento de la sesión se obtiene de `exp`; con el contrato actual el token tiene una vigencia de 24 horas desde `iat`.
- Los errores de credenciales y de comunicación conservan el comportamiento definido por la spec 006.

### Usuario actual

- Método y ruta: `GET /api/auth/me`.
- Autenticación previa: sí, requiere un JWT válido en `Authorization: Bearer`.
- Respuesta exitosa: `{ "data": { "id", "name", "lastname", "email", "role" }, "message": "Usuario autenticado." }`.
- `id` puede venir como texto o número; la aplicación lo trata como texto.
- Una respuesta `401` indica sesión inválida; una `403` indica acceso denegado; un error de red, timeout, `5xx` o cuerpo inválido se trata como error general sin descartar la sesión.

### Solicitudes autenticadas

- Las solicitudes privadas al backend envían el JWT mediante `Authorization: Bearer <token>`.
- Una respuesta `401` indica que la sesión ya no es válida.
- Una respuesta `403` indica que el usuario autenticado no tiene permiso para la operación solicitada.

### Cierre de sesión

- Método y ruta: `POST /api/auth/logout`.
- Autenticación previa: sí, requiere un JWT válido.
- Responde que la sesión se cerró, pero **no revoca el token**: el backend es stateless.
- La aplicación borra siempre su sesión local y no depende de la respuesta de este endpoint para cerrar.

### Resumen y notificaciones

- Esta versión no consume endpoints de alumnos, inscripciones, casos que requieren atención ni notificaciones.
- La campana es visual y no muestra indicador numérico.
- Las tarjetas de resumen y el contador de no leídas quedan pendientes hasta que backend defina sus contratos.

## Mensajes de la interfaz

| Caso | Texto |
|---|---|
| Título del dashboard | “Panel principal” |
| Saludo del tutor | “¡Hola, {nombre}!” con un ícono de saludo |
| Subtítulo administrador | “Administrá la institución, los usuarios y las inscripciones desde un solo lugar.” |
| Subtítulo administrativo | “Gestioná las inscripciones de la institución desde un solo lugar.” |
| Subtítulo tutor | “Gestioná las inscripciones de tus hijos desde un solo lugar.” |
| Estado vacío, título | “Aún no tenés alumnos registrados” |
| Estado vacío, texto | “Para poder iniciar una inscripción, primero deberás registrar los datos de tus hijos en la sección de Mis alumnos” |
| Estado vacío, acción | “Registrar un alumno” |
| Campana | “Notificaciones” (nombre accesible) |
| Respuesta inválida | “La respuesta del servicio no tiene el formato esperado.” |
| Error al cargar el usuario | “No se pudo cargar tu información. Intentá nuevamente.” |
| Sesión vencida o inválida | “Tu sesión expiró. Iniciá sesión nuevamente.” |
| Acceso denegado | “No tenés permisos para acceder a esta sección.” |
| Cierre de sesión | “Cerrar sesión” |
| Rol administrador | “Administrador” |
| Rol administrativo | “Administrativo” |
| Rol tutor | “Tutor” |

## Requisitos funcionales

- RF-1. CUANDO el servicio confirma una autenticación exitosa con un token utilizable y un usuario mínimo, EL SISTEMA establece una sesión autenticada.
- RF-2. SI una respuesta exitosa no contiene un token utilizable o un usuario mínimo, ENTONCES EL SISTEMA no establece una sesión y muestra “La respuesta del servicio no tiene el formato esperado.”
- RF-3. CUANDO una autenticación es exitosa, EL SISTEMA redirige a `/dashboard`.
- RF-4. CUANDO una persona con una sesión vigente accede a `/login`, EL SISTEMA la redirige a `/dashboard`.
- RF-5. SI una persona sin sesión accede a `/dashboard`, ENTONCES EL SISTEMA la redirige a `/login`.
- RF-6. SI la sesión contiene un token que no es utilizable o que ya venció, ENTONCES EL SISTEMA la considera inválida, la descarta, redirige a `/login` y muestra “Tu sesión expiró. Iniciá sesión nuevamente.”
- RF-7. EL SISTEMA conserva la sesión entre recargas y cierres del navegador hasta el vencimiento indicado por el token.
- RF-8. EL SISTEMA no extiende ni renueva automáticamente la vigencia de la sesión.
- RF-9. CUANDO una persona con sesión vigente accede al dashboard, EL SISTEMA muestra “Panel principal”, el subtítulo correspondiente a su rol, su correo electrónico y la etiqueta en español de su rol. Para `TUTOR`, el saludo es “¡Hola, {nombre}!” con un ícono de saludo. El nombre, el correo y el rol mostrados provienen del servicio de usuario actual.
- RF-10. EL SISTEMA permite acceder al mismo dashboard base a administradores, administrativos y tutores.
- RF-11. SI el token presenta un rol que no es conocido, ENTONCES EL SISTEMA lo trata como token no utilizable: no crea sesión y no permite acceder al dashboard.
- RF-12. MIENTRAS el dashboard está visible, EL SISTEMA ofrece la acción “Cerrar sesión”.
- RF-13. CUANDO la persona activa “Cerrar sesión”, EL SISTEMA elimina la sesión local, notifica al endpoint de cierre como mejor esfuerzo y redirige a `/login`, sin que la respuesta del endpoint condicione el cierre.
- RF-14. CUANDO la persona intenta volver al dashboard después de cerrar sesión, EL SISTEMA exige una nueva autenticación.
- RF-15. CUANDO la aplicación realiza una solicitud privada al backend, EL SISTEMA adjunta el JWT de la sesión como credencial Bearer.
- RF-16. SI el backend responde `401` a una solicitud privada, ENTONCES EL SISTEMA descarta la sesión local, redirige a `/login` y muestra “Tu sesión expiró. Iniciá sesión nuevamente.”
- RF-17. SI el backend responde `403`, ENTONCES EL SISTEMA muestra “No tenés permisos para acceder a esta sección.” y conserva la sesión.
- RF-18. EL SISTEMA no muestra el JWT ni lo utiliza como contenido visible del dashboard.
- RF-19. CUANDO una persona con sesión vigente accede al dashboard, EL SISTEMA obtiene el usuario autenticado mediante `GET /api/auth/me` para mostrar el saludo con su nombre.
- RF-20. SI la obtención del usuario autenticado falla por red, timeout, `5xx` o respuesta inválida, ENTONCES EL SISTEMA muestra “No se pudo cargar tu información. Intentá nuevamente.” y ofrece reintentar, sin descartar la sesión. Los casos `401` y `403` se rigen por RF-16 y RF-17.
- RF-21. CUANDO una persona autenticada accede al dashboard, EL SISTEMA muestra la navegación privada definida en la spec 009, que no incluye las acciones “Iniciar sesión” ni “Registrarse”.
- RF-22. EL SISTEMA muestra en la navegación privada una campana de notificaciones con nombre accesible “Notificaciones”.
- RF-23. MIENTRAS no exista el servicio de notificaciones, EL SISTEMA muestra la campana sin indicador numérico y no consulta notificaciones.
- RF-24. CUANDO una persona con rol `TUTOR` accede al dashboard, EL SISTEMA muestra el saludo “¡Hola, {nombre}!” con un ícono de saludo y el texto “Gestioná las inscripciones de tus hijos desde un solo lugar.”
- RF-25. MIENTRAS no exista el servicio de alumnos, EL SISTEMA muestra en el dashboard del `TUTOR` el estado vacío con una ilustración, el título “Aún no tenés alumnos registrados” y el texto de la spec.
- RF-26. EL SISTEMA muestra el botón azul “Registrar un alumno” sin navegación en esta versión.
- RF-27. EL SISTEMA ubica la acción “Cerrar sesión” en el pie del menú lateral, según la spec 009.
- RF-28. CUANDO una persona con rol `ADMINISTRADOR` o `ADMINISTRATIVO` accede al dashboard, EL SISTEMA conserva el dashboard base sin el estado vacío del tutor.

## Requisitos no funcionales

- RNF-1. Privacidad: el token no debe aparecer en URLs, historial, consola, registros, HTML, payloads destinados al cliente ni almacenamiento accesible desde JavaScript.
- RNF-2. Protección de la sesión: el mecanismo de almacenamiento debe impedir la lectura del token por scripts del navegador y utilizar HTTPS en producción.
- RNF-3. Autorización: el backend es la autoridad para proteger datos y operaciones; las comprobaciones de la interfaz no reemplazan la autorización del servicio.
- RNF-4. Caché: la ruta del dashboard es dinámica y las respuestas privadas se generan por solicitud, sin servirse desde una caché compartida entre usuarios.
- RNF-5. Accesibilidad: el dashboard y el cierre de sesión deben poder utilizarse con teclado, tener nombres accesibles, foco visible y contraste AA.
- RNF-6. Responsive: el dashboard debe utilizarse sin desbordamiento horizontal entre 320 y 1920 px.
- RNF-7. Identificación: el dashboard debe tener título, descripción y metadatos Open Graph propios.
- RNF-8. Resiliencia: el dashboard debe tener estados de carga y error a nivel de ruta.
- RNF-9. Consistencia: los textos visibles y las etiquetas de roles deben estar en español.
- RNF-10. Dependencias: la funcionalidad debe resolverse sin incorporar dependencias externas nuevas.
- RNF-11. Accesibilidad: la campana, el botón “Registrar un alumno” y “Cerrar sesión” tienen nombres accesibles, foco visible y se operan con teclado.
- RNF-12. Responsive: el estado vacío y la navegación privada (menú lateral o barra compacta) se adaptan sin desbordamiento horizontal entre 320 y 1920 px.
- RNF-13. Assets: si la ilustración se implementa como archivo, debe vivir en `public/` con un nombre descriptivo; la alternativa es un SVG inline.

## Casos límite

- Respuesta `2xx` sin `data`, sin token o sin usuario mínimo: no se crea sesión.
- Respuesta de login con un token ya vencido: no se crea sesión.
- Token con formato inválido: se trata como ausencia de sesión válida.
- Token sin `sub`, sin `email`, sin `role` o sin `exp`: no se considera utilizable.
- Token con un `role` desconocido: se trata como token no utilizable.
- Token con `iat` en el futuro: no se considera vencido si `exp` sigue siendo futuro; `iat` no se usa para el vencimiento.
- Token cuyo `exp` acaba de alcanzarse: la sesión queda vencida.
- Sesión presente, pero backend responde `401`: se descarta la sesión local.
- Usuario con rol administrador, administrativo o tutor: puede acceder al dashboard base.
- Usuario autenticado que intenta abrir `/login`: vuelve a `/dashboard`.
- Una sesión que no puede parsearse en `/login` se trata como ausente, para evitar un bucle de redirección entre `/login` y `/dashboard`.
- Recarga o reapertura del navegador antes del vencimiento: se conserva la sesión.
- Recarga o reapertura después del vencimiento: se solicita autenticación.
- Token que vence mientras el dashboard ya está cargado: la vista permanece hasta la siguiente interacción, que descarta la sesión.
- Cierre de sesión seguido de “atrás” o recarga: no se recupera el acceso privado.
- Cierre de sesión con varias pestañas abiertas: las demás pestañas pierden acceso en su próxima solicitud al servidor; no se exige sincronización visual inmediata.
- Dos inicios de sesión simultáneos en pestañas distintas: la sesión más reciente reemplaza a la anterior.
- Doble activación de “Cerrar sesión”: se bloquea la acción mientras está en curso.
- Fallo de red durante la obtención del usuario: se muestra el error general y se permite reintentar, sin interpretarlo como sesión vencida.
- Respuesta `403` del servicio de usuario: se informa el acceso denegado sin cerrar la sesión.
- `TUTOR` sin endpoint de alumnos: se muestra el estado vacío y el botón sin navegación.
- `TUTOR` con alumnos (cuando exista el endpoint): se ocultará el estado vacío; comportamiento pendiente.
- `ADMINISTRADOR` y `ADMINISTRATIVO`: no ven el estado vacío del tutor.
- Campana sin servicio de notificaciones: se muestra sin badge ni error.
- El botón “Registrar un alumno” no navega en esta versión.

## Limitaciones conocidas

- El backend es stateless: el cierre de sesión no revoca el JWT. Una copia del token podría seguir siendo aceptada por el backend hasta su vencimiento.
- La aplicación no renueva tokens ni ofrece una opción “recordarme”.
- El dashboard base no consulta todavía datos de inscripciones ni presenta funciones específicas por rol, salvo el subtítulo de bienvenida.
- El estado vacío del tutor es incondicional mientras no exista el endpoint de alumnos.
- Las tarjetas de resumen y el contador de notificaciones quedan pendientes de contrato con backend.
- El cierre de sesión vive en el pie del menú lateral desde la spec 009 (cambio 2026-10-28).
- Los valores de rol provienen del backend en español (`ADMINISTRADOR`, `ADMINISTRATIVO`, `TUTOR`). Se tratan como datos del contrato, no como identificadores de código; es una excepción aceptada al principio de consistencia lingüística.

## Fuera de alcance

- Cambios en el backend.
- Revocación o invalidación del token en el servidor.
- Refresh tokens o renovación automática de sesión.
- Módulos de inscripciones, estudiantes, cursos, reportes o administración.
- Tarjetas “Mis alumnos”, “Inscripciones en curso” y “Requieren atención” (pendientes de endpoint).
- Navegación a “Mis alumnos”, inscripciones o notificaciones.
- Registro efectivo de alumnos.
- Listado y contador real de notificaciones.
- La implementación del menú lateral y su botón de contraer/expandir; se especifica en la spec 009.
- Acciones o permisos diferenciados dentro del dashboard según el rol.
- Perfil de usuario y edición de datos personales.
- Recuperación de contraseña, registro o verificación de correo.
- Redirección a una URL privada previamente solicitada después del login.
- Sincronización instantánea del logout entre pestañas.

## Criterios de finalización

- Un login exitoso crea sesión y lleva a `/dashboard`.
- Los tres roles pueden acceder al dashboard base y reciben un saludo con su nombre y el subtítulo de su rol.
- Una respuesta exitosa incompleta o inválida no crea sesión.
- El dashboard obtiene el usuario autenticado mediante `GET /api/auth/me`.
- La sesión sobrevive a recargas y reaperturas hasta su vencimiento.
- Un usuario sin sesión o con sesión vencida no puede acceder al dashboard.
- Un usuario autenticado que accede a `/login` vuelve al dashboard.
- El cierre de sesión elimina el acceso local, notifica al endpoint de cierre y vuelve a `/login`.
- Las solicitudes privadas utilizan el JWT como Bearer.
- Los casos `401` y `403` tienen comportamientos diferenciados.
- El token no queda expuesto en la interfaz, URLs, registros ni almacenamiento accesible desde JavaScript.
- Las pruebas unitarias, de integración y E2E quedan en verde.
- `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build` finalizan sin errores.
- La spec 006 queda actualizada con el contrato real y el nuevo comportamiento de sesión y redirección.
- El dashboard muestra la navegación privada de la spec 009, sin “Iniciar sesión” ni “Registrarse”, con campana y cierre de sesión en el menú lateral.
- El tutor recibe “¡Hola, {nombre}!” con ícono y el texto de la spec.
- El tutor ve el estado vacío con ilustración, título, texto y botón sin navegación.
- `ADMINISTRADOR` y `ADMINISTRATIVO` conservan el dashboard base.
- El estado vacío y la navegación privada son accesibles y responsive.

## Dudas abiertas

- [NO BLOQUEANTE] ¿La ilustración se implementa como SVG inline o como archivo en `public/`?
- [NO BLOQUEANTE] ¿El saludo “¡Hola, {nombre}!” y el estado vacío son exclusivos de `TUTOR`? Se asume que sí.
- [NO BLOQUEANTE] El estado vacío pasará a ser condicional cuando backend exponga el endpoint de alumnos.
