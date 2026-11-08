# Spec 006 — Inicio de sesión

Estado: implementada (validada el 2026-10-23 con el servicio simulado; contrato real de login pendiente)

## Contexto y objetivo

La aplicación ya permite registrarse y verificar el correo electrónico. Hasta ahora, al completar la verificación el sistema llevaba directamente al inicio, sin pedir credenciales. Con el inicio de sesión, el flujo de acceso se completa: después de verificar el correo, la persona debe autenticarse con su email y contraseña para entrar.

Objetivo: ofrecer una pantalla de inicio de sesión clara y accesible que permita a las personas registradas y verificadas autenticarse, reconocer y corregir errores de credenciales, y acceder a las demás secciones. También debe ofrecer un camino visible hacia el registro para quienes aún no tienen cuenta y hacia la recuperación de contraseña para quienes la olvidaron.

Cambio de comportamiento respecto de la verificación de email: al completar la verificación con éxito, el sistema debe llevar a `/login` en lugar de `/home`.

Actualización 2026-10-27 (spec 007): el enlace "Recuperar contraseña" ahora lleva a `/password-recovery`.

## Usuarios

- Personas registradas cuyo correo electrónico ya fue verificado y que desean ingresar.
- Personas registradas que olvidaron su contraseña.
- Personas que todavía no tienen cuenta y llegan a la pantalla de inicio de sesión.

## Historias de usuario

- HU-1. Como persona registrada y verificada, quiero iniciar sesión con mi email y contraseña para acceder a la aplicación sin volver a registrarme.
- HU-2. Como persona que inicia sesión, quiero poder mostrar mi contraseña en texto plano para comprobar que la escribí correctamente.
- HU-3. Como persona que acaba de verificar su correo, quiero ser llevada al inicio de sesión para ingresar con mis credenciales.
- HU-4. Como persona que no tiene cuenta, quiero llegar al registro desde la pantalla de inicio de sesión para poder crearla.
- HU-5. Como persona que olvidó su contraseña, quiero encontrar un acceso visible a la recuperación de contraseña para saber cómo proceder cuando esté disponible.

## Definiciones

- **Persona verificada**: quien completó con éxito la verificación del correo electrónico asociado a su registro.
- **Credenciales**: combinación de email y contraseña.
- **Mostrar contraseña**: alternar la visibilidad del valor ingresado en el campo de contraseña entre oculto y texto plano.
- **Mensaje diferenciado**: aviso que distingue entre un email no registrado y una contraseña incorrecta.

## Contrato del servicio de autenticación

- Operación: inicio de sesión.
- Método y ruta: `POST /api/auth/login`.
- Autenticación previa requerida: no.
- Cuerpo de la solicitud: `{ "email": "...", "password": "..." }`.
- El email y la contraseña enviados son los valores ingresados por la persona, con el email recortado según RF-19.
- Respuesta exitosa: `{ "data": { "token": "...", "user": { "id", "name", "lastname", "email", "role" } }, "message": "Inicio de sesión exitoso." }`.
- El token contiene al menos `sub`, `email`, `role`, `iat` y `exp`; su vigencia actual es de 24 horas.
- Los errores de credenciales y de comunicación conservan la clasificación implementada (email no registrado, contraseña incorrecta y fallo general).
- La validación del token, la creación de la sesión y la redirección a `/dashboard` se definen en `specs/008-session-dashboard/spec.md`.

## Requisitos funcionales

