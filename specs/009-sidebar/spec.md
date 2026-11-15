# Spec 009 — Menú lateral reutilizable con navegación por rol

Estado: implementada (2026-10-29); cambios 2026-11-11 por la spec 012 (navegación de alumnos) y 2026-11-14 por la spec 013 (Inscripciones habilitado para roles altos)

## Contexto y objetivo

El área privada ya cuenta con sesión autenticada, dashboard y una barra superior con logotipo, campana y cierre de sesión. La spec 008 dejó el menú lateral fuera de alcance y registró que el cierre de sesión se ubicaba de forma temporal en esa barra.

La aplicación necesita un menú lateral reutilizable que reafirme la identidad institucional, ofrezca a cada rol solo sus opciones, muestre a la persona autenticada y permita navegar y reconocer la sección actual.

El menú habilita las opciones cuyos módulos existen. Las specs 010 y 011 habilitaron Cursos, Gestión de usuarios y Mi perfil; la spec 012 habilita Alumnos; la spec 013 habilita Inscripciones para los roles altos. «Reportes» permanece no disponible con la etiqueta «Próximamente», porque su módulo todavía no existe.

Esta spec reemplaza la barra superior y el cierre de sesión temporal de la spec 008. En escritorio el menú lateral concentra identidad, campana y cuenta; en tablet y móvil una barra compacta conserva hamburguesa, logotipo y campana. La actualización documental de la spec 008 forma parte de esta spec.

Cambio 2026-11-11 (spec 012): se habilita el módulo de alumnos. El `TUTOR` ve «Mis hijos» en lugar de «Mis alumnos»; `ADMINISTRATIVO` y `ADMINISTRADOR` ven «Alumnos» habilitado con destino `/dashboard/students` y coincidencia por prefijo. El `TUTOR` no ve «Alumnos». Las opciones «Inscripciones» y «Reportes» continúan no disponibles. Este cambio no modifica la presentación, el colapso, el drawer ni el pie.

Cambio 2026-11-14 (spec 013): se habilita el módulo de inscripciones para `ADMINISTRATIVO` y `ADMINISTRADOR`, con destino `/dashboard/registrations` y coincidencia por prefijo (incluye el detalle `/dashboard/registrations/{registrationId}`). El `TUTOR` continúa viendo «Inscripciones» como no disponible, porque su circuito queda fuera de alcance. «Reportes» sigue no disponible. Este cambio no modifica la presentación, el colapso, el drawer ni el pie.

Decisiones confirmadas:

- Las opciones sin módulo: visibles, no disponibles y con etiqueta «Próximamente»; no se crean rutas nuevas desde esta spec.
- Los tres roles ven la lista completa de su rol; las opciones habilitadas dependen de los módulos existentes.
- En escritorio el menú reemplaza la barra superior; en tablet y móvil se muestra una barra compacta con hamburguesa, logotipo y campana.
- El pie del menú agrupa iniciales, nombre, correo y un menú de cuenta con «Configuración de cuenta» y «Cerrar sesión».
- En escritorio el menú se colapsa a iconos, con nombre accesible y tooltip, y la preferencia se recuerda.
- La opción activa se determina por módulo; si ninguna coincide, no se resalta ninguna.
- Escritorio desde 1024 px; el nombre institucional se abrevia entre 1024 y 1279 px y se muestra completo desde 1280 px.
- «Gestión de usuarios» y «Reportes» son definitivos en la lista del administrador. «Mi perfil» está habilitado desde la spec 011.
- El logotipo es el mismo de la barra superior; no se incorpora un logotipo nuevo.
- La preferencia de colapso sobrevive al cierre de sesión.
- Las opciones no disponibles reciben foco y se anuncian como no disponibles.
- La activación por módulo se verifica al habilitarse cada módulo en las specs 010, 011, 012 y 013.
- Una URL manual desconocida responde con el 404 de la aplicación.
- El `TUTOR` ve «Mis hijos» en lugar de «Mis alumnos» desde el cambio de la spec 012.
- «Alumnos» queda habilitado para `ADMINISTRATIVO` y `ADMINISTRADOR` con destino `/dashboard/students`; el `TUTOR` no lo ve.
- Además de «Inicio», están habilitados «Alumnos», «Cursos», «Inscripciones» (roles altos), «Gestión de usuarios» y «Mi perfil» según el rol, por las specs 010, 011, 012 y 013; «Inscripciones» sigue no disponible para `TUTOR` y «Reportes» para todos.

