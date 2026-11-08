# Spec 007 — Recuperación de contraseña

Estado: implementada (2026-10-27)

## Contexto y objetivo

La aplicación ya permite registrarse, verificar el correo electrónico e iniciar sesión. En la pantalla de inicio de sesión existe un enlace “Recuperar contraseña” que hoy es provisional y no permite completar la recuperación.

El objetivo es que una persona registrada que olvidó su contraseña pueda solicitar un código de recuperación a su correo, ingresarlo junto con una nueva contraseña y volver al inicio de sesión para entrar con la nueva contraseña.

El flujo tiene dos pantallas: una para solicitar el código y otra para ingresar el código y definir la nueva contraseña. El correo ingresado en la primera pantalla se conserva durante el proceso para que la persona no tenga que volver a escribirlo.

Esta versión se implementa **solo en la aplicación web**, con el contrato actual del backend. No incluye cambios en el backend.

Supuesto operativo: el envío efectivo del correo depende de que el servicio de notificaciones esté habilitado y de que la cola se procese. La aplicación no puede confirmar la entrega del correo; si el código no llega, la persona puede volver a solicitar uno nuevo.

## Usuarios

- Personas registradas que olvidaron su contraseña.
- Personas con acceso al correo electrónico registrado.
- Personas que necesitan volver a solicitar el código porque no lo recibieron o porque venció.

## Historias de usuario

- HU-1. Como persona registrada que olvidó su contraseña, quiero solicitar un código a mi correo para poder cambiarla.
- HU-2. Como persona que recibió el código, quiero ingresarlo y definir una nueva contraseña para recuperar el acceso.
- HU-3. Como persona que no recibió el código o dejó vencer el plazo, quiero volver a solicitar uno para continuar.
- HU-4. Como persona que completó el cambio, quiero volver al inicio de sesión para entrar con mi nueva contraseña.

## Definiciones

- **Código de recuperación**: código de cinco dígitos enviado al correo registrado. Vence a los 15 minutos y solo puede usarse una vez.
- **Solicitud activa**: última solicitud de código exitosa registrada por la interfaz. Se conserva durante 15 minutos, sobrevive a la recarga de la pantalla de cambio y se reemplaza por una nueva solicitud exitosa. No garantiza que el código siga vigente; la vigencia la valida el servicio.
- **Correo conservado**: correo de la solicitud activa, usado para enmascarar el destino y enviar el cambio de contraseña.
- **Solicitud vencida**: solicitud activa con más de 15 minutos desde su registro. La interfaz ofrece volver a solicitar.
- **Código inválido o vencido**: código que no coincide con uno válido, que ya fue usado o que superó los 15 minutos. El servicio no distingue estos casos en su respuesta.
- **Nueva contraseña**: contraseña que reemplaza a la anterior. Debe tener entre 8 y 16 caracteres, con al menos una mayúscula, una minúscula y un número o carácter especial. Se aplica la misma política del registro, incluido el rechazo de emojis.
- **Volver a solicitar**: acción que lleva a la pantalla de solicitud con el correo precargado. No envía el código automáticamente y no incluye cuenta atrás ni contador de solicitudes.
- **Contraseña anterior**: contraseña vigente antes del cambio. No se impide que la nueva contraseña coincida con ella.
- **Respuesta estándar**: respuesta del servicio con `message` y, cuando corresponde, `errors`. El campo `data` es opcional y la interfaz no depende de él.

## Contrato de servicio

La URL base se toma de la configuración de la aplicación. Las rutas son relativas a esa base.

### Solicitud de código

- Método y ruta: `POST /api/auth/forgot-password`.
- Cuerpo: `{ "email": "usuario@ejemplo.com" }`.
- Respuesta exitosa `200`: `{ "message": "Se ha enviado un código de recuperación a tu correo." }`.
- Validación `422`: incluye `message` y `errors` por campo. Por ejemplo, si el correo no está registrado, `errors.email` contiene “El correo electrónico no está registrado.”.
- Respuesta `404`: la interfaz la trata como correo no disponible y muestra el mismo mensaje que para un correo no registrado.
- Respuesta `429`, `5xx`, error de red, timeout o cuerpo inválido: se trata como error general.

### Cambio de contraseña

