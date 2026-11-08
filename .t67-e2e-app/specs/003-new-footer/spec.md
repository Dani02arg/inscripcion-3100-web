---
name: new-footer
description: Spec de footer institucional visible en las páginas públicas de la EET N° 3100
---
# Spec 003 — Footer independiente y reutilizable

**Estado:** aprobada (revisión 2026-10-31: visible en páginas públicas, ausente en el panel privado)

## Contexto y objetivo

La aplicación de la EET N° 3100 tendrá múltiples páginas. Actualmente el footer
está embebido en la página de inicio, por lo que cualquier cambio obliga a
repetirlo en cada página. Se necesita un footer único, consistente y reutilizable,
con una distribución en tres zonas que ordene la información institucional, el
copyright y los créditos de los desarrolladores, y que se adapte sin solapamientos
a pantallas pequeñas. Desde la revisión 2026-10-31, el footer se muestra en las
páginas públicas, incluidas el home, login, registro, recuperación, restablecimiento
y verificación; no aparece en el panel privado.

## Usuarios

- **Visitante público (sin autenticación):** navega las páginas públicas y necesita
  reconocer la institución, el año de vigencia y los créditos.
- **Responsable del sitio:** necesitará incorporar contenido futuro en la zona
  izquierda sin rediseñar el footer.

## Historias de usuario

- HU-1. Como visitante, quiero ver el footer en las páginas públicas para reconocer la institución y el año de vigencia.
- HU-2. Como visitante, quiero acceder a los perfiles de los desarrolladores desde el footer para conocer su trabajo.
- HU-3. Como visitante en pantalla pequeña, quiero que el footer se reorganice sin que los textos ni los iconos se pisen, para leerlo cómodamente.
- HU-4. Como responsable del sitio, quiero disponer de una zona izquierda reservada para incorporar contenido futuro sin rehacer el diseño.

## Definiciones

- Zona izquierda: área del footer reservada para contenido futuro; por ahora permanece vacía en escritorio y no se representa en pantallas pequeñas.
- Zona central: área que contiene el nombre institucional y el copyright.
- Zona derecha: área que contiene el título "DESARROLLADORES:" y los créditos.
- Año de fundación: constante del sistema, fijada en 2026.
- Año dinámico: año calendario actual del sistema en el momento de la visita.
- Contenedor de contenido: 90 % del ancho de la página, centrado.
- Nombre institucional: texto "EET 3100 REPUBLICA DE LA INDIA", con el tamaño de fuente actual (20 px) y en negrita.
- Texto de desarrolladores: título y nombres con tamaño de fuente renderizado de 14 px.

## Decisiones de clarificación

- El footer ocupa el 100 % del ancho de la página; su contenido interno se distribuye en un contenedor del 90 % centrado.
- En escritorio se usan tres zonas de igual ancho.
- El footer se apila en una sola columna centrada por debajo de 1024 px de ancho.
- El nombre institucional va en una fila y el copyright + año en la fila inferior.
- El copyright muestra un rango sin duplicar: "© 2026" si el año actual es 2026 o anterior; "© 2026-{año actual}" si es posterior. El separador es un guion y el símbolo "©" es literal.
- El nombre institucional mantiene el tamaño actual de 20 px; los desarrolladores usan 14 px como tamaño final renderizado en el estado base.
- El icono y el nombre de cada desarrollador forman un único enlace clicable.
- La zona izquierda se reserva solo en escritorio; en pantallas pequeñas no se renderiza ni deja espacio en blanco.
- El año de fundación es una constante, no un dato configurable.
- Se siguen buenas prácticas de accesibilidad: landmark de footer, encabezado semántico para desarrolladores, iconos decorativos, foco visible y navegación por teclado.
- El footer se muestra en las páginas públicas, incluidas home, login, registro, recuperación, restablecimiento y verificación; no se muestra en el panel privado.

## Requisitos funcionales (EARS — español)

- RF-1: EL SISTEMA debe mostrar el footer en las páginas públicas (home, login, registro, recuperación, restablecimiento y verificación) y no en el panel privado.
- RF-2: MIENTRAS el ancho de pantalla sea igual o mayor a 1024 px, EL SISTEMA debe distribuir el contenido del footer en tres zonas de igual ancho dentro de un contenedor del 90 % centrado, sobre un fondo de ancho completo.
- RF-3: MIENTRAS el ancho de pantalla sea igual o mayor a 1024 px, EL SISTEMA debe mostrar la zona izquierda vacía y visualmente reservada para contenido futuro.
- RF-4: MIENTRAS el ancho de pantalla sea igual o mayor a 1024 px, EL SISTEMA debe mostrar en la zona central, con alineación centrada, el nombre "EET 3100 REPUBLICA DE LA INDIA" en una fila y el copyright en la fila inferior.
- RF-5: MIENTRAS el ancho de pantalla sea igual o mayor a 1024 px, EL SISTEMA debe mostrar en la zona derecha, alineado a la derecha, el título "DESARROLLADORES:" y, en filas separadas, a Daniela Acosta y Andres Arancibia.
- RF-6: EL SISTEMA debe mostrar el copyright con la constante 2026 y el año dinámico: si el año actual es 2026 o anterior, debe mostrar "© 2026"; si es posterior, debe mostrar "© 2026-{año actual}" con un guion como separador.
- RF-7: EL SISTEMA debe mostrar el nombre institucional con el tamaño actual de 20 px y en negrita, y el título "DESARROLLADORES:" junto con los nombres de los desarrolladores con un tamaño de fuente final renderizado de 14 px en el estado base.
- RF-8: EL SISTEMA debe mostrar, para cada desarrollador, el icono de desarrollador a la izquierda del nombre, con el icono entre un 5 % y un 8 % más alto que el texto y alineado verticalmente con él.
- RF-9: EL SISTEMA debe convertir el icono y el nombre de cada desarrollador en un único enlace clicable: Daniela Acosta a https://www.linkedin.com/in/daniela-acosta-b06780206/ y Andres Arancibia a https://andres25ar.github.io/Portfolio/, abriéndolos en una nueva pestaña y sin exponer la página de origen.
- RF-10: CUANDO el ancho de pantalla sea menor a 1024 px, EL SISTEMA debe apilar las zonas en una sola columna centrada: primero el bloque institucional con el copyright y luego el bloque de desarrolladores.
- RF-11: CUANDO el ancho de pantalla sea menor a 1024 px, EL SISTEMA no debe renderizar la zona izquierda ni reservar un espacio visible que empuje o desplace el contenido.
- RF-12: EL SISTEMA debe evitar que los textos y los iconos se superpongan o generen desplazamiento horizontal entre 320 px y 1920 px de ancho, permitiendo el ajuste de línea cuando sea necesario.
- RF-13: EL SISTEMA debe mostrar los iconos de los desarrolladores con un tono coherente con el texto que acompañan y con un contraste de al menos 4.5:1 sobre el fondo del footer.
- RF-14: EL SISTEMA debe exponer el footer como landmark semántico, usar un encabezado semántico para el bloque de desarrolladores y tratar los iconos como decorativos para que los lectores de pantalla no dupliquen los nombres.

