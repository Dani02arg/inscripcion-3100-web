# Spec 005 — Verificación de Correo Electrónico

**Estado:** implementada (validada el 2026-10-23 con el servicio simulado)
**Cambio 2026-10-23:** la spec 006 (RF-18) actualiza el destino de éxito de la verificación de `/home` a `/login`; la implementación se ajusta en T8 de la spec 006.

## Contexto y objetivo

El alta de una cuenta queda incompleta hasta que la persona confirma el correo con el
que se registró. Cuando el servicio de registro acepta el alta, devuelve el
identificador y el correo de la cuenta creada, y envía un código de 5 dígitos a ese
correo. Hoy la aplicación termina el registro en una ruta que no existe (error 404), no
conserva nada de la respuesta y no ofrece ningún lugar donde ingresar el código: la
cuenta queda creada pero inutilizable y la persona no tiene forma de completar el
trámite.

El objetivo es que la persona confirme su correo con el código recibido, sin volver a
escribir el correo ni el identificador, y que el sistema recuerde ese contexto
únicamente mientras la verificación esté pendiente.

## Usuarios

- **Persona recién registrada:** ya completó el formulario y espera el código en su correo.
- **Persona con baja familiaridad digital:** necesita pocos pasos, mensajes claros y no repetir datos.
- **Persona que no recibió el código:** necesita pedirlo de nuevo sin volver a registrarse.
- **Responsable del sitio:** necesita que las cuentas queden verificadas antes de usarse.

## Historias de usuario

- HU-1. Como persona recién registrada, quiero ingresar el código que recibí para activar mi cuenta.
- HU-2. Como persona recién registrada, quiero que la vista ya sepa a qué correo se envió el código para no volver a escribirlo.
- HU-3. Como persona que no recibió el código, quiero pedir uno nuevo para no tener que registrarme otra vez.
- HU-4. Como persona que abre la verificación sin un registro pendiente, quiero entender qué pasó y poder ir al registro.

## Definiciones

- **Registro pendiente:** alta aceptada por el servicio de registro que todavía no fue
  verificada. Se identifica con el identificador y el correo que devuelve el registro.
- **Código:** secuencia de 5 dígitos enviada al correo del registro pendiente.
- **Servicio de verificación:** operación `POST /api/auth/verify-email`, que recibe el
  identificador del usuario y el código.
- **Servicio de reenvío:** operación `POST /api/auth/resend-code`, que recibe el correo y
  el tipo `REGISTER`.

## Requisitos funcionales

- RF-1: CUANDO el servicio de registro acepta el alta, EL SISTEMA debe conservar el
  identificador y el correo devueltos y llevar a la persona a `/verify-email`.
- RF-2: SI el registro no es aceptado, ENTONCES EL SISTEMA debe descartar cualquier
  registro pendiente, incluido uno anterior.
- RF-3: CUANDO la persona abre `/verify-email` con un registro pendiente, EL SISTEMA
  debe mostrar el correo al que se envió el código en forma enmascarada y cinco casillas
  para el código, sin pedir el correo ni el identificador.
- RF-4: CUANDO la persona abre `/verify-email` sin un registro pendiente, EL SISTEMA
  debe explicar que no hay una verificación pendiente y ofrecer un acceso al registro.
- RF-5: EL SISTEMA debe aceptar un dígito por casilla, avanzar el foco al completar cada
  uno, permitir borrar hacia atrás entre casillas y aceptar el pegado del código: al
  pegar, descarta espacios, guiones y letras, y conserva solo los primeros cinco dígitos.
- RF-6: CUANDO la persona completa los cinco dígitos, EL SISTEMA debe habilitar el botón
  de verificación y no debe iniciar la verificación hasta que la persona active el botón
  o presione Enter.
- RF-7: MIENTRAS la verificación está en curso, EL SISTEMA debe mostrar un indicador de
  carga dentro del botón, deshabilitarlo y bloquear la edición de las casillas y el
  reenvío, sin aceptar envíos repetidos.
- RF-8: EL SISTEMA debe enviar al servicio de verificación el identificador conservado y
  el código completo.
- RF-9: CUANDO el servicio confirma la verificación, EL SISTEMA debe descartar el
  registro pendiente, mostrar el botón en verde con el ícono de confirmación y sin texto
  y, tras 1,5 segundos, llevar automáticamente a `/login`.
- **Cambio 2026-10-23 (spec 006, RF-18):** el destino anterior `/home` se reemplaza por
  `/login`.