- RF-1. CUANDO una persona accede a la ruta `/login`, EL SISTEMA muestra una pantalla con un campo de email y un campo de contraseña.
- RF-2. EL SISTEMA permite acceder a `/login` sin una sesión iniciada.
- RF-3. EL SISTEMA muestra el valor del campo de contraseña oculto por defecto.
- RF-4. CUANDO la persona activa el control de visibilidad de la contraseña, EL SISTEMA muestra el valor en texto plano; CUANDO lo desactiva, EL SISTEMA vuelve a ocultarlo.
- RF-5. EL SISTEMA mantiene disponible el control de visibilidad mientras la pantalla de inicio de sesión esté abierta, con un nombre accesible y su estado actual.
- RF-6. EL SISTEMA ubica debajo de los campos dos botones: "Iniciar sesión" a la izquierda, con el color azul institucional, y "Registrarse" a la derecha, en color blanco.
- RF-7. CUANDO la persona activa el botón "Registrarse", EL SISTEMA redirige a la ruta `/register`.
- RF-8. EL SISTEMA muestra debajo de los dos botones un texto con el enlace "Recuperar contraseña".
- RF-9. CUANDO la persona activa el enlace "Recuperar contraseña", EL SISTEMA redirige a `/password-recovery`.
- RF-10. CUANDO la persona envía el formulario, EL SISTEMA valida que el email y la contraseña estén completos y que el email tenga un formato válido antes de solicitar la autenticación.
- RF-11. SI el email o la contraseña están vacíos, o el email no tiene un formato válido, ENTONCES EL SISTEMA muestra el mensaje de error correspondiente junto al campo afectado y no solicita la autenticación.
- RF-12. CUANDO la persona envía credenciales que cumplen la validación de formato, EL SISTEMA solicita la autenticación mediante `POST /api/auth/login` con el email y la contraseña ingresados, y muestra un indicador de progreso mientras la solicitud está en curso.
- RF-13. MIENTRAS la solicitud de autenticación está en curso, EL SISTEMA impide envíos adicionales y bloquea el botón "Iniciar sesión".
- RF-14. CUANDO la autenticación es exitosa, EL SISTEMA crea una sesión autenticada y redirige a `/dashboard`.

> Cambio 2026-10-27 (spec 008): el destino del login pasó de `/home` a `/dashboard` y ahora se crea una sesión autenticada. La persistencia de la sesión, el acceso privado y el cierre de sesión se definen en `specs/008-session-dashboard/spec.md`.
- RF-15. SI el email ingresado no corresponde a una cuenta registrada, ENTONCES EL SISTEMA muestra el mensaje "El email no está registrado".
- RF-16. SI la contraseña ingresada es incorrecta para un email registrado, ENTONCES EL SISTEMA muestra el mensaje "La contraseña es incorrecta".
- RF-17. SI el servicio de autenticación no está disponible, no responde en 10 segundos o se produce un error de conexión, ENTONCES EL SISTEMA muestra un mensaje de error general, conserva los valores ingresados y permite reintentar.
- RF-18. CUANDO la verificación del correo electrónico finaliza con éxito, EL SISTEMA redirige a `/login`.
- RF-19. EL SISTEMA recorta los espacios al inicio y al final del email antes de validarlo y enviarlo, y conserva la contraseña tal como fue ingresada.

## Requisitos no funcionales

- RNF-1. Accesibilidad: cada campo tiene una etiqueta asociada; el control de visibilidad tiene nombre accesible y comunica su estado; los mensajes de error se anuncian a lectores de pantalla; el foco visible se conserva en todos los controles.
- RNF-2. Teclado: la pantalla se recorre y opera por completo con teclado, con un orden de foco lógico; Enter envía el formulario cuando el foco está en un campo.
- RNF-3. Contraste: el texto y los componentes cumplen WCAG 2.1 AA (4.5:1 para texto normal y 3:1 para componentes y foco).
- RNF-4. Responsive: no hay desbordamiento horizontal desde 320 px de ancho; en pantallas menores a 768 px los botones se apilan y desde 768 px se muestran en fila con "Iniciar sesión" a la izquierda y "Registrarse" a la derecha.
- RNF-5. Consistencia visual: la pantalla conserva la paleta institucional, la tipografía, la tarjeta centrada y la barra de navegación de las demás vistas.
- RNF-6. Idioma: todos los textos visibles están en español.
- RNF-7. Privacidad: la contraseña permanece oculta por defecto, solo se muestra en texto plano cuando la persona activa el control de visibilidad y nunca aparece en los mensajes de error.
- RNF-8. Identificación de página: la pantalla tiene un título y una descripción propios.
- RNF-9. Dependencias: la funcionalidad se implementa sin incorporar dependencias externas nuevas.

## Casos límite