- Método y ruta: `POST /api/auth/reset-password`.
- Cuerpo: `{ "email": "usuario@ejemplo.com", "code": "12345", "password": "nueva-clave-segura", "password_confirmation": "nueva-clave-segura" }`.
- Respuesta exitosa `200`: `{ "message": "Contraseña restablecida correctamente." }`.
- Código inválido o vencido `422`: `{ "message": "Código de recuperación inválido." }`.
- Validación `422`: incluye `message` y `errors` por campo. Por ejemplo, correo no registrado, código que no tiene 5 caracteres, contraseña de menos de 8 caracteres o confirmación que no coincide.
- Respuesta `404`: la interfaz la trata como correo no disponible y muestra el mensaje de correo no registrado, con opción de volver a solicitar.
- Respuesta `429`, `5xx`, error de red, timeout o cuerpo inválido: se trata como error general, salvo el timeout de cambio, que tiene un mensaje específico.

### Inicio de sesión posterior

Una vez restablecida la contraseña, la persona inicia sesión con la nueva contraseña mediante el flujo de inicio de sesión existente.

### Dependencias operativas

- El envío de la notificación requiere `APP_SEND_NOTIFICATIONS=true`.
- Si el driver de cola es asíncrono, requiere un worker de cola en ejecución.
- La aplicación no puede confirmar la entrega del correo.

## Mensajes de la interfaz

| Caso | Texto |
|---|---|
| Correo obligatorio | “Este campo es obligatorio.” |
| Correo inválido | “Ingresá un correo válido.” |
| Solicitud exitosa | “Se ha enviado un código de recuperación a tu correo.” |
| Correo no registrado | “El correo electrónico no está registrado.” |
| Código incompleto | “Ingresá el código de 5 dígitos.” |
| Código inválido, vencido o usado | “Código de recuperación inválido.” |
| Contraseña obligatoria | “Este campo es obligatorio.” |
| Política de contraseña | “La contraseña debe tener entre 8 y 16 caracteres, una mayúscula, una minúscula y un número o carácter especial.” |
| Confirmación obligatoria | “Este campo es obligatorio.” |
| Confirmación distinta | “Las contraseñas no coinciden.” |
| Sin solicitud activa | “No hay una solicitud de recuperación activa. Volvé a solicitar un código.” |
| Solicitud vencida | “La solicitud venció. Volvé a solicitar un código.” |
| Error de red | “No se pudo conectar con el servicio. Intentá nuevamente.” |
| Timeout | “La solicitud tardó demasiado. Intentá nuevamente.” |
| Error general | “No se pudo completar la operación. Intentá nuevamente.” |
| Timeout del cambio | “No pudimos confirmar el cambio. Probá iniciar sesión con la nueva contraseña o solicitá un código nuevo.” |
| Cambio exitoso | “Contraseña restablecida correctamente.” |
| Acción de éxito | “Ir a iniciar sesión” |
| Volver a solicitar | “Volver a solicitar” |
| Acción de solicitud | “Solicitar código” |
| Acción de cambio | “Cambiar contraseña” |

## Requisitos funcionales