## Usuarios

- Personas con rol `TUTOR`.
- Personas con rol `ADMINISTRATIVO`.
- Personas con rol `ADMINISTRADOR`.
- Personas no autenticadas que intentan acceder a rutas privadas.

## Historias de usuario

- HU-1. Como persona autenticada, quiero reconocer la institución por su logotipo y su nombre oficial para saber que estoy en el sistema correcto.
- HU-2. Como persona autenticada, quiero ver solo las opciones de mi rol para no perderme entre funciones ajenas.
- HU-3. Como administrador, quiero ver la lista completa de mi rol para saber qué módulos estarán disponibles.
- HU-4. Como persona autenticada, quiero saber en qué sección estoy para orientarme.
- HU-5. Como persona autenticada, quiero ver mi nombre, mi correo y mis iniciales para confirmar con qué cuenta ingresé.
- HU-6. Como persona autenticada, quiero acceder a la configuración de mi cuenta o cerrar sesión desde el menú.
- HU-7. Como persona que trabaja en escritorio, quiero colapsar el menú a iconos para ganar espacio horizontal, y que se recuerde mi elección.
- HU-8. Como persona que usa el teléfono, quiero abrir el menú como panel flotante sin perder la pantalla en la que estaba.
- HU-9. Como persona autenticada, quiero que el menú esté disponible en cualquier pantalla privada.

## Definiciones

- **Menú lateral**: panel de navegación del área privada con identidad arriba, opciones según el rol en el centro y datos de la cuenta abajo.
- **Identidad institucional**: logotipo acompañado del nombre oficial «E.E.T. N° 3100 — República de la India» o de su forma abreviada.
- **Nombre abreviado**: «E.E.T. N° 3100».
- **Opción de navegación**: entrada del menú con nombre visible en español, icono y destino.
- **Opción habilitada**: opción cuyo módulo existe y puede activarse. Son «Inicio», «Alumnos», «Cursos», «Inscripciones» (roles altos), «Gestión de usuarios» y «Mi perfil» según el rol, por las specs 010, 011, 012 y 013.
- **Opción no disponible**: opción del rol cuyo módulo todavía no existe o no aplica al rol; se muestra con la etiqueta «Próximamente» y no se activa. Son «Reportes» para todos e «Inscripciones» para `TUTOR`.
- **Módulo**: sección funcional representada por una opción.
- **Opción activa**: opción que corresponde al módulo de la pantalla privada visible.
- **Menú expandido**: estado de escritorio con iconos y textos; muestra nombre completo desde 1280 px y abreviado entre 1024 y 1279 px.
- **Menú colapsado**: estado de escritorio con solo iconos y logotipo; prevalece sobre el ancho de la ventana.
- **Drawer**: panel flotante que contiene el menú por debajo de 1024 px.
- **Barra compacta**: barra superior de tablet y móvil con botón de apertura, logotipo y campana.
- **Menú de cuenta**: panel anclado al avatar con «Configuración de cuenta» y «Cerrar sesión».
- **Preferencia de colapso**: elección recordada entre menú expandido y colapsado.
- **Iniciales**: dos letras mayúsculas que representan a la persona.
- **Datos de cuenta**: nombre, apellido y correo de la persona autenticada.
- **Rol de la sesión**: `ADMINISTRADOR`, `ADMINISTRATIVO` o `TUTOR` informado por el token de la sesión vigente.
- **Área privada**: rutas que requieren una sesión vigente. Incluye el dashboard y los módulos habilitados de cursos, usuarios, alumnos, perfil y cuenta.

### Reglas de presentación

| Estado | Ancho de ventana | Identidad | Opciones | Pie |
|---|---|---|---|---|
| Drawer | Menos de 1024 px | Logo 24 px y nombre abreviado | Lista del rol | Avatar, nombre y correo |
| Expandido abreviado | 1024 a 1279 px | Logo 24 px y nombre abreviado | Lista del rol | Avatar, nombre y correo |
| Expandido completo | 1280 px o más | Logo 32 px y nombre completo | Lista del rol | Avatar, nombre y correo |
| Colapsado | 1024 px o más | Logo 24 px, sin texto visible | Solo iconos | Solo avatar |

