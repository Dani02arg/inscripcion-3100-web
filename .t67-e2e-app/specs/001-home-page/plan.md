---
name: home-page-plan
description: Plan técnico de la spec 001-home-page - Landing page institucional EET N° 3100
---
# Plan 001 — Pantalla de Inicio

## 1. Archivos a crear

| Archivo | Propósito | RFs cubiertas |
|---------|-----------|---------------|
| `app/ui/navbar.tsx` | Navbar fija: logo institucional a la izquierda (móvil y escritorio) enlazado a `/home`, links "Registrarse"/"Iniciar Sesión" a la derecha en escritorio, menú hamburguesa a la derecha en móvil, contenido centrado al 70 % (escritorio) y 85 % (móvil), en una sola fila y con altura reducida. Server Component puro. | RF-1, RF-2, RF-8, RF-14, RF-15, RF-16, RF-18 |
| `app/home/page.tsx` | Página principal de landing: hero con bienvenida y botones CTA, footer. Server Component puro. | RF-1, RF-5, RF-7 (parte), todos los visuales |
| `app/ui/mobile-menu-toggle.tsx` | Menú hamburguesa que se despliega por debajo de la navbar con opciones 'Registrarse' e 'Iniciar sesion'. Client Component mínimo (`'use client'`) que controla la apertura/cierre y cierra el menú al hacer clic fuera de él (y con `Escape`). | RF-8, RF-12, RF-17 |
| `app/ui/icons/` | Carpeta con los iconos de la librería gratuita elegida (Heroicons o Boxicons). Los iconos deben ser accesibles con `aria-label`. | RF-11 |
| `app/lib/reduced-motion.ts` | Helper para detectar `prefers-reduced-motion` y aplicar estilos condicionales. | RNF-9 |
| `app/components/footer.tsx` | Footer con año dinámico (`new Date().getFullYear()`), texto central "EET 3100 REPUBLICA DE LA INDIA + copyright", enlaces a LinkedIn y Portfolio de los desarrolladores. Server Component. | RF-7 (footer), RNF-7 |
| `app/lib/api-client.ts` | Cliente centralizado de fetch al API Laravel respetando formato `{ data, message, errors }` y adjuntando token JWT via `cookies()` en Server Components/Actions. | RF-6 (navegación), principio #6 de constitution.md |
| `app/metadata.ts` | Metadata SEO por ruta: títulos y descripciones para `/`, `/courses`, `/escuela`. | RNF-6 |

## 2. Funciones lógicas

| Función | Descripción | RFs | Decisión técnica |
|---------|-------------|-----|------------------|
| `obtenerLogo()` | Retorna la ruta `/logo.svg` desde `public/`. No realiza fetch. | RF-1 | Asset estático, sin dependencia de API. |
| `construirNavbarProps()` | Construye el objeto de props para `navbar.tsx`: `{ logoSrc, links }` donde `links` es `['Registrarse', 'Iniciar Sesión']` por defecto (modo público). | RF-1, RF-4 | Props puros; si en futuro hay auth, se pasan distintos `links`. |
| `mostrarDesplegable()` | Controla apertura/cerrado del menú móvil usando `useState` en un `Client Component` wrapper (`MobileMenuTrigger`). El menú en sí sigue siendo `Server Component` que recibe `links` como props. | RF-8, RF-12 | Arquitectura Server Components first: el toggle necesita estado, pero el contenido del menú permanece server. |
| `cerrarMenuAlClicFuera(menuRef, onClose)` | Registra un listener de `pointerdown` en `document` (y un `keydown` para `Escape`) que cierra el menú móvil cuando la interacción ocurre fuera del contenedor referenciado por `menuRef`. | RF-17 | Se implementa dentro del Client Component hoja con `useRef` + `useEffect`; el cleanup remueve los listeners. Alternativa descartada: cerrar solo con un segundo clic en el botón (no cumple "clic fuera"). |
| `añadirIcono(iconName)` | Retiene el nombre del ícono de la librería elegida (ej. `Heroicons/User`) y retorna el JSX correspondiente con `aria-label`. | RF-11 | Se elegirá Heroicons por ser la opción más común en ecosistema Tailwind. |
| `formatoYear()` | Retorna `new Date().getFullYear()` para el footer. | RNF-7 | Evita hardcodear 2026; se actualiza automáticamente cada año. |
| `construirMetadata(ruta)` | Genera `title` y `description` para SEO según la ruta activa (`/`, `/courses`, `/escuela`). | RNF-6 | Usa `next/head` en `app/home/page.tsx`. |

