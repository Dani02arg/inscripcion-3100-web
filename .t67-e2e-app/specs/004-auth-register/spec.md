# Spec 004 — Registro de Usuarios

**Estado:** implementada

**Clarificación:** parcial; quedan dudas abiertas.

## Contexto y objetivo

La institución necesita que nuevas personas creen su propia cuenta desde una vista
pública de registro, enviando sus datos personales e institucionales al servicio
de registro de la API de Laravel. El registro debe ser claro, guiar al usuario
cuando se equivoca y no exponer el consumo del servicio ni las credenciales en
el navegador.

La implementación y la ubicación de los archivos se detallan en
`specs/004-auth-register/plan.md`.

## Usuarios

- **Persona no autenticada:** quiere crear una cuenta para acceder al sistema.
- **Persona con baja familiaridad digital:** necesita mensajes claros y pocos pasos.
- **Responsable del sitio:** necesita que el alta sea segura y consistente con la identidad visual.

## Historias de usuario

- HU-1. Como persona no autenticada, quiero registrarme con mis datos personales para crear mi cuenta.
- HU-2. Como persona no autenticada, quiero ver u ocultar mi contraseña y recibir avisos claros para elegir una válida.
- HU-3. Como persona no autenticada, quiero elegir mi fecha de nacimiento sin poder seleccionar hoy ni fechas futuras, y recibir un aviso si no tengo 18 años.
- HU-4. Como persona no autenticada, quiero saber exactamente qué campo falló cuando el registro es rechazado.
- HU-5. Como responsable del sitio, quiero que el registro no exponga el servicio ni credenciales en el navegador.

## Definiciones

- Payload de registro: objeto con exactamente los campos dni, cuil, name, lastname, email, password, user_phone y birthdate.
- Formulario de registro: nueve controles obligatorios, compuestos por los ocho campos del payload y la confirmación de contraseña.
- DNI: documento de 7 u 8 dígitos.
- CUIL: identificación de 11 dígitos; si se ingresan guiones, se normaliza a dígitos.
- Teléfono: 10 dígitos; no se admite el prefijo internacional +54 por ahora.
- Contraseña: entre 8 y 16 caracteres, con al menos una minúscula, una mayúscula y un número o un carácter especial. No puede estar formada solo por espacios ni contener emojis.
- Confirmación de contraseña: campo auxiliar obligatorio, no vacío y no formado solo por espacios. Debe coincidir exactamente con la contraseña, incluidas las mayúsculas y minúsculas. No se envía al servicio.
- Fecha de nacimiento: fecha anterior al día de hoy, con al menos 18 años cumplidos. Para personas nacidas el 29 de febrero, en años no bisiestos el 28 de febrero cuenta como un año más. Se muestra en formato DD/MM/YYYY y se envía en formato YYYY-MM-DD.
- Servicio de registro: endpoint POST `${LARAVEL_API_URL}/api/auth/register`, donde `LARAVEL_API_URL` es una variable de entorno de servidor sin valor por defecto en el código; en desarrollo apunta a `http://localhost:8000`. Responde con la estructura data, message y errors.
- Vista de verificación de correo: destino /verify-email, que se implementará en el futuro; hasta entonces se acepta un 404 temporal.
- Vista de inicio de sesión: destino /login, que no existe todavía.
- Excepción lingüística aprobada: los nombres dni y cuil se conservan por contrato de la API, aunque no estén en inglés.
- **Tarjeta de contenido:** contenedor de superficie que agrupa el título, la descripción y el formulario de registro; su ancho es la referencia de RF-24.

## Requisitos funcionales (EARS — español)