- CL-1. Ambos campos vacíos: se muestran ambos errores y no se envía.
- CL-2. Email con formato inválido: se muestra el error y no se envía.
- CL-3. Email con espacios al inicio o al final: se recortan; si queda vacío, se trata como campo vacío.
- CL-4. Contraseña con espacios: se conserva sin recortar y cuenta como completa si tiene al menos un carácter.
- CL-5. Email no registrado: mensaje "El email no está registrado".
- CL-6. Email registrado con contraseña incorrecta: mensaje "La contraseña es incorrecta".
- CL-7. Servicio no disponible, timeout de 10 segundos o error de conexión: mensaje general, valores conservados y reintento posible.
- CL-8. Doble clic o Enter repetido: una sola solicitud.
- CL-9. Verificación del correo exitosa: redirección a `/login`.
- CL-10. Enlace "Recuperar contraseña" activado: redirección a `/password-recovery` sin alterar el estado del formulario.

## Fuera de alcance

- Implementar la recuperación de contraseña, que corresponde a la spec 007; esta spec solo enlaza a `/password-recovery`.
- Crear cuentas, modificar el registro o el mecanismo de verificación, salvo la redirección final de la verificación a `/login`.
- Definir la sesión autenticada, su persistencia, el acceso privado y el cierre de sesión, que corresponden a la spec 008.
- Redirigir a una persona ya autenticada que accede a `/login`, comportamiento definido en la spec 008.
- Recuperar o cambiar contraseñas.
- Roles o permisos diferenciados.

## Criterios de finalización

- [x] Desde `/login` se inicia sesión con un email registrado y verificado y una contraseña correcta, se crea la sesión y se llega a `/dashboard`.
- [x] La contraseña se muestra oculta por defecto y puede alternarse a texto plano y viceversa.
- [x] Los botones "Iniciar sesión" (azul, izquierda) y "Registrarse" (blanco, derecha) aparecen debajo de los campos; "Registrarse" lleva a `/register`.
- [x] Debajo de los botones aparece el enlace "Recuperar contraseña", que redirige a `/password-recovery`.
- [x] Los errores de campos vacíos o email inválido se muestran sin enviar la solicitud.
- [x] Un email no registrado y una contraseña incorrecta producen mensajes diferenciados.
- [x] Un fallo del servicio o un timeout de 10 segundos muestra un mensaje general, conserva los valores y permite reintentar.
- [x] El envío repetido genera una sola solicitud y muestra un indicador de progreso.
- [x] Al verificar el correo con éxito, la persona llega a `/login`.
- [x] La pantalla funciona con teclado, tiene etiquetas y nombres accesibles, foco visible y contraste AA.
- [x] No hay desbordamiento horizontal desde 320 px y los botones se apilan o alinean según el ancho de 768 px.
- [x] No se agregaron dependencias externas.

> Validación de cierre (2026-10-23): implementación y E2E con servicio simulado; `pnpm exec tsc --noEmit`, `pnpm lint`, la suite **82/82** y `pnpm build` en verde. El contrato real de `POST /api/auth/login` y las dudas abiertas quedan para la validación con el backend y el producto.

## Dudas abiertas

- [NECESITA ACLARACIÓN] ¿Qué debe ocurrir si una persona ya autenticada accede a `/login`? Resuelto por la spec 008 (RF-4): se redirige a `/dashboard`.
- [NECESITA ACLARACIÓN] ¿La sesión iniciada debe persistir entre recargas y cierres del navegador? Resuelto por la spec 008 (RF-7, RF-8): persiste hasta el vencimiento del token, sin renovación.
- [NECESITA ACLARACIÓN] ¿Qué debe ocurrir si la persona intenta iniciar sesión con un email registrado pero cuyo correo aún no fue verificado?
- [NECESITA ACLARACIÓN] ¿Los textos exactos de los mensajes diferenciados los define la interfaz o el servicio de autenticación?
- [NECESITA ACLARACIÓN] ¿Se debe permitir pegar la contraseña y el autocompletado del navegador, a diferencia de la pantalla de registro?
- [NECESITA ACLARACIÓN] ¿El cambio de redirección tras verificar el correo reemplaza por completo el comportamiento anterior de la verificación de email?
- [NECESITA ACLARACIÓN] ¿Qué estructura y códigos de respuesta devuelve `POST /api/auth/login` para el éxito, el email no registrado y la contraseña incorrecta? Resuelto parcialmente: la estructura de éxito quedó documentada; los códigos de error conservan la clasificación implementada y quedan pendientes de validación final con backend.