## Requisitos no funcionales

- RNF-1: El contraste entre textos/iconos y el fondo del footer debe ser de al menos 4.5:1.
- RNF-2: El footer no debe generar desplazamiento horizontal ni solapamientos entre 320 px y 1920 px de ancho.
- RNF-3: Todos los enlaces deben ser accesibles por teclado y mostrar un foco visible con un indicador de al menos 3:1 de contraste respecto al fondo.
- RNF-4: Los iconos deben conservar su calidad vectorial y un tamaño estable en todos los anchos.
- RNF-5: El footer no debe introducir dependencias externas nuevas.
- RNF-6: El contenido del footer debe tener una única fuente para las páginas públicas, de modo que un cambio se refleje sin ediciones repetidas.
- RNF-7: Los iconos deben servirse mediante el componente de imagen optimizada de Next.js, con el atributo de no optimización cuando el formato vectorial lo requiera.
- RNF-8: Con zoom del navegador o texto ampliado hasta el 200 %, el footer debe mantener la legibilidad, el orden de lectura y la ausencia de solapamientos.

## Casos límite

- EC-1: Si el año calendario cambia mientras la aplicación está abierta, el copyright debe reflejar el nuevo año al recargar la página.
- EC-2: Si un icono de desarrollador no carga, el nombre correspondiente debe seguir siendo visible.
- EC-3: Si el nombre institucional o los nombres de los desarrolladores son más largos de lo previsto, deben ajustarse en varias líneas sin superponerse.
- EC-4: En el rango de 1024 px a 1100 px, las tres zonas deben mantenerse y el texto puede ajustarse en varias líneas, sin reducir el tamaño de fuente ni superponerse.
- EC-5: Si el usuario amplía el texto o el zoom del navegador hasta el 200 %, el footer debe mantener la legibilidad y evitar solapamientos.
- EC-6: Si el año del sistema es anterior a 2026, el copyright debe mostrar solamente "© 2026".
- EC-7: Si la lista de desarrolladores está vacía o contiene un solo elemento, el footer debe mantener una distribución estable sin espacios rotos.
- EC-8: En impresión o en modo de alto contraste del sistema operativo, el footer debe conservar la legibilidad y el orden de la información.
- EC-9: En un lector de pantalla, el orden de lectura debe ser: nombre institucional, copyright, título de desarrolladores y cada desarrollador.
- EC-10: En páginas públicas de autenticación el footer se muestra; en el panel privado, error y 404 no se muestra.
- EC-11: Si una página se renderiza sin JavaScript, el footer y sus enlaces deben seguir siendo visibles y funcionales.
- EC-12: No debe existir más de un footer por página.

## Fuera de alcance

- Añadir contenido real en la zona izquierda (solo se reserva).
- Modificar nombres, perfiles o enlaces de los desarrolladores.
- Crear nuevos iconos o editar los existentes.
- Añadir animaciones distintas de los efectos hover ya existentes.
- Rediseñar la navbar, el hero o los botones de acción.
- Incorporar enlaces legales, redes sociales u otros bloques no solicitados.

## Criterios de finalización

- El footer se muestra de forma idéntica en las páginas públicas y no se duplica en el panel privado.
- En anchos de 1024 px o más: fondo de ancho completo, contenedor interno del 90 %, tres zonas iguales; izquierda vacía; centro con nombre institucional en una fila y copyright debajo; derecha con desarrolladores.
- En anchos menores a 1024 px: una sola columna centrada, con el bloque institucional primero y el bloque de desarrolladores debajo, sin espacio reservado para la zona izquierda.
- El copyright muestra "© 2026" en 2026 o antes y "© 2026-{año}" en años posteriores.
- El nombre institucional se muestra a 20 px y en negrita; los desarrolladores a 14 px finales.
- El icono y el nombre de cada desarrollador forman un solo enlace externo seguro.
- No hay solapamientos ni desplazamiento horizontal entre 320 px y 1920 px.
- El footer es accesible por teclado, con foco visible y sin duplicar nombres en lectores de pantalla.
- pnpm lint, la verificación de tipos y pnpm build finalizan sin errores.

## Dudas abiertas

- Ninguna: las ambigüedades y contradicciones detectadas en la revisión de QA fueron resueltas.