- RF-1: EL SISTEMA debe ofrecer una vista pública de registro accesible sin autenticación.
- RF-2: EL SISTEMA debe presentar un formulario con nueve controles obligatorios: los campos dni, cuil, name, lastname, email, password, user_phone y birthdate, más la confirmación de contraseña.
- RF-3: CUANDO la persona escribe la contraseña, EL SISTEMA debe validar en cada cambio que tenga entre 8 y 16 caracteres, al menos una minúscula, una mayúscula y un número o carácter especial, y mostrar un mensaje de error mientras no cumpla. No debe aceptar emojis ni permitir pegar o autocompletar la contraseña.
- RF-4: EL SISTEMA debe permitir alternar entre mostrar y ocultar la contraseña sin modificar su valor.
- RF-5: CUANDO la persona escribe la confirmación de contraseña, EL SISTEMA debe comprobar en cada cambio que no esté vacía, que no esté formada solo por espacios y que coincida exactamente con la contraseña, incluidas mayúsculas y minúsculas, y mostrar un error mientras no cumpla. Tampoco debe permitir pegar ni autocompletar la confirmación.
- RF-6: SI la contraseña, su confirmación o cualquier otro campo no cumple las reglas, o si la persona no tiene 18 años cumplidos, ENTONCES EL SISTEMA no debe enviar el formulario.
- RF-7: CUANDO la persona edita el DNI, EL SISTEMA debe aceptar solo 7 u 8 dígitos numéricos.
- RF-8: CUANDO la persona edita el CUIL, EL SISTEMA debe aceptar 11 dígitos y normalizar los guiones si se ingresan.
- RF-9: CUANDO la persona edita el teléfono, EL SISTEMA debe aceptar solo 10 dígitos y rechazar el prefijo +54.
- RF-10: CUANDO la persona edita el correo, EL SISTEMA debe validar un formato de correo válido.
- RF-11: CUANDO la persona edita el nombre o el apellido, EL SISTEMA debe exigir que no estén vacíos y que tengan al menos 2 caracteres no blancos; no se cuentan los espacios en blanco.
- RF-12: CUANDO la persona elige la fecha de nacimiento, EL SISTEMA debe impedir seleccionar la fecha actual y cualquier fecha futura.
- RF-13: CUANDO la persona elige una fecha de nacimiento pasada, EL SISTEMA debe mostrar un mensaje si no tiene 18 años cumplidos y no debe enviar el formulario. Las fechas pasadas de personas menores de 18 años son seleccionables y generan el mensaje; no se deshabilitan.
- RF-14: EL SISTEMA debe mostrar la fecha de nacimiento en formato DD/MM/YYYY y enviarla en formato YYYY-MM-DD.
- RF-15: CUANDO la persona envía el formulario con todos los datos válidos, EL SISTEMA debe solicitar el registro de la cuenta al servicio de registro.
- RF-16: CUANDO el servicio de registro responde con éxito, EL SISTEMA debe redirigir a la vista de verificación de correo. Hasta que esa vista exista, se acepta un 404 temporal.
- RF-17: SI el servicio de registro responde con errores asociados a campos, ENTONCES EL SISTEMA debe mostrar cada mensaje junto al campo correspondiente.
- RF-18: SI el servicio de registro responde con un mensaje general, ENTONCES EL SISTEMA debe mostrarlo en un aviso en la parte superior del formulario.
- RF-19: SI la conexión con el servicio falla o expira, ENTONCES EL SISTEMA debe mostrar un aviso general y permitir reintentar el envío sin perder los datos ingresados. La conservación de los datos también aplica a errores de validación y errores internos del servicio.
- RF-20: MIENTRAS el registro está en curso, EL SISTEMA debe mostrar un estado de carga e impedir envíos duplicados.
- RF-21: EL SISTEMA debe ofrecer un botón principal que envía el formulario y un botón secundario que lleva a la vista de inicio de sesión. La vista /login no existe todavía y su destino queda pendiente.
- RF-22: EL SISTEMA debe interpretar la respuesta del servicio con la estructura data, message y errors.
- RF-23: EL SISTEMA no debe realizar la llamada al servicio de registro desde el navegador.
- RF-24: EL SISTEMA debe usar el 95 % del ancho actual de la tarjeta de contenido en escritorio y el 97 % de su ancho actual en móvil, sin generar desplazamiento horizontal ni recortar el formulario. El ancho actual se mide antes de aplicar este cambio.
- RF-25: EL SISTEMA debe presentar los campos en este orden visual: nombre, apellido, DNI, CUIL, fecha de nacimiento, correo electrónico, teléfono, contraseña y confirmación. La fecha de nacimiento debe ocupar una fila propia; contraseña y confirmación deben compartir una fila de dos columnas en escritorio y apilarse en móvil.
- RF-26: CUANDO la persona edita la fecha de nacimiento con el teclado, EL SISTEMA debe aceptar únicamente dígitos y aplicar automáticamente el formato DD/MM/YYYY mientras escribe, conservando el valor ISO YYYY-MM-DD para el envío.
- RF-27: CUANDO la persona activa el ícono de calendario adyacente al campo de fecha de nacimiento, EL SISTEMA debe abrir un calendario en un modal superpuesto que no altere la disposición del formulario. El calendario no debe abrirse al enfocar, escribir o hacer clic en el campo. CUANDO la persona selecciona una fecha, EL SISTEMA debe actualizar el campo y cerrar el modal.
- RF-28: EL SISTEMA debe obtener la URL base del servicio de registro exclusivamente de la variable de entorno `LARAVEL_API_URL`, sin ningún valor por defecto escrito en el código, y no debe llamar al servicio si la variable falta, está vacía o no es una URL absoluta `http`/`https`.