- Ancho del menú expandido: 280 px. Ancho del menú colapsado: 72 px. Ancho del drawer: 320 px o el 85 % del ancho de la ventana, el menor.
- El colapsado prevalece sobre cualquier regla de nombre por ancho.
- La campana se ubica en la cabecera del menú en escritorio y en la barra compacta en tablet y móvil; no se repite en el drawer.

### Inventario de opciones por rol

| Orden | TUTOR | ADMINISTRATIVO | ADMINISTRADOR |
|---|---|---|---|
| 1 | Inicio | Inicio | Inicio |
| 2 | Mis hijos | Alumnos | Alumnos |
| 3 | Inscripciones | Cursos | Cursos |
| 4 | Mi perfil | Inscripciones | Inscripciones |
| 5 | — | Mi perfil | Gestión de usuarios |
| 6 | — | — | Reportes |
| 7 | — | — | Mi perfil |

El orden de la tabla es el orden de presentación. «Inicio» es la primera opción de los tres roles. Están habilitadas «Alumnos», «Cursos», «Inscripciones» (roles altos), «Gestión de usuarios» y «Mi perfil» según el rol, por las specs 010, 011, 012 y 013. «Inscripciones» sigue no disponible para `TUTOR` y «Reportes» para todos, con la etiqueta «Próximamente».

## Requisitos funcionales

### Identidad y presentación

- RF-1. EL SISTEMA muestra en la parte superior del menú lateral el logotipo y el nombre oficial «E.E.T. N° 3100 — República de la India».
- RF-2. MIENTRAS el menú está expandido y el ancho de la ventana es de 1280 px o más, EL SISTEMA muestra el logotipo con 32 px de alto y el nombre institucional completo.
- RF-3. MIENTRAS el menú está expandido y el ancho de la ventana está entre 1024 y 1279 px, EL SISTEMA muestra el logotipo con 24 px de alto y el nombre abreviado «E.E.T. N° 3100», conservando el nombre completo como nombre accesible.
- RF-4. MIENTRAS el menú está colapsado, EL SISTEMA muestra solo el logotipo con 24 px de alto y expone el nombre institucional completo como nombre accesible; este estado prevalece sobre RF-2 y RF-3.
- RF-5. MIENTRAS el menú se muestra como drawer, EL SISTEMA muestra el logotipo con 24 px de alto y el nombre abreviado, conservando el nombre completo como nombre accesible.

### Rol y opciones

- RF-6. EL SISTEMA obtiene el rol del token de la sesión vigente y lo utiliza como única fuente para determinar las opciones; el nombre y el correo provienen de los datos de cuenta.
- RF-7. CUANDO el rol es `TUTOR`, EL SISTEMA muestra exclusivamente «Inicio», «Mis hijos», «Inscripciones» y «Mi perfil», en ese orden.
- RF-8. CUANDO el rol es `ADMINISTRATIVO`, EL SISTEMA muestra exclusivamente «Inicio», «Alumnos», «Cursos», «Inscripciones» y «Mi perfil», en ese orden.
- RF-9. CUANDO el rol es `ADMINISTRADOR`, EL SISTEMA muestra exclusivamente «Inicio», «Alumnos», «Cursos», «Inscripciones», «Gestión de usuarios», «Reportes» y «Mi perfil», en ese orden.
- RF-10. EL SISTEMA no renderiza ni anuncia opciones que no correspondan al rol de la sesión.
- RF-11. SI la sesión no presenta un rol reconocido, ENTONCES EL SISTEMA no muestra el menú ni opciones y no permite acceder a rutas privadas.
- RF-12. EL SISTEMA habilita «Inicio» y las opciones cuyos módulos existen, y muestra como no disponibles, con la etiqueta visible «Próximamente», «Reportes» para todos los roles e «Inscripciones» únicamente para el rol `TUTOR`.
- RF-13. EL SISTEMA permite enfocar las opciones no disponibles y las anuncia como «no disponible, próximamente», sin activarlas.
- RF-14. SI la persona activa una opción no disponible con puntero, Enter o Espacio, ENTONCES EL SISTEMA no navega, no modifica la opción activa y conserva el foco donde estaba.