- RF-1. CUANDO una persona accede a la pantalla de solicitud, EL SISTEMA muestra un campo de correo electrónico y la acción “Solicitar código”.
- RF-2. CUANDO la persona envía el correo, EL SISTEMA recorta los espacios al inicio y al final antes de validarlo y enviarlo.
- RF-3. SI el correo está vacío o no tiene un formato válido, ENTONCES EL SISTEMA muestra el mensaje correspondiente junto al campo y no solicita el código.
- RF-4. CUANDO el correo es válido, EL SISTEMA solicita el código y muestra un indicador de progreso; mientras la solicitud está en curso, bloquea el botón y evita envíos duplicados.
- RF-5. CUANDO el servicio responde `200`, EL SISTEMA muestra “Se ha enviado un código de recuperación a tu correo.” y pasa a la pantalla de cambio.
- RF-6. SI el servicio responde `422` con `errors.email` igual a “El correo electrónico no está registrado.”, ENTONCES EL SISTEMA muestra ese mensaje junto al campo y permanece en la pantalla de solicitud.
- RF-7. SI el servicio responde `404`, ENTONCES EL SISTEMA muestra “El correo electrónico no está registrado.” junto al campo y permanece en la pantalla de solicitud.
- RF-8. SI la solicitud falla por red, timeout, `429`, `5xx`, respuesta inválida o `2xx` con errores, ENTONCES EL SISTEMA muestra el aviso general correspondiente, conserva el correo y permite reintentar.
- RF-9. CUANDO la persona llega a la pantalla de cambio con una solicitud activa, EL SISTEMA muestra el correo de destino enmascarado y no le pide volver a ingresarlo.
- RF-10. SI la persona accede a la pantalla de cambio sin una solicitud activa, ENTONCES EL SISTEMA muestra “No hay una solicitud de recuperación activa. Volvé a solicitar un código.” y ofrece la acción para volver a la solicitud.
- RF-11. SI la solicitud activa tiene más de 15 minutos, ENTONCES EL SISTEMA muestra “La solicitud venció. Volvé a solicitar un código.” y ofrece la acción para volver a la solicitud.
- RF-12. EL SISTEMA conserva el correo de la última solicitud exitosa durante 15 minutos, incluso si la persona recarga la pantalla de cambio; una nueva solicitud exitosa reemplaza la anterior.
- RF-13. La pantalla de cambio muestra cinco casillas separadas para el código, un campo de nueva contraseña, un campo de confirmación y la acción “Cambiar contraseña”.
- RF-14. La nueva contraseña y su confirmación se muestran ocultas por defecto y cada una tiene su propio control de visibilidad.
- RF-15. CUANDO la persona ingresa el código, EL SISTEMA acepta solo dígitos, conserva los ceros iniciales, avanza automáticamente al completar una casilla, permite retroceder y permite moverse con las flechas.
- RF-16. CUANDO la persona pega un código, EL SISTEMA descarta los caracteres que no sean dígitos, conserva los primeros cinco y los distribuye desde la primera casilla; si hay menos de cinco, completa desde la primera y deja el foco en la siguiente vacía.
- RF-17. SI el código está incompleto, ENTONCES EL SISTEMA muestra “Ingresá el código de 5 dígitos.” junto al código y no solicita el cambio.
- RF-18. SI la nueva contraseña no cumple la política de 8 a 16 caracteres con al menos una mayúscula, una minúscula y un número o carácter especial, ENTONCES EL SISTEMA muestra el mensaje de política junto al campo y no solicita el cambio.
- RF-19. SI la confirmación no coincide con la nueva contraseña, ENTONCES EL SISTEMA muestra “Las contraseñas no coinciden.” junto a la confirmación y no solicita el cambio.
- RF-20. CUANDO el código está completo y los campos son válidos, EL SISTEMA solicita el cambio solo cuando la persona activa “Cambiar contraseña”; no se envía automáticamente al completar el código. Mientras la solicitud está en curso, muestra un indicador de progreso y evita envíos duplicados.
- RF-21. CUANDO el servicio responde `200`, EL SISTEMA muestra “Contraseña restablecida correctamente.” y la acción “Ir a iniciar sesión”; no inicia sesión automáticamente. La contraseña vigente pasa a ser la nueva y, si es distinta de la anterior, la anterior deja de ser válida.
- RF-22. SI el servicio responde `422` con “Código de recuperación inválido.”, ENTONCES EL SISTEMA muestra ese mensaje junto al código, limpia las casillas, devuelve el foco a la primera y conserva el correo, la nueva contraseña y su confirmación.
- RF-23. SI el servicio responde `422` con errores por campo, ENTONCES EL SISTEMA muestra cada error junto al campo correspondiente y conserva los valores. Los errores desconocidos o generales se muestran en el aviso general.
- RF-24. SI el servicio responde `422` con `errors.email` igual a “El correo electrónico no está registrado.”, ENTONCES EL SISTEMA muestra ese mensaje y ofrece volver a la solicitud.
- RF-25. SI el servicio responde `404`, ENTONCES EL SISTEMA muestra “El correo electrónico no está registrado.” y ofrece volver a la solicitud.
- RF-26. SI el cambio falla por red, `429`, `5xx`, respuesta inválida o `2xx` con errores, ENTONCES EL SISTEMA muestra el aviso general correspondiente, conserva los valores y permite reintentar.
- RF-27. SI el cambio termina con timeout, ENTONCES EL SISTEMA muestra “No pudimos confirmar el cambio. Probá iniciar sesión con la nueva contraseña o solicitá un código nuevo.”, no reintenta automáticamente y ofrece las dos alternativas.
- RF-28. CUANDO la persona elige “Volver a solicitar”, EL SISTEMA vuelve a la pantalla de solicitud con el correo precargado, sin enviar el código automáticamente, y limpia el código, la contraseña, la confirmación y los errores.
- RF-29. EL SISTEMA no muestra cuenta atrás ni contador de solicitudes.
- RF-30. CUANDO la persona activa “Recuperar contraseña” en la pantalla de inicio de sesión, EL SISTEMA la lleva a la pantalla de solicitud.
- RF-31. CUANDO el cambio se completa, el código utilizado deja de ser válido y no puede reutilizarse.
- RF-32. EL SISTEMA no inicia sesión ni conserva una sesión autenticada como consecuencia de la recuperación.
- RF-33. EL SISTEMA no impide que la nueva contraseña coincida con la contraseña anterior.
- RF-34. CUANDO la persona edita un campo después de un error, EL SISTEMA limpia el error de ese campo.