## Requisitos no funcionales

- RNF-1: La interfaz debe usar exclusivamente los colores, tipografías y tokens del sistema de diseño institucional.
- RNF-2: Cada campo debe tener una etiqueta asociada y los errores deben anunciarse a los lectores de pantalla.
- RNF-3: El formulario debe ser operable por teclado, con foco visible y contraste de texto de al menos 4.5:1.
- RNF-4: La vista debe adaptarse sin solapamientos ni desplazamiento horizontal entre 320 px y 1920 px.
- RNF-5: La contraseña no debe registrarse en logs ni mostrarse en texto plano, salvo cuando la persona elige mostrarla.
- RNF-6: La única dependencia nueva permitida es la librería de calendario aprobada en el plan: `react-day-picker@10.0.2`.
- RNF-7: Los tipos deben ser estrictos; no se admite el tipo any.
- RNF-8: La vista debe definir su título y su descripción para buscadores.

## Casos límite

- EC-1: Servicio no disponible o tiempo de espera agotado: aviso general y posibilidad de reintentar.
- EC-2: Respuesta de validación con errores por campo: mensajes junto a cada campo.
- EC-3: Error interno del servicio: aviso general; los datos ingresados se conservan.
- EC-4: Contraseña de 7 o de 17 caracteres, o que no cumpla las reglas de complejidad: error en tiempo real.
- EC-5: Confirmación vacía, formada solo por espacios o distinta solo por mayúsculas y minúsculas: error y sin envío.
- EC-6: Fecha de hoy o futura: no seleccionable.
- EC-7: Persona menor de 18 años: la fecha pasada es seleccionable, muestra error y no se envía.
- EC-8: CUIL con guiones: se normaliza a 11 dígitos.
- EC-9: Espacios al inicio o al final: se recortan antes de validar en los campos de texto. La contraseña y su confirmación no se recortan.
- EC-10: Envío con la tecla Enter: mismo comportamiento que el botón principal.
- EC-11: Doble clic en el botón principal: un solo envío.
- EC-12: Correo ya registrado: el mensaje del servicio se muestra junto al campo.
- EC-13: Uso del calendario solo con teclado: totalmente operable.
- EC-14: Persona nacida el 29 de febrero: en años no bisiestos, el 28 de febrero cuenta como un año más.
- EC-15: Teléfono con prefijo +54: se rechaza.
- EC-16: Contraseña o confirmación con emojis, pegada o autocompletada: se rechaza.
- EC-17: Fecha mostrada en pantalla en formato DD/MM/YYYY y enviada en YYYY-MM-DD.
- EC-18: Error de validación o error interno del servicio: los datos ingresados se conservan.
- EC-19: Variable `LARAVEL_API_URL` ausente, vacía o sin esquema `http`/`https`: aviso general en el formulario, sin llamada al servicio y sin perder los datos ingresados.

## Fuera de alcance

- Implementar la vista de verificación de correo.
- Inicio de sesión, recuperación de contraseña y autenticación automática.
- Implementar la vista /login; el botón secundario queda con destino pendiente.
- Edición de perfil y carga de avatar.
- Reglas posteriores al alta, como roles o matrícula.
- Comprobaciones de duplicados distintas de las que devuelva el servicio.
- Configurar el endpoint de producción en el despliegue: se resuelve con la variable `LARAVEL_API_URL`, cuyo valor no se versiona.
- Los estados de carga y los límites de error de esta ruta; se implementarán después. Queda registrada como excepción temporal a la constitución #12.

## Criterios de finalización