## 3. Decisiones técnicas justificadas (respeto a constitution.md)

### 3.1. Server Components first (Principio #5)
- **Decisión**: Toda la UI de la pantalla de inicio (`navbar.tsx`, `home/page.tsx`, `footer.tsx`) es **Server Component** por defecto.
- **Justificación**: Constitución principio #5: "Usar Server Components por defecto. Agregar `'use client'` únicamente cuando el componente requiera interactividad de usuario (`useState`, `onClick`)."
- **Implicación**: El menú hamburguesa toggle usará un `Client Component` mínimo (`MobileMenuTrigger`) para el `useState` de apertura/cerrado, pero el contenido del menú permanecerá como `Server Component` que recibe props.

### 3.2. Separación de capas (Principio #3)
- **Decisión**: 
  - `/app/ui/` → componentes de presentación puros (navbar, footer, icons).
  - `/app/home/` → página principal (Server Component).
  - `/app/lib/` → lógica de red (api-client.ts), helpers (reduced-motion).
- **Justificación**: Constitución principio #3: "Rutas en `/app`, componentes de UI puros en `/app/ui`, lógica de red y tipos en `/app/lib`."

### 3.3. API Centralizada y JWT (Principio #6)
- **Decisión**: El cliente de API en `/app/lib/api-client.ts` usará `cookies()` de `next/headers` para leer el token en Server Components, y se inyectará el header `Authorization: Bearer <token>` en cada petición. En Client Components, se usará un interceptor async o contexto.
- **Justificación**: Constitución principio #6: "Integración Laravel en `/app/lib/api`; respuestas `{ data, message, errors }` uniformes." Aunque la pantalla de inicio es pública, el cliente está listo para cuándo se implemente auth.

### 3.7. Librería de iconos gratuita (RF-11)
- **Decisión**: Elegiremos **Heroicons** (versión gratuita) e instalaremos via `npm i heroicons`. Los iconos se importarán como componentes React `<HeroIcons.UserLeft />` etc.
- **Justificación**: Heroicons es la librería oficial de Tailwind, gratuita, con gran variedad y buena accesibilidad. Se evitará Font Awesome por su versión gratuita limitada y posibles problemas de licencias. Boxicons es alternativa, pero Heroicons tiene mejor integración con Tailwind v4.

### 3.8. Tailwind CSS v4 (RNF-8)
- **Decisión**: El proyecto ya usa Tailwind v4 (según package.json). Los estilos en los componentes deben usar la sintaxis de v4: `transition`, `aspect-ratio`, directivas `@layer`. No se deben importar estilos de v3 ni usar `container` depreciado.
- **Justificación**: Constitución principio #9: "Manejo estándar de datos y fechas" (por analogía, usar sintaxis actual del stack).

### 3.6. Accesibilidad y prefers-reduced-motion (RNF-5, RNF-9)
- **Decisión**: 
  - Los contrastes de color cumplirán mínimo 4.5:1 usando los tokens `--color-texto-principal` sobre `--color-fondo-app` etc.
  - Las animaciones por defecto serán suaves. Cuando el usuario tenga `prefers-reduced-motion: reduce` en el SO, las animaciones se eliminarán usando `@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }`.
- **Justificación**: Constitución principio #9: "Manejo estándar de datos y fechas" (por analogía, manejo estándar de accesibilidad). RNF-5 y RNF-9 cubren esto.

### 3.9. Layout de la barra de navegación y cierre del menú móvil (RF-14 a RF-18)
- **Decisión**:
  - La navbar mantiene `position: fixed`; en vista móvil pasa a una **sola fila** (logo a la izquierda, hamburguesa a la derecha) y reduce su altura (logo `h-8`, `py-2`), de modo que no tape el contenido.
  - El contenedor interno se centra con `mx-auto` y usa `w-[85%] md:w-[70%]`; en escritorio se conserva la separación actual (`justify-between`) entre el logo y los enlaces.
  - El logo (sin el texto "EET N° 3100" visible) enlaza a `/home`.
  - El menú móvil se cierra al hacer clic fuera de él (y con `Escape`).