### Estado activo

- RF-15. EL SISTEMA muestra «Inicio» como opción activa al ingresar al dashboard.
- RF-16. EL SISTEMA muestra la opción activa con un fondo diferenciado, un indicador lateral de al menos 3 px y la etiqueta en negrita, y es la única opción con esas marcas.
- RF-17. EL SISTEMA anuncia la opción activa como página actual.
- RF-18. SI la pantalla privada no corresponde a ningún módulo del rol, ENTONCES EL SISTEMA no resalta ninguna opción, sin activar «Inicio» por defecto.
- RF-19. EL SISTEMA considera que «Inicio» corresponde al dashboard ignorando barra final, parámetros y fragmento de la URL.

### Navegación y rutas

- RF-20. CUANDO la persona activa «Inicio», EL SISTEMA la lleva al dashboard.
- RF-21. EL SISTEMA muestra el menú lateral en el dashboard y no lo muestra en las rutas públicas.
- RF-22. SI una persona autenticada escribe una URL que no corresponde a una ruta existente, ENTONCES EL SISTEMA muestra el 404 de la aplicación sin el menú lateral.
- RF-23. CUANDO la persona está en una pantalla de un módulo habilitado por las specs 010, 011 o 012, EL SISTEMA muestra activa su opción en esa pantalla y en sus subpantallas.
- RF-24. CUANDO la persona navega, usa atrás o adelante, EL SISTEMA cierra el drawer si estaba abierto.

### Escritorio, tablet y móvil

- RF-25. MIENTRAS el ancho de la ventana es de 1024 px o más, EL SISTEMA no muestra la barra superior y presenta la identidad, la campana y la cuenta dentro del menú lateral.
- RF-26. MIENTRAS el ancho de la ventana es menor a 1024 px, EL SISTEMA oculta el menú lateral y muestra una barra compacta con el botón de apertura, el logotipo y la campana.
- RF-27. CUANDO la persona activa el botón de apertura, EL SISTEMA muestra el drawer con el nombre abreviado, todas las opciones de su rol y la opción activa resaltada.
- RF-28. CUANDO el drawer está abierto, EL SISTEMA permite cerrarlo con el botón de cierre, con la tecla Escape o con un clic o toque en el fondo.
- RF-29. CUANDO la persona activa el botón de apertura, EL SISTEMA mueve el foco al botón de cierre, lo mantiene dentro del drawer y, al cerrarlo, lo devuelve al botón de apertura.
- RF-30. MIENTRAS el drawer está abierto, EL SISTEMA impide el desplazamiento del fondo, conserva la posición vertical y el ancho útil del contenido y desplaza solo el interior del panel cuando sus opciones exceden la altura.
- RF-31. CUANDO la persona activa «Inicio» desde el drawer, EL SISTEMA navega al dashboard y cierra el drawer.
- RF-32. MIENTRAS el ancho de la ventana es de 1024 px o más, EL SISTEMA ofrece un control para colapsar y expandir el menú.
- RF-33. MIENTRAS el menú está colapsado, EL SISTEMA muestra solo los iconos, conserva la opción activa y expone el nombre de cada opción como nombre accesible y tooltip; en opciones no disponibles el tooltip agrega «Próximamente».
- RF-34. EL SISTEMA muestra el tooltip con hover y con foco de teclado, lo oculta con Escape y lo mantiene dentro del viewport.
- RF-35. EL SISTEMA recuerda la preferencia de colapso en el mismo navegador y perfil, la conserva entre recargas, reapertura y cierre de sesión y no la sincroniza entre dispositivos.
- RF-36. SI la preferencia está ausente, es inválida o el almacenamiento no está disponible, ENTONCES EL SISTEMA muestra el menú expandido.
- RF-37. CUANDO la ventana cambia entre escritorio, tablet y móvil, EL SISTEMA adapta el menú sin duplicarlo y sin cambiar la pantalla visible; al pasar de drawer a escritorio cierra el drawer y aplica la preferencia recordada, y cierra el menú de cuenta si estaba abierto.
- RF-38. EL SISTEMA muestra la campana con nombre accesible «Notificaciones», sin contador y sin consultar el servicio.
- RF-39. MIENTRAS el menú está colapsado, EL SISTEMA conserva accesibles la campana, el control de expansión y el avatar.
- RF-40. EL SISTEMA usa un drawer de 320 px o del 85 % del ancho de la ventana, el menor, con alto completo y cabecera y pie visibles mientras las opciones se desplazan.