- El formulario muestra nueve controles obligatorios y envía exactamente los ocho campos del payload, con birthdate en YYYY-MM-DD.
- La contraseña (8 a 16, con mayúscula, minúscula y número o carácter especial) y su confirmación se validan en cada cambio; no se aceptan emojis, pegado ni autocompletado.
- La fecha bloquea hoy y el futuro, muestra un aviso si la persona es menor de 18 años y aplica la regla del 29 de febrero.
- La fecha se muestra en DD/MM/YYYY y se envía en YYYY-MM-DD.
- El teléfono rechaza el prefijo +54.
- Los errores se muestran por campo y, cuando corresponde, en un aviso general; los datos se conservan ante errores de validación, internos y de conexión.
- El alta exitosa redirige a /verify-email, con 404 temporal aceptado.
- Ninguna llamada al servicio de registro ocurre desde el navegador.
- La tarjeta reduce su ancho al 95 % en escritorio y al 97 % en móvil sin desplazamiento horizontal ni recorte.
- Los campos siguen el orden nombre, apellido, DNI, CUIL, fecha, correo, teléfono, contraseña y confirmación; la fecha ocupa fila propia y contraseña/confirmación comparten fila en escritorio y se apilan en móvil.
- La fecha es editable por teclado con formato automático DD/MM/YYYY; el calendario se abre solo desde el icono, en un modal que no altera el layout, y se cierra al seleccionar, con Escape o con el overlay.
- La vista respeta los estilos institucionales y cumple las reglas de accesibilidad.
- La URL base del servicio se resuelve solo de `LARAVEL_API_URL`; el código no contiene URLs de API literales y, si la variable falta o es inválida, el formulario muestra un aviso general sin llamar al servicio.
- pnpm lint, la verificación de tipos y pnpm build finalizan sin errores.

## Evidencia de verificación (2026-10-21)