- RF-10: SI el servicio rechaza el código, ENTONCES EL SISTEMA debe mostrar el mensaje
  recibido junto al código, conservar el registro pendiente, vaciar las casillas,
  devolver el foco a la primera y restablecer el botón a su estado normal.
- RF-11: SI el código está incompleto o contiene caracteres que no son dígitos, ENTONCES
  EL SISTEMA debe mantener el botón deshabilitado y señalar el campo.
- RF-12: SI la verificación no puede completarse por un problema de conexión o por una
  demora mayor a la admitida, ENTONCES EL SISTEMA debe mostrar un aviso general,
  conservar el código, restablecer el botón y permitir reintentar.
- RF-13: SI el servicio responde con un contenido inesperado, ENTONCES EL SISTEMA debe
  mostrar un aviso general sin descartar el registro pendiente.
- RF-14: CUANDO la persona solicita reenviar el código, EL SISTEMA debe pedir el reenvío
  para el correo conservado con el tipo de registro.
- RF-15: MIENTRAS el reenvío está en curso, EL SISTEMA debe indicarlo y no debe aceptar
  reenvíos repetidos.
- RF-16: CUANDO el reenvío es aceptado, EL SISTEMA debe informar que el código fue
  reenviado y debe impedir otro reenvío durante una espera de 45 segundos, que se
  mantiene aunque la persona recargue la página.
- RF-17: SI el reenvío falla, ENTONCES EL SISTEMA debe mostrar un aviso general y
  permitir reintentar cuando termine la espera.
- RF-18: CUANDO la persona cierra y vuelve a abrir el navegador con un registro
  pendiente, EL SISTEMA debe conservar el identificador y el correo y mostrar la misma
  verificación.
- RF-19: CUANDO la persona completa un registro nuevo, EL SISTEMA debe reemplazar el
  registro pendiente anterior por el más reciente.
- RF-20: CUANDO la verificación se completa, EL SISTEMA debe descartar el registro
  pendiente de modo que un acceso posterior a `/verify-email` sin pendiente siga el
  comportamiento de RF-4.
- RF-21: EL SISTEMA no debe exponer el identificador, el correo ni el código en la
  dirección de la página, en el historial del navegador ni en la consola del navegador.
- RF-22: SI el registro es aceptado pero la respuesta no trae un identificador y un
  correo utilizables, ENTONCES EL SISTEMA debe mostrar un aviso general y no debe
  conservar un registro pendiente incompleto.
- RF-23: EL SISTEMA debe ubicar el botón de verificación centrado debajo de las cinco
  casillas y, debajo del botón, la opción de reenviar el código con el aviso de intentos
  disponibles.
- RF-24: SI el servicio informa que el código venció, ENTONCES EL SISTEMA debe mostrar un
  aviso de vencimiento, vaciar las casillas y ofrecer reenviar uno nuevo.
- RF-25: CUANDO la persona ve la opción de reenviar, EL SISTEMA debe informar cuántos
  reenvíos le quedan en el día, sobre un máximo de 5.
- RF-26: EL SISTEMA debe tratar `/verify-email` como ruta pública, mostrar el formulario
  solo a quien tenga un registro pendiente y no habilitar la verificación a quien nunca se
  registró; las personas autenticadas no deben acceder cuando exista sesión.

## Requisitos no funcionales

- RNF-1: Las cinco casillas y el botón deben ser operables con teclado, anunciar la
  posición (por ejemplo, “dígito 2 de 5”), asociar el error al campo, gestionar el foco
  en el rechazo y dar un nombre accesible al botón cuando muestra solo el ícono, sin
  impedir corregir el código.
- RNF-2: El botón debe generar una sola solicitud por activación, incluso con doble clic
  o con Enter repetido.
- RNF-3: El estado de verificación debe aparecer de inmediato y la espera máxima de
  respuesta debe ser de 10 segundos, igual que en el registro.
- RNF-4: El correo mostrado no debe revelar la dirección completa.
- RNF-5: La vista debe respetar la identidad visual y el comportamiento responsive del
  registro, de 320 px a 1920 px, sin desplazamiento horizontal.
- RNF-6: La vista debe tener título y descripción propios para buscadores y para la
  pestaña del navegador.
- RNF-7: No se deben agregar dependencias externas.
- RNF-8: El estado de éxito no debe comunicarse solo por color: debe incluir el ícono de
  confirmación con nombre accesible, y el verde debe mantener el contraste legible.