### Pie y cuenta

- RF-41. EL SISTEMA muestra en el pie del menú las iniciales, el nombre completo y el correo electrónico de la persona.
- RF-42. EL SISTEMA calcula las iniciales con la primera letra del primer nombre y la primera letra del último apellido, en mayúsculas y conservando acentos; si solo hay una palabra, usa sus dos primeras letras; si no hay nombre, muestra un icono genérico.
- RF-43. SI el nombre o el correo no están disponibles, ENTONCES EL SISTEMA no muestra celdas vacías, iconos faltantes ni texto superpuesto, y conserva el resto del pie utilizable.
- RF-44. MIENTRAS los datos de cuenta no se hayan obtenido, EL SISTEMA muestra un esqueleto de carga en el pie, sin inventar datos.
- RF-45. SI la obtención de los datos de cuenta falla por red, timeout, error del servicio o acceso denegado, ENTONCES EL SISTEMA muestra un icono genérico, el nombre accesible «Cuenta» y las acciones de cuenta, sin inventar datos y sin descartar la sesión.
- RF-46. EL SISTEMA muestra nombre y correo en una sola línea con elipsis cuando no entran y expone el texto completo como nombre accesible.
- RF-47. MIENTRAS el menú está colapsado, EL SISTEMA muestra solo el avatar en el pie y presenta nombre y correo completos dentro del menú de cuenta.
- RF-48. CUANDO la persona activa el avatar, o el nombre cuando está visible, EL SISTEMA abre el menú de cuenta; lo cierra con Escape, con clic o toque fuera o al elegir una acción, y devuelve el foco al avatar.
- RF-49. EL SISTEMA muestra en el menú de cuenta «Configuración de cuenta» y «Cerrar sesión» como acciones habilitadas, conforme a la spec 011.
- RF-50. CUANDO la persona activa «Cerrar sesión», EL SISTEMA elimina la sesión local, notifica al servicio como mejor esfuerzo y redirige al login aunque la notificación falle o no responda.
- RF-51. SI la persona activa «Cerrar sesión» mientras la acción está en curso, ENTONCES EL SISTEMA ignora la segunda activación.

### Sesión y privacidad

- RF-52. CUANDO la sesión deja de ser válida, EL SISTEMA aplica el comportamiento de sesión vencida de la spec 008, cierra el drawer y el menú de cuenta si están abiertos y no conserva el menú visible.
- RF-53. EL SISTEMA no expone el token de la sesión en el menú, en el menú de cuenta ni en sus nombres accesibles.
- RF-54. EL SISTEMA trata los valores de rol en español como datos del backend y no como identificadores de código, según la excepción ya aceptada por la spec 008.
- RF-55. CUANDO el rol vigente es `TUTOR`, EL SISTEMA muestra la opción de alumnos con la etiqueta «Mis hijos»; CUANDO el rol es `ADMINISTRATIVO` o `ADMINISTRADOR`, la muestra con la etiqueta «Alumnos».
- RF-56. EL SISTEMA navega a `/dashboard/students` al activar la opción de alumnos y la marca activa en esa dirección y en sus subpantallas.

## Requisitos no funcionales