- **Justificación**: Constitución #5 (Client Component hoja solo cuando hace falta interactividad) y RF-15/RF-18: se pidió conservar el layout de escritorio (70 %, separación actual) y corregir la vista móvil (85 %, una fila, sin tapar contenido).
- **Alternativa descartada**: pasar la navbar a `sticky` para que ocupe espacio en el flujo y nunca tape el contenido. Se descarta porque obliga a quitar el offset (`pt-24`/`pt-28`) de todas las vistas y altera el diseño de escritorio que se pidió conservar.

## 4. Estrategia de tests

Dado que esta es una pantalla pública estática con pocos componentes interactivos, la estrategia de tests se enfocará en:

| Tipo | Herramienta | Qué cubre | RFs |
|------|-------------|-----------|-----|
| Unitarios | `jest` o `vitest` | Funciones auxiliares: `formatoYear()`, `construirNavbarProps()`, `mostrarDesplegable()`. | RF-9, RF-11 |
| Componentes | `@testing-library/react` + `@testing-library/jest-dom` | `navbar.tsx`: renderiza logo y links; `home/page.tsx`: renderiza hero y footer; `mobile-menu.tsx`: abre/ciere menú. | RF-1, RF-2, RF-8, RF-12 |
| Componentes (cambio 2026-10-21) | `@testing-library/react` + `jsdom` | `navbar.tsx`: el logo enlaza a `/home`, no renderiza el texto "EET N° 3100" y el contenedor aplica 85 %/70 %; `mobile-menu-toggle.tsx`: el menú se cierra al hacer `pointerdown` fuera del contenedor y con `Escape`. | RF-14, RF-16, RF-17, RF-18 |
| Responsive / no solapamiento | Verificación manual o Playwright | En 320/375/768/1024 px la navbar es de una sola fila, no tapa el contenido y el menú cierra al clic fuera. | RF-15, RF-18, RNF-5 |
| Integridad de builds | `pnpm lint`, `pnpm type-check`, `pnpm build` | No hay errores de TypeScript, ESLint pasa, `next build` sin errores. | Definición de Done item [ ] |
| Accesibilidad | `axe-js` (en CI o local) | Contraste de colores, `aria-label` en iconos, foco visible. | RNF-5, RNF-9 |
| SEO metadata | Validación manual o `next/fixtures` | `title` y `description` correctos por ruta. | RNF-6 |

**Nota**: Dado que la pantalla de inicio no tiene lógica de auth compleja ni conectividad a base de datos propia, los tests se enfocarán en renderizado, accesibilidad y consistencia de la UI, no en lógica de negocio.

## 5. Validación contra constitution.md

| Principio | Cumplimiento | Comentario |
|-----------|--------------|------------|
| #1 SDD Prioridad | ✅ | Spec creada tras definir contexto, usuarios, RF en EARS, casos límite, fuera de alcance. |
| #2 TypeScript Estricto | ✅ | Todos los componentes tendrán tipos definidos; `app/lib/api-client.ts` usará `ApiResponse<T>`. |
| #3 Separación de Capas | ✅ | `/app/ui`, `/app/home`, `/app/lib` bien definidos. |
| #4 Pureza Visual UI | ✅ | Componentes de UI sin `fetch` directo; reciben props. |
| #5 Server Components first | ✅ | UI es Server Component por defecto; toggle menú usa `useState` en hijo `Client Component`. |
| #6 API Centralizada | ✅ | `api-client.ts` preparado, aunque pantalla sea pública. |
| #7 Consistencia Lingüística | ✅ | RF en español, nombres en español, términos técnicos consistentes. |
| #8 Restricción de Dependencias | ✅ | Solo Heroicons (librería gratuita); sin patrones v3. |
| #9 Manejo Estándar de Datos y Fechas | ✅ | `formatoYear()`, `prefers-reduced-motion`, timestamps consistentes. |
| #10 Planificación y Verificación | ✅ | Definition of Done con checklist; tests de lint/build/accesibilidad cubiertos. |

## 5. Estado y próximos pasos

- **Estado actual**: Spec en `aprobada` — T1-T7 implementadas; RF-14 a RF-18 aprobados el 2026-10-21 y pendientes de implementación (layout de la navbar, enlace del logo y cierre del menú móvil).
- **Deuda detectada**: este plan cita `app/ui/mobile-menu.tsx` y Heroicons, mientras el código real usa `app/ui/mobile-menu-toggle.tsx` y SVGs propios en `public/icons/`.
- **Próximo paso**: Ejecutar `/sdd-implement` una tarea por vez (T8 a T12).