- **E2E de integración con servicio simulado** en `localhost:8000`: alta exitosa con redirección a `/verify-email`; payload exacto de ocho claves, `birthdate` ISO `2008-10-01`, CUIL y teléfono normalizados, sin `confirmPassword`. `GET /verify-email` respondió 404, aceptado por D5.
- **Errores:** 422 con errores de correo y DNI junto a cada campo; 422 general y 500 en banner; correo ya registrado junto al campo; error de red y timeout real (10,6 s) con banner. Todos conservaron los valores y generaron una sola petición. Se corrigió la detección del `TimeoutError` nativo de `AbortSignal.timeout`.
- **Envío:** doble clic y Enter repetido generaron una sola petición; Enter navegó a `/verify-email`; los eventos de red del navegador no incluyeron llamadas a `:8000`.
- **Pruebas automatizadas:** 21/21 tests nativos (`tests/validation/register.test.ts`, `tests/api/parse.test.ts`, `tests/api/auth.test.ts`).
- **Verificación estática:** `pnpm lint` con 0 errores y 4 avisos preexistentes de `<img>`; `pnpm exec tsc --noEmit` sin errores; `pnpm build` correcto con `/register` estática. Sin `any`, supresiones de tipos ni `fetch` en `app/ui`; sin placeholders Tailwind con tres puntos entre corchetes.
- **Cambio de Fase I (RF-24 a RF-27):** verificación CDP con Brave headless. Tarjeta al 97 % en 320/375 px y al 95 % en 768/1024/1440/1920 px, sin overflow; orden de campos correcto y contraseñas en fila desde 768 px y apiladas en móvil; máscara progresiva `123`→`12/3`, `12345`→`12/34/5`, `01012000`→`01/01/2000` con ISO `2000-01-01`; el calendario no se abre al enfocar ni hacer clic en el campo y sí desde el icono; el modal no desplaza la tarjeta (`layoutShift: false`), atrapa el foco, cierra con Escape y overlay y devuelve el foco; la selección actualizó la fecha y cerró el modal. Pruebas: 23/23 tests nativos. `pnpm lint` 0 errores, `pnpm exec tsc --noEmit` sin errores y `pnpm build` en verde.
- **Cambio de Fase J (RF-28, EC-19):** la URL base se resuelve en `app/lib/api/config.ts` desde `LARAVEL_API_URL`, sin valor por defecto en el código; `grep -rn "localhost:8000" app/` no devuelve resultados y el build de producción no contiene el literal (referencia la variable en el bundle de servidor, se lee en cada petición). CDP con Brave headless y servicio simulado: con `.env` el alta llegó a `POST http://localhost:8000/api/auth/register` con las ocho claves y redirigió a `/verify-email`, y el 422 mostró banner y error junto al campo conservando los datos; con `LARAVEL_API_URL=` el formulario mostró el aviso general, conservó los datos, el servicio simulado no recibió ninguna petición y la consola del servidor registró `[register] Falta la variable de entorno LARAVEL_API_URL.` Pruebas: 27/27 tests nativos; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`), `pnpm exec tsc --noEmit` sin errores y `pnpm build` en verde. `README.md` y `.env.example` documentan la variable.
- **Excepción D2:** se mantienen Geist/Geist Mono y `lang="en"`; la deuda de idioma queda registrada. T23 (`loading.tsx`/`error.tsx`) permanece diferida por alcance aprobado.

## Dudas abiertas

- [NECESITA ACLARACIÓN] RF-1: no se define la ruta pública, el comportamiento para una persona ya autenticada ni el nivel de accesibilidad exigido.
- [NECESITA ACLARACIÓN] RF-7: no se define si se aceptan ceros a la izquierda, todo ceros o separadores no numéricos.
- [NECESITA ACLARACIÓN] RF-8: no se define si se valida el dígito verificador del CUIL, los prefijos válidos ni la posición de los guiones.
- [NECESITA ACLARACIÓN] RF-9: además del +54, no se define si se aceptan espacios, guiones o paréntesis.
- [NECESITA ACLARACIÓN] RF-3: no se define el conjunto exacto de caracteres especiales admitidos.
- [NECESITA ACLARACIÓN] RF-10: no se define el estándar de correo válido, la longitud máxima, mayúsculas ni Unicode.
- [NECESITA ACLARACIÓN] RF-11: no se define si se aceptan Unicode, apóstrofes, guiones, números o espacios internos en nombres y apellidos.
- [NECESITA ACLARACIÓN] RF-12 y RF-13: no se define la zona horaria ni la fuente de verdad para “hoy”.
- [NECESITA ACLARACIÓN] RF-14: no se define si la fecha se construye con partes locales o UTC.
- [NECESITA ACLARACIÓN] RF-15 y RF-16: no se define si el éxito es un estado HTTP 2xx, un cuerpo sin errores o ambos.
- [NECESITA ACLARACIÓN] RF-17 y RF-18: no se define el mapeo de errores por clave, las claves desconocidas ni la prioridad cuando llegan errores de campo y mensaje general.
- [NECESITA ACLARACIÓN] RF-19: no se define el timeout ni la idempotencia del reintento cuando el servidor ya procesó la solicitud.
- [NECESITA ACLARACIÓN] RF-20: no se define el contenido ni la duración del estado de carga.
- [NECESITA ACLARACIÓN] RF-21: no se define qué ocurre al activar el botón secundario mientras /login no exista (404, deshabilitado o mensaje).
- [NECESITA ACLARACIÓN] RF-22: no se define el tipo ni la obligatoriedad de data, message y errors.
- [NECESITA ACLARACIÓN] RNF-1: no hay lista canónica de tokens y tipografías; la excepción de tipografía D2 está registrada en el plan.
- [NECESITA ACLARACIÓN] RNF-2: no se define el mecanismo ARIA, el resumen de errores ni el movimiento de foco.
- [NECESITA ACLARACIÓN] RNF-3: no se define la versión o nivel WCAG ni el contraste de elementos no textuales.
- [NECESITA ACLARACIÓN] RNF-4: no se cubren zoom, escalado de texto ni densidad de píxeles.
- [NECESITA ACLARACIÓN] RNF-5: no se delimita el alcance de “logs” ni el tratamiento de la contraseña en memoria o DevTools.
- [NECESITA ACLARACIÓN] RNF-6: no se definen las dependencias transitivas ni la evidencia de aprobación.
- [NECESITA ACLARACIÓN] RNF-7: no se define si la prohibición alcanza castings inseguros y supresiones de tipos.
- [NECESITA ACLARACIÓN] RNF-3 y RNF-5: el bloqueo de pegado y autocompletado puede afectar gestores de contraseñas y ayudas de accesibilidad; no se definió una excepción.
- [NECESITA ACLARACIÓN] RNF-8: no se definen los valores, longitudes ni Open Graph de título y descripción.
- [NECESITA ACLARACIÓN] No se define si los mensajes del backend en inglés deben mostrarse tal cual o traducirse.
- [NECESITA ACLARACIÓN] No se cubren respuestas 2xx con errors no vacío, 401, 403, 429, HTML no JSON, envío repetido por Enter, recarga, botón atrás o múltiples pestañas.