- RNF-1. Accesibilidad: el menú, el drawer, el control de colapso, el menú de cuenta y la campana se operan con teclado, tienen nombres accesibles en español y foco visible.
- RNF-2. La opción activa no depende solo del color y se anuncia como página actual.
- RNF-3. Contraste: todo texto visible, incluida la etiqueta «Próximamente», alcanza al menos 4.5:1; el indicador de opción activa alcanza al menos 3:1.
- RNF-4. Responsive: el menú, el drawer y la barra compacta funcionan sin desbordamiento horizontal ni solapamientos entre 320 y 1920 px.
- RNF-5. Texto ampliado: con el texto del navegador al 200 % no aparece scroll horizontal de página y el drawer desplaza su contenido internamente.
- RNF-6. Sin salto vertical del fondo al abrir o cerrar el drawer; al colapsar o expandir, el contenido se reacomoda sin solaparse ni generar scroll horizontal.
- RNF-7. Consistencia visual: se usan la paleta y la tipografía de la barra superior actual y del sistema de diseño institucional.
- RNF-8. Los textos visibles están en español.
- RNF-9. La selección por rol es una ayuda de navegación y no reemplaza la autorización del servicio.
- RNF-10. La funcionalidad se resuelve sin dependencias externas nuevas.
- RNF-11. El menú admite los tres roles sin duplicar variantes por rol.
- RNF-12. La preferencia de colapso no es información sensible ni contiene datos de la cuenta.
- RNF-13. El nombre institucional completo permanece legible donde se muestra y disponible como nombre accesible en el resto de los estados.
- RNF-14. El menú y los datos de cuenta no se sirven desde una caché compartida entre usuarios y se generan por sesión.
- RNF-15. El logotipo reutilizado se muestra sin pérdida de nitidez en 1x y 2x; su tratamiento optimizado se detalla en el plan.
- RNF-16. Colores forzados: la opción activa conserva un indicador no dependiente solo del color y el foco sigue siendo visible.
- RNF-17. Movimiento reducido: si el drawer o el colapso se animan, la animación se reduce o se elimina cuando el sistema lo solicita.
- RNF-18. Mientras el drawer está abierto, el contenido de fondo no es alcanzable con teclado ni con lector de pantalla.
- RNF-19. El tooltip permanece dentro del viewport y no tapa el control que lo origina.
- RNF-20. La iconografía de las opciones proviene del conjunto institucional existente; las imágenes faltantes, su carpeta y su nombre se informan en el plan.

## Casos límite

- Sesión sin rol reconocido: no se muestra menú ni opciones.
- Nombre o correo ausentes: icono genérico, nombre accesible «Cuenta» y acciones disponibles.
- Nombre de una sola palabra: iniciales con sus dos primeras letras.
- Nombre compuesto o con varios apellidos: primera letra del primer nombre y del último apellido.
- Nombre con acentos o caracteres no latinos: se conserva el primer carácter.
- Nombre o correo muy largos: una línea con elipsis y texto completo accesible.
- Institución muy larga: abreviatura según el ancho y nombre completo accesible.
- Carga de datos de cuenta: esqueleto sin datos inventados.
- Fallo, timeout o acceso denegado al obtener la cuenta: pie degradado y sesión conservada.
- Ingreso directo al dashboard: «Inicio» activo.
- Parámetros, fragmento o barra final en la URL del dashboard: «Inicio» sigue activo.
- Pantalla privada sin módulo asociado: ninguna opción activa.
- Activación de una opción no disponible con puntero: sin navegación y sin cambio de activo.
- Activación de una opción no disponible con Enter o Espacio: sin navegación y con foco conservado.
- Activación de «Inicio» estando ya en el dashboard: permanece activo sin cambio de estado.
- URL manual de un módulo no disponible: 404 de la aplicación sin menú.
- Drawer abierto y activación de «Inicio»: navega y cierra el panel.
- Drawer abierto y clic o toque en el fondo: se cierra sin activar el control del fondo.
- Drawer abierto y tecla Escape: se cierra y el foco vuelve al botón de apertura.
- Drawer abierto y foco con teclado: no escapa al contenido de fondo.
- Drawer abierto y opciones que exceden la altura: se desplaza el interior y se conservan cabecera y pie.
- Drawer abierto y cambio de tamaño a escritorio: se cierra y se aplica la preferencia recordada.
- Menú de cuenta abierto y cambio de tamaño: se cierra y el foco vuelve al avatar.
- Preferencia de colapso inválida o ausente: menú expandido.
- Preferencia con almacenamiento no disponible: menú expandido.
- Menú colapsado y foco con teclado: cada icono anuncia su nombre y la opción activa.
- Menú colapsado con nombre de opción largo: el tooltip no desborda la ventana.
- Menú colapsado: nombre y correo se consultan en el menú de cuenta.
- Menú de cuenta abierto y Escape o clic fuera: se cierra y el foco vuelve al avatar.
- Doble activación de «Cerrar sesión»: se ignora la segunda.
- Cierre de sesión con el servicio de notificación caído: se cierra localmente y se redirige igual.
- Sesión vencida con drawer o menú de cuenta abiertos: se cierran y se aplica el comportamiento de la spec 008.
- Cambio de rol entre sesiones: se recalcula la lista al iniciar la nueva sesión.
- Texto al 200 % con drawer abierto: sin scroll horizontal de página y con scroll interno.
- Colores forzados o movimiento reducido: se conservan indicador de activo, foco y ausencia de animación.

