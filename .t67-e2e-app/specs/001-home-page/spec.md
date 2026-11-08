---
name: home-page
description: Spec de la pantalla de inicio pública EET N° 3100 - Landing page institucional
---
# Spec 001 — Pantalla de Inicio

**Estado:** aprobada

## Contexto y objetivo
Proyecto: EET N° 3100 Staff Web Application.
Stack: Next.js 16.4.1 (App Router), React 19, TypeScript strict, Tailwind CSS v4.
Objeto: Pantalla de acceso público (landing page) como vista principal de la institución.
Pila: Frontend Next.js (Server Components first), API Laravel centralizada `{ data, message, errors }`, autenticación JWT.
Institución: Escuela Técnica EET N° 3100, República de la India.

## Usuarios
- **PÚBLICO** (sin auth): puede ver navbar, hero, footer, botones de acción.
- **USUARIO NO AUTENTICADO**: puede clickear "Iniciar sesión" y "Registrarse" (redirige a auth flow).
- Docentes/Alumnos: contenido adicional fuera de alcance para esta spec.

## Requisitos funcionales (en EARS - español)
- RF-1: CUANDO el usuario entra a la página principal, ENTONCES debe ver el logo institucional a la izquierda y las opciones 'Registrarse' e 'Iniciar Sesión' a la derecha en la navbar. — ✅ Realizado (T2).
- RF-2: CUANDO el usuario está en vista móvil, ENTONCES debe verse el menú hamburguesa a la derecha y el logo de la escuela a la izquierda de la navbar. — ✅ Realizado (T2, T8): en móvil el logo queda a la izquierda y la hamburguesa a la derecha.
- RF-3: CUANDO el usuario clicka "Iniciar sesión", ENTONCES debe redirigir al flujo auth (página /login).
- RF-4: CUANDO el usuario clicka "Registrarse", ENTONCES debe redirigir al flujo auth (página /register).
- RF-5: CUANDO el usuario clicka "Ver cursos", ENTONCES debe navegar a /courses (lectura pública). — ✅ Realizado (T4).
- RF-6: CUANDO el usuario clicka "Ir a escuela", ENTONCES debe navegar a https://tecnicadelaindia.edu.ar/ (mismo link que el botón Facebook, el cual estará comentado por ahora). — ✅ Realizado (T4).
- RF-7: CUANDO el usuario clicka "Facebook", ENTONCES debe abrir https://facebook.com/ en nueva pestaña (por ahora sin enlace funcional). — ✅ Realizado (T4).
- RF-8: CUANDO el usuario está en vista móvil y clicka el menú hamburguesa, ENTONCES debe abrir el menú desplegable solo con las opciones 'Registrarse' e 'Iniciar sesion'. — ✅ Realizado (T2, T3).
- RF-9: CUANDO la página carga, ENTONCES debe ser completamente Server Component (sin 'use client' salvo toggle del menú).
- RF-10: CUANDO hay cambio de esquema color del sistema (light/dark), ENTONCES los colores deben usar los tokens institucionales definidos en globals.css (--color-azul-institucional, --color-texto-principal, etc.). — ✅ Realizado (T4).
- RF-11: Los iconos de la navbar y botones deben usar una librería de iconos gratuita para React/Next.js con gran variedad (ej. Heroicons, Boxicons o Font Awesome versión gratuita). Por definir cuál usar.