## Requisitos no funcionales

- RNF-1. Accesibilidad: todos los campos tienen etiqueta; los errores se asocian al campo; el foco es visible; las cinco casillas se operan con teclado; los mensajes de estado se anuncian con `aria-live`; los controles táctiles miden al menos 44 × 44 px; el contraste cumple AA (4.5:1 para texto y 3:1 para componentes y foco).
- RNF-2. Adaptación visual: las pantallas se usan sin desbordamiento horizontal de 320 a 1920 px.
- RNF-3. Privacidad: la nueva contraseña y el código no aparecen en la URL, el historial, la consola, los registros, la analítica ni los mensajes de error; el correo se muestra enmascarado y no se comparte entre usuarios.
- RNF-4. Resiliencia: la solicitud y el cambio toleran errores de red, timeout de 10 segundos, `429`, `5xx`, cuerpos inválidos y `2xx` con errores, sin perder los valores necesarios para reintentar. El timeout del cambio usa el mensaje específico de RF-27.
- RNF-5. Consistencia: los textos visibles están en español; se usa “correo electrónico” en esta funcionalidad; la política de contraseña coincide con la del registro.
- RNF-6. Sin dependencias nuevas: la funcionalidad se resuelve con las capacidades existentes de la aplicación.
- RNF-7. Las pantallas de recuperación son públicas, no requieren sesión y no crean ni destruyen una sesión.
- RNF-8. Cada pantalla tiene título, descripción y metadatos Open Graph propios.
- RNF-9. El sistema evita solicitudes duplicadas mientras una operación está en curso.
- RNF-10. Cada pantalla tiene un estado de carga y un límite de error a nivel de ruta.
- RNF-11. Los datos de recuperación no se sirven desde caché compartida ni exponen información sensible.
- RNF-12. La interfaz consume `message` y `errors` de la respuesta estándar; no depende de `data`.

## Casos límite

- Correo con espacios al inicio o al final: se recorta y se valida el valor recortado.
- Correo con formato inválido: se muestra el error y no se llama al servicio.
- Correo no registrado: se muestra “El correo electrónico no está registrado.” y no se avanza.
- Respuesta `404` en la solicitud o en el cambio: se trata como correo no registrado.
- El servicio confirma la solicitud pero el correo no llega: la persona puede volver a solicitar el código.
- Código vacío o incompleto: se muestra “Ingresá el código de 5 dígitos.” y no se solicita el cambio.
- Código con espacios, guiones o letras: al pegarlo se descartan los caracteres que no sean dígitos y se conservan los primeros cinco.
- Código con ceros iniciales, por ejemplo `00123`: se conserva completo.
- Pegado en una casilla que no es la primera: se completa desde la primera casilla.
- Código inválido, vencido o ya utilizado: se muestra “Código de recuperación inválido.”, se limpian las casillas y se devuelve el foco a la primera.
- Contraseña de menos de 8 o de más de 16 caracteres: se muestra el error y no se solicita el cambio.
- Contraseña sin mayúscula, sin minúscula o sin número o carácter especial: se muestra el error y no se solicita el cambio.
- Contraseña con emoji: se rechaza en la interfaz.
- Confirmación vacía o distinta: se muestra el error y no se solicita el cambio.
- Nueva contraseña igual a la anterior: se permite y el cambio puede completarse.
- Error de red, timeout, `429`, `5xx`, cuerpo inválido o `2xx` con errores: se muestra el aviso correspondiente y se conservan los valores.
- Timeout del cambio: se muestra el mensaje específico y no se reintenta automáticamente.
- Doble activación de la acción: se genera una sola solicitud.
- Acceso directo a la pantalla de cambio sin solicitud activa: se muestra el aviso y se ofrece volver a la solicitud.
- Solicitud activa con más de 15 minutos: se muestra el aviso de vencimiento y se ofrece volver a solicitar.
- Recarga de la pantalla de cambio: se conserva el correo de la solicitud.
- Cambio exitoso: la contraseña anterior deja de ser válida si la nueva es distinta; la nueva permite iniciar sesión.
- Volver atrás o recargar después del éxito: no se repite el cambio automáticamente.
- Una nueva solicitud exitosa reemplaza la solicitud activa anterior.
- Dos pestañas con solicitudes distintas: cada pestaña conserva su propio estado; la última solicitud exitosa en cada pestaña reemplaza la anterior de esa pestaña.
- Cuenta con correo no verificado: el cambio puede completarse, pero el inicio de sesión puede fallar hasta que el correo se verifique.
- Cuenta eliminada: si el servicio responde `404`, se muestra el mensaje de correo no registrado.