## Fuera de alcance

- La construcción de los módulos de alumnos, cursos, inscripciones, usuarios, reportes o perfil; los módulos viven en las specs 010, 011 y 012 y esta spec solo define su navegación.
- Creación de rutas nuevas desde esta spec o pantallas «Próximamente».
- La activación de las opciones por módulo se verifica en las specs 010, 011 y 012.
- Edición de datos de perfil o de configuración de cuenta.
- Permisos granulares o acciones dentro de cada módulo.
- Contador o consulta real de notificaciones.
- Cambios en el backend, en el contrato de sesión o en la autorización del servicio.
- Búsqueda, filtros o favoritos en el menú.
- Modo oscuro o temas alternativos.
- Imagen de avatar; en esta versión se usan iniciales.
- Sincronización instantánea del cierre de sesión entre pestañas.
- Sincronización de la preferencia de colapso entre dispositivos.

## Mensajes de la interfaz

| Caso | Texto |
|---|---|
| Nombre oficial | «E.E.T. N° 3100 — República de la India» |
| Nombre abreviado | «E.E.T. N° 3100» |
| Opción de inicio | «Inicio» |
| Opción de alumnos del tutor | «Mis hijos» |
| Opción de alumnos administrativa | «Alumnos» |
| Estado no disponible | «Próximamente» |
| Descripción de opción no disponible | «No disponible, próximamente» |
| Botón de apertura | «Abrir menú» |
| Botón de cierre | «Cerrar menú» |
| Control de colapso | «Contraer menú» |
| Control de expansión | «Expandir menú» |
| Campana | «Notificaciones» |
| Menú de cuenta | «Cuenta de {nombre}» |
| Menú de cuenta sin nombre | «Cuenta» |
| Acción de configuración | «Configuración de cuenta» |
| Acción de cierre | «Cerrar sesión» |

## Criterios de finalización

- El menú muestra el logotipo reutilizado y el nombre institucional, con abreviatura y logo reducido según las reglas de presentación.
- El colapsado prevalece sobre el nombre por ancho y conserva el nombre completo accesible.
- Cada rol ve exclusivamente su lista, en el orden definido.
- Un rol no reconocido no obtiene menú ni acceso privado.
- «Inicio» está activo al entrar al dashboard.
- «Alumnos», «Cursos», «Inscripciones» (roles altos), «Gestión de usuarios» y «Mi perfil» están habilitados según el rol por las specs 010, 011, 012 y 013.
- «Inscripciones» (solo para `TUTOR`) y «Reportes» se muestran con «Próximamente», reciben foco y no navegan; «Inscripciones» está habilitada para `ADMINISTRATIVO` y `ADMINISTRADOR` con destino `/dashboard/registrations`.
- El `TUTOR` ve «Mis hijos» y los roles administrativos ven «Alumnos» con destino `/dashboard/students`.
- La opción activa se distingue por fondo, indicador y peso, y se anuncia como página actual.
- El pie muestra iniciales, nombre y correo, con degradación por carga o error y el menú de cuenta.
- En escritorio no hay barra superior y el menú se colapsa a iconos con tooltip y preferencia recordada, incluso tras cerrar sesión.
- En móvil hay barra compacta y drawer con cierre por botón, Escape y clic o toque en el fondo, sin activar el fondo.
- El drawer mueve y atrapa el foco, bloquea el scroll de fondo y desplaza su interior.
- El menú está en el dashboard y ausente en rutas públicas o desconocidas.
- El menú, el drawer y el menú de cuenta son accesibles, resisten colores forzados, texto al 200 % y no desbordan entre 320 y 1920 px.
- La spec 008 queda actualizada con el reemplazo de la barra y la nueva ubicación del cierre de sesión.
- La verificación técnica de tipos, lint, compilación y pruebas queda en verde y se detalla en el plan.

## Dudas abiertas

- Ninguna.