## Requisitos no funcionales
- RNF-1: La página debe ser 100% Server Components (principio #5 de constitution.md). `'use client'` solo en el toggle del menú hamburguesa si es necesario. — ✅ Realizado (T7).
- RNF-2: Todos los colores deben usar las variables CSS definidas en `app/globals.css` (skill `design-system`/`tailwind-4-docs`). No usar valores HEX fijos como `#041E88` directamente en el código. Tokens: `--color-azul-institucional`, `--color-texto-principal`, `--color-texto-secundario`, `--color-fondo-app`, `--color-superficie`, `--color-borde-input`, `--color-borde-focus`.
- RNF-3: El componente navbar debe ser puro (recibir datos por props, sin fetch HTTP directo).
- RNF-4: Carga inicial < 2s en conexión estándar (optimización Next.js: `next/image`, `next/font`). — ✅ Realizado (T7).
- RNF-5: Accesibilidad básica: contrastes de colores mínimo 4.5:1, labels descriptivos, foco visible, `aria-label` en íconos y enlaces. — 🟡 Parcial (T7, T12): `aria-label` en los iconos del navbar y en el botón hamburguesa, anillo de foco visible con teclado y contraste 12.88:1 (enlaces del navbar) y 10.42:1 (`h1`) ✅; pendiente el párrafo secundario del hero (`--color-texto-secundario` `#7F8C8D` sobre `--color-fondo-app` `#F8F9FA`), que da **3.30:1** (< 4.5:1), preexistente de T4 y ajeno a la navbar.
- RNF-6: SEO básico: metadata por ruta, títulos y descripciones apropiadas. — ❌ No cumplido (detectado en T12): `app/metadata.ts` existe pero no está importado por ninguna ruta, así que `/home` se sirve con el título "Create Next App" y la descripción por defecto de `app/layout.tsx`.
- RNF-7: El ancho del contenido principal debe ser 60-70% del ancho de pantalla, centrado horizontalmente. — ✅ Realizado (T4).
- RNF-8: Tipografía principal `Roboto` configurada globalmente usando `next/font/google`.
- RNF-9: Radios de borde: cards `rounded-xl` o `rounded-2xl`, botones `rounded-lg` o `rounded-xl`, inputs `rounded-lg`.

## Casos límite
- EC-1: Si el usuario entra desde un dispositivo sin soporte de touch, el menú hamburguesa debe permanecer visible permanente.
- EC-2: Si la API Laravel no está disponible (401/500), la navbar y hero deben seguir visibles (UI estática, sin datos críticos dependientes de API).
- EC-3: Si el usuario tiene el navegador en modo reader view, la navbar debe adaptarse o ocultarse gracefully.
- EC-4: Si el usuario es un robot/bot, la página debe responder con HTML estático sin JavaScript pesado.

## Fuera de alcance
- Sistema de autenticación completo (login/register flow es out of scope; solo redirección).
- Panel de admin o áreas privadas.
- Base de datos propia; todos datos vienen de API Laravel.
- Lógica de negocio compleja; solo UI estática y enlaces.
- Integración con redes sociales além del link a Facebook.

## Criterios de finalización (Definition of Done)
- [ ] Spec aprobada con todos los RF en formato EARS.
- [ ] En móvil y escritorio el logo queda a la izquierda, sin el texto "EET N° 3100", y la navbar es de una sola fila y no tapa el contenido.
- [ ] El contenido de la navbar ocupa el 70 % del ancho en escritorio y el 85 % en móvil, centrado.
- [ ] El logo institucional enlaza a `/home`.
- [x] El menú móvil se cierra al hacer clic fuera de él.
- [ ] Componentes creados: `app/ui/navbar.tsx` (Server Component), `app/ui/mobile-menu-toggle.tsx` (Client Component), `app/home/page.tsx` (Server Component).
- [ ] Navbar incluye: logo institucional PNG a la izquierda, links "Registrarse" e "Iniciar Sesión" a la derecha, menú hamburguesa móvil con opciones 'Registrarse' e 'Iniciar Sesión'.
- [ ] Botones hero apilados verticalmente (una columna) tanto en móvil como en desktop, con efectos hover y colores del design-system.
- [ ] Colores usan tokens `var(--color-XXX)` definidos en globals.css, NO HEX fijos.
- [ ] Footer con año dinámico, texto "EET 3100 REPUBLICA DE LA INDIA" centrado, sección "DESARROLLADORES:" con nombres e iconos y enlaces.
- [ ] Ancho del contenido principal: 60-70% centrado horizontalmente.
- [ ] Navegación funcional: cada botón lleva al destino correcto (URLs absolutas o relative Next.js).
- [x] `pnpm lint` y `pnpm type-check` sin errores.
- [x] No hay console.error en la consola del navegador al cargar la página.
- [x] `next build` pasa sin errores.

## Dudas abiertas (respondidas)
1. URL de LinkedIn: `https://www.linkedin.com/in/daniela-acosta-b06780206/`.
2. URL Portfolio: `https://andres25ar.github.io/Portfolio/`.
3. Desarrolladores: Daniela Acosta y Andres Arancibia (links arriba).
4. Nombre y carpeta del logo: `public/logo.png` (formato PNG, en carpeta `public/` para assets raíz).
5. URLs de botones: "Iniciar sesión" → `/login`, "Registrarse" → `/register`, "Ver cursos" → `/courses`, "Institución" → `https://tecnicadelaindia.edu.ar/` (nueva pestaña).
6. Animaciones: CSS nativo con Tailwind v4, transiciones suaves en hover y apertura de menú móvil.
7. Footer: texto central "EET 3100 REPUBLICA DE LA INDIA + copyright + 2026", enlaces a derecha: Daniela Acosta (LinkedIn) y Andres Arancibia (Portfolio).

## Versión móvil y comportamientos por rol
- RF-12: En vista móvil, el logo institucional debe permanecer a la izquierda de la navbar y el menú hamburguesa a la derecha. El menú desplegable debe aparecer por debajo de la navbar con las opciones configuradas según el rol del usuario. — 🟡 Parcial (T2, T8, T11): logo a la izquierda y hamburguesa a la derecha ✅; el desplegable ya aparece por debajo de la navbar ✅ (T11, que agregó `top-full`: antes se renderizaba encima, `top: -31`); las "opciones según el rol" quedan diferidas (RF-13).
- RF-13: Por ahora, los puntos 4 y 5 referentes a comportamientos diferenciados para usuarios logueados (mostrar 'mi perfil' y 'cerrar sesion' en desktop, y opciones adicionales en mobile según rol) quedan **ociados para implementación futura** cuando el sistema de AUTH esté listo. La spec actual considera al usuario como **PÚBLICO (sin auth)**.

### Barra de navegación: layout, ancho, enlace del logo y cierre del menú
- RF-14: EL SISTEMA debe mostrar el logo institucional alineado a la izquierda de la barra de navegación tanto en vista móvil como en escritorio, y no debe mostrar el texto "EET N° 3100" junto al logo. — ✅ Realizado (T8).
- RF-15: CUANDO la persona accede desde una vista móvil, EL SISTEMA debe mostrar la barra de navegación en una sola fila y con altura reducida, de modo que no oculte ni tape el contenido de la página. — ✅ Realizado (T8, T9): fila única y altura 57 px; verificado en `/home` y `/register` a 320/375/768/1024 px sin oclusión de contenido.
- RF-16: CUANDO la persona hace clic en el logo institucional, EL SISTEMA debe navegar a `/home`. — ✅ Realizado (T10).
- RF-17: CUANDO el menú desplegable móvil está abierto y la persona hace clic fuera de él, EL SISTEMA debe cerrarlo. — ✅ Realizado (T11): cierra con `pointerdown` fuera y también con `Escape`; el botón hamburguesa sigue abriendo y cerrando el menú.
- RF-18: EL SISTEMA debe centrar el contenido de la barra de navegación y dimensionarlo al 70 % del ancho de la pantalla en escritorio y al 85 % en vista móvil; en escritorio debe conservar la separación actual entre el logo y los enlaces "Registrarse" e "Iniciar Sesión", y en móvil debe ubicar el logo a la izquierda y el menú hamburguesa a la derecha. — ✅ Realizado (T8).

## Año dinámico en footer
- RNF-7: El año en el footer debe ser dinámico (basado en el año actual del sistema), no hardcodeado. Se deberá implementar usando `new Date().getFullYear()` en el componente correspondiente o mediante generación estática en la build.

## Sintaxis de Tailwind CSS
- RNF-8: El proyecto debe utilizar la sintaxis y convenciones de **Tailwind CSS v4**. Los componentes y estilos deben ser compatibles con las nuevas utilidades y directivas de Tailwind v4 (ej. `transition`, `aspect-ratio`, y nuevas directivas `@layer`). No se deben usar patrones depreciados de v3.

## Accesibilidad mejorada: prefers-reduced-motion
- RNF-9: La página debe respetar la configuración del sistema `prefers-reduced-motion`. Las animaciones y transiciones deben ser suaves por defecto, pero reducirse o eliminarse cuando el usuario tenga activado este preferencia en el sistema operativo. Se debe implementar utilizando la directiva `@media (prefers-reduced-motion: reduce)` en los estilos CSS.

## Definición extendida de íconos
- Los iconos deben ser accesibles (tener `aria-label` descriptivo) y tener un tamaño mínimo de 20px x 20px. Se deben evitar iconos puramente decorativos sin función interactiva, o si se usan, deben tener `aria-hidden="true"`.

## Tipografía y radios de borde (design-system)
- Fuente principal: `Roboto`, configurada globalmente usando `next/font/google`.
- Tamaños permitidos: 14px (`text-sm`) metadatos/texto secundario, 16px (`text-base`) cuerpo/botones, 20px (`text-xl`) subtítulos, 24px (`text-2xl`) títulos de página/modales.
- Radios de borde: cards `rounded-xl` o `rounded-2xl`, botones `rounded-lg` o `rounded-xl`, inputs `rounded-lg`.
SPECEOF