## Limitaciones conocidas y riesgos aceptados

- **Política de contraseña:** la interfaz exige 8–16 caracteres con complejidad, pero el servicio solo valida un mínimo de 8. Un cliente que omita la interfaz podría establecer una contraseña más débil.
- **Correo no verificado:** el servicio permite recuperar una cuenta no verificada, pero el login exige el correo verificado. La recuperación no verifica el correo.
- **Cuentas eliminadas:** el servicio puede responder `404`; la interfaz lo trata como correo no registrado. Si el `404` proviniera de otra causa, el mensaje podría ser impreciso.
- **Sin límite de solicitudes:** el servicio no aplica límite en `forgot-password` en esta versión.
- **Sin límite de intentos:** el servicio no limita los intentos de código; un código de cinco dígitos es vulnerable a fuerza bruta.
- **Códigos anteriores:** una nueva solicitud no invalida los códigos anteriores en el servicio. La interfaz conserva solo la última solicitud; un código anterior podría seguir siendo aceptado.
- **Código vencido y usado:** el servicio devuelve el mismo mensaje para ambos casos; la interfaz no puede distinguirlos.
- **Sesiones existentes:** la recuperación no revoca tokens ya emitidos. La aplicación web no persiste JWT en esta versión.
- **Entrega del correo:** depende de `APP_SEND_NOTIFICATIONS` y del worker de cola; la aplicación no puede confirmar la entrega.
- **Mayúsculas en el correo:** la interfaz recorta espacios exteriores, pero no normaliza mayúsculas; la comparación depende del servicio.
- **Código no numérico:** el servicio valida longitud de 5 caracteres, no que sean dígitos; la interfaz solo permite dígitos.
- **Enumeración de correos:** el mensaje explícito de correo no registrado permite saber si una cuenta existe. Es un riesgo aceptado.

## Fuera de alcance

- Cambios en el backend, en el contrato o en la configuración del servicio.
- Límites de solicitudes, límites de intentos, bloqueos, CAPTCHA o protección antiabuso.
- Invalidación de códigos anteriores, uso atómico del código o prevención de carreras entre pestañas.
- Verificación de correo electrónico.
- Persistencia de sesión, emisión de tokens o revocación de tokens existentes.
- Infraestructura de envío de correo, notificaciones y colas.
- Historial de contraseñas o impedimento de reutilizar contraseñas anteriores.
- Inicio de sesión automático después de restablecer la contraseña.
- Recuperación por SMS u otro canal.
- Dashboard.
- Cambio de correo electrónico o de datos personales.
- Reenvío formal con cuenta atrás y límite de solicitudes en la interfaz.
- Analítica o métricas del embudo de recuperación.

## Criterios de finalización

- Desde la pantalla de inicio de sesión, “Recuperar contraseña” lleva a la pantalla de solicitud; la spec 006 queda actualizada para dejar de apuntar a `/home`.
- La pantalla de solicitud valida el correo, solicita el código y muestra el mensaje de confirmación.
- Un correo no registrado, o una respuesta `404`, muestra “El correo electrónico no está registrado.” y no avanza.
- La pantalla de cambio muestra el correo enmascarado, cinco casillas de código y los campos de nueva contraseña y confirmación.
- El código acepta solo dígitos, conserva ceros iniciales, avanza, retrocede y permite pegar.
- La nueva contraseña cumple la política del registro y la confirmación debe coincidir.
- Un código inválido o vencido muestra “Código de recuperación inválido.”, limpia las casillas y permite reintentar.
- La persona puede volver a solicitar el código sin contar con un reenvío formal.
- Un cambio exitoso muestra “Contraseña restablecida correctamente.” y permite continuar al inicio de sesión.
- La contraseña anterior deja de funcionar si la nueva es distinta; la nueva permite iniciar sesión.
- Un timeout del cambio muestra el mensaje específico y no reintenta automáticamente.
- Los errores de red, timeout, `429`, `5xx`, cuerpos inválidos y `2xx` con errores no pierden los valores necesarios para reintentar.
- La funcionalidad es accesible, responsive, no expone contraseñas ni códigos y no incorpora dependencias nuevas.
- Las pruebas unitarias, de integración y el flujo completo quedan en verde; `pnpm lint` y `pnpm build` pasan sin errores.
- No se modifica el backend.

## Dudas abiertas

- Ninguna que bloquee la implementación web. Las limitaciones del backend y los riesgos aceptados quedan registrados en “Limitaciones conocidas y riesgos aceptados”.