## Casos límite

- EC-1: El código vence antes de que la persona lo ingrese: el servicio informa el
  vencimiento y el sistema muestra el aviso y ofrece reenviar uno nuevo.
- EC-2: El código ya fue utilizado en un intento anterior exitoso.
- EC-3: El identificador no existe o la cuenta ya estaba verificada.
- EC-4: Se pega el código con espacios, guiones o letras, o con menos o más de cinco
  dígitos: el sistema descarta lo que no sea dígito y conserva los primeros cinco.
- EC-5: La persona intenta reenviar mientras la verificación está en curso.
- EC-6: Dos pestañas con el mismo registro pendiente; una verifica primero y la otra
  envía el código después.
- EC-7: Se completa un registro nuevo mientras hay otro pendiente.
- EC-8: La persona abre la vista desde otro dispositivo o navegador, sin registro
  pendiente.
- EC-9: El correo devuelto por el registro trae mayúsculas o espacios.
- EC-10: El servicio de verificación tarda más de 10 segundos.
- EC-11: El servicio responde con éxito de transporte pero informa errores.
- EC-12: La persona recarga la vista con la verificación en curso.
- EC-13: La persona activa el botón dos veces mientras la primera solicitud sigue en curso.

## Fuera de alcance

- Iniciar sesión o emitir una sesión o token después de verificar.
- Implementar el inicio de sesión posterior a la verificación; la pantalla `/login` y la
  autenticación pertenecen a la spec 006.
- Implementar la recuperación de contraseña.
- Cambiar el correo de un registro pendiente escrito con error; no hay servicio para eso.
- Reenviar códigos para tipos distintos de `REGISTER`.
- Definir el límite de intentos de ingreso, el bloqueo o la vigencia del código; los
  administra el servicio (el máximo de 5 reenvíos diarios solo se informa, según RF-25).
- Mostrar un aviso de cuenta verificada en la pantalla posterior a la verificación.
- Analítica o métricas del embudo de registro.

## Criterios de finalización

- Un registro aceptado lleva a `/verify-email`, que muestra el correo enmascarado y las
  cinco casillas sin pedir correo ni identificador.
- El botón permanece deshabilitado hasta completar los cinco dígitos y no se envía solo;
  queda centrado debajo de las casillas y el reenvío debajo del botón.
- Con la verificación en curso, el botón muestra el indicador de carga, no admite un
  segundo envío y bloquea la edición de las casillas y el reenvío.
- Un código correcto muestra el botón en verde con el ícono de confirmación y sin texto y,
  tras 1,5 segundos, lleva a `/login`, descartando el registro pendiente.
- Un código rechazado muestra el mensaje del servicio junto al campo, conserva el
  registro pendiente, vacía las casillas, devuelve el foco a la primera y restablece el
  botón.
- Un código vencido muestra el aviso de vencimiento y ofrece reenviar uno nuevo.
- El pegado descarta espacios, guiones y letras y conserva los primeros cinco dígitos.
- Un acceso sin registro pendiente muestra el aviso y el acceso al registro.
- El reenvío se solicita con el correo conservado, informa el resultado, muestra los
  intentos restantes sobre 5 por día y respeta una espera de 45 segundos que sobrevive a
  la recarga.
- `pnpm lint`, la verificación de tipos y `pnpm build` finalizan sin errores.

## Dudas abiertas

- [NECESITA ACLARACIÓN] Estructura y códigos de la respuesta de `POST /api/auth/verify-email` en éxito y en rechazo.
- [NECESITA ACLARACIÓN] Estructura y códigos de la respuesta de `POST /api/auth/resend-code`.
- [NECESITA ACLARACIÓN] Vigencia del código y cantidad máxima de intentos de ingreso.
- [NECESITA ACLARACIÓN] ¿El registro devuelve siempre `id` y `email`? ¿Pueden venir vacíos o ausentes?
- [NECESITA ACLARACIÓN] ¿Qué responde el servicio si la cuenta ya estaba verificada o el código ya se usó?
- [NECESITA ACLARACIÓN] ¿De dónde proviene la cantidad de reenvíos restantes del día (campo de la respuesta, cálculo local o texto fijo)?
- [NECESITA ACLARACIÓN] ¿Cómo identifica la respuesta que el código venció (clave de error, mensaje o código HTTP)?
- [NECESITA ACLARACIÓN] ¿Cómo se excluye a las personas autenticadas de `/verify-email` mientras no exista una sesión?
