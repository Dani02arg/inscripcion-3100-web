---
name: home-page-tasks
description: Tareas pequeñas y verificables para la spec 001-home-page
---
# Tasks 001 — Pantalla de Inicio

**Estado:** T1–T12 **realizadas** (spec original + T8–T12 del cambio 2026-10-21). El cambio aprobado el 2026-10-21 (RF-14 a RF-18) está completo; quedan registradas dos desviaciones preexistentes ajenas a la navbar (contraste de texto secundario del hero y metadata de `/home`) para una spec de cambio.

## Leyenda
- **RF**: Requisito funcional cubierto por la tarea.
- **Hecho cuando:**: Condición verificable para marcar la tarea como completa.
- **Duración estimada**: Máximo 20-30 minutos por tarea.
- **Orden**: Tareas en orden de dependencia (primero las que no dependen de otras).

---

## Tareas

### ✅ T1. Configurar estructura de carpetas y archivos base
- **RF**: Estructura de proyecto consistente con constitution.md (separación de capas).
- **Hecho cuando**: Existen las carpetas `app/ui/`, `app/home/`, `app/lib/` (o archivos clave en ellas).
- **Hecho**: ✅ Carpetas `app/ui/`, `app/home/`, `app/lib/` creadas. Archivos `app/ui/navbar.tsx`, `app/home/page.tsx` existen. `app/globals.css` tiene tokens institucionales definidos.
- **Duración estimada**: 10 min

### ✅ T2. Crear navbar.tsx con estructura base Server Component y colores del design-system
- **RF**: RF-1 (logo institucional a la izquierda, links "Registrarse"/"Iniciar Sesión" a la derecha), RF-2 (vista móvil: hamburguesa a la derecha, logo centro), RF-8 (menú desplegable con opciones).
- **Hecho cuando**: 
  - `app/ui/navbar.tsx` es un Server Component que importa `MobileMenuToggle`.
  - Logo institucional PNG (`/logo.png`) a la izquierda usando `<img src="/logo.png" alt="Logo EET 3100" />`.
  - Links "Registrarse" e "Iniciar Sesión" a la derecha en desktop (`hidden md:flex`).
  - Menú hamburguesa a la derecha en móvil (`block md:hidden`).
  - Colores usan tokens `var(--color-azul-institucional)`, `var(--color-texto-principal)`, `var(--color-texto-secundario)`, `var(--color-borde-input)`, `var(--color-borde-focus)`.
- **Hecho**: ✅ Navbar creada con colores del design-system, logo PNG, y MobileMenuToggle integrado.
- **Duración estimada**: 20 min

### ✅ T3. Crear componente móvil del menú hamburguesa (MobileMenuToggle)
- **RF**: RF-8 (menú hamburguesa móvil con opciones específicas).
- **Hecho cuando**: 
  - `app/ui/mobile-menu-toggle.tsx` creado como Client Component (`'use client'`).
  - Usa `useState` para toggle de apertura/cerrado.
  - Al clickar el ícono de hamburguesa, el menú se muestra/oculta.
  - El menú desplegable aparece por debajo de la navbar con las dos opciones.
  - Colores del design-system aplicados.
- **Hecho**: ✅ MobileMenuToggle creado con estados hover, colores del design-system y accesibilidad (aria-label).
- **Duración estimada**: 15 min

### ✅ T4. Crear página principal home/page.tsx con navbar, hero, botones y footer
- **RF**: RF-5 (ver cursos → /courses), RF-6 (Ir a escuela → https://tecnicadelaindia.edu.ar/), RF-7 (Facebook → https://facebook.com/), RF-10 (colores tokens), RNF-7 (ancho 60-70%).
- **Hecho cuando**: 
  - `app/home/page.tsx` importa `Navbar` de `../ui/navbar`.
  - El área hero muestra mensaje de bienvenida institucional.
  - Los 4 botones de acción se renderizan correctamente con efectos hover:
    1. "Iniciar sesión" → enlace a `/login`.
    2. "Registrarse" → enlace a `/register`.
    3. "Ver cursos" → enlace a `/courses`.
    4. "Institución" → nuevo pestaña a `https://tecnicadelaindia.edu.ar/`.
  - Botones en fila horizontal en desktop, columna vertical en móvil.
  - Footer con texto "EET 3100 REPUBLICA DE LA INDIA" centrado, año dinámico, sección "DESARROLLADORES:" con enlaces a LinkedIn y Portfolio.
  - Ancho del contenido: 60-70% centrado (`max-w-[70%] mx-auto`).
- **Hecho**: ✅ Página principal creada con navbar importada, hero, 4 botones con hover, footer reestructurado, ancho 70%.
- **Duración estimada**: 25 min

### ✅ T5. Crear cliente API centralizado (api-client.ts)
- **RF**: Principio #6 de constitution.md (API centralizada `{ data, message, errors }`).
- **Hecho cuando**: `app/lib/api-client.ts` creado con:
  - Interfaz `ApiResponse<T>` con formato `{ data, message, errors }`.
  - Función `fetchAPI(url, options)` que lee token JWT usando `cookies()` de `next/headers`.
  - Header `Authorization: Bearer <token>` adjuntado automáticamente.
  - Manejo de try/catch para errores de red.
  - Códigos de estado HTTP mapeados: 401, 403, 422, 500.
  - Funciones `isAuthenticated()`, `getToken()`, `logout()` exportadas.
- **Hecho**: ✅ api-client.ts creado y compilando correctamente.
- **Duración estimada**: 20 min

### ✅ T6. Agregar metadata SEO por ruta (metadata.ts)
- **RF**: RNF-6 (SEO básico: metadata por ruta).
- **Hecho cuando**: `app/metadata.ts` creado con metadatos para rutas `/`, `/courses`, `/escuela`.
- **Hecho**: ✅ metadata.ts creado con título, descripción y keywords institucionales.
- **Duración estimada**: 10 min

### ✅ T7. Verificar builds y accesibilidad básica
- **RNF**: RNF-1 (Server Components), RNF-5 (accesibilidad), RNF-6 (SEO), RNF-4 (carga).
- **Hecho cuando**: `next build` pasa sin errores de TypeScript. Páginas estáticas prerenderizadas correctamente.
- **Hecho**: ✅ Build de Next.js completado exitosamente sin errores. Todas las rutas estáticas generadas.
- **Duración estimada**: 20 min

---

## Tareas — cambio aprobado 2026-10-21 (RF-14 a RF-18)

### ✅ T8. Ajustar layout de la navbar (fila única, logo a la izquierda, sin texto y ancho 85 %/70 %)
- **RF**: RF-14, RF-15, RF-18.
- **Hecho cuando**:
  - En móvil la navbar muestra una sola fila con el logo a la izquierda y el menú hamburguesa a la derecha, con altura reducida.
  - En escritorio se conserva el 70 % de ancho centrado y la separación actual entre el logo y los enlaces.
  - En móvil el contenedor ocupa el 85 % de ancho, centrado.
  - No se muestra el texto "EET N° 3100" junto al logo.
- **Hecho**: ✅ `app/ui/navbar.tsx`: contenedor `mx-auto w-[85%] px-2 py-2 md:w-[70%] md:px-6 md:py-4`; fila única (`flex items-center justify-between gap-4`, sin `flex-col`); logo `h-8 md:h-10` a la izquierda; hamburguesa a la derecha (`flex items-center md:hidden`); sin texto junto al logo. Verificación CDP (Brave headless) a 320/375/768/1024/1440 px: ancho 85 % en móvil y 70 % en escritorio (69 % del viewport por la barra de scroll), alto 57 px en móvil / 73 px en escritorio, fila única, logo en el borde izquierdo y hamburguesa en el derecho, sin desbordamiento horizontal; `navBottom` (57/73 px) por encima del primer contenido (96 px). `tsc --noEmit` limpio, `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`), 23/23 tests nativos y `pnpm build` en verde.
- **Duración estimada**: 20 min

### ✅ T9. Evitar que la navbar tape el contenido
- **RF**: RF-15.
- **Hecho cuando**: en 320/375/768 px el contenido (hero y primeros elementos) queda visible por debajo de la navbar, sin quedar oculto detrás de ella.
- **Hecho**: ✅ Sin cambios de código: el ajuste de T8 ya dejó la navbar (57 px en móvil / 73 px en escritorio) por debajo del offset de cada vista. Verificación CDP (Brave headless) a 320/375/768/1024 px en `/home` (contenido en 96 px → holgura 39/23 px) y `/register` (contenido en 112 px → holgura 55/39 px): `covered: false` en todos los casos y 0 elementos de texto de `main` solapados con la navbar (escaneo de oclusión). `tsc --noEmit` limpio y `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`).
- **Duración estimada**: 15 min

### ✅ T10. Enlazar el logo institucional a `/home`
- **RF**: RF-16.
- **Hecho cuando**: al hacer clic en el logo de la navbar se navega a `/home` (y no a `/`).
- **Hecho**: ✅ `app/ui/navbar.tsx`: el `<Link>` del logo pasó de `href="/"` a `href="/home"`. Verificación CDP (Brave headless): desde `/register` el clic en el logo navega a `/home` en móvil (320 px) y escritorio (1024 px); el texto del hero es el de la home; desde `/home` el `href` es `/home`; y con foco en el logo + Enter también navega a `/home`. `tsc --noEmit` limpio, `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`), 23/23 tests nativos y `pnpm build` en verde.
- **Duración estimada**: 10 min

### ✅ T11. Cerrar el menú móvil al hacer clic fuera
- **RF**: RF-17 (y RF-12 en su cláusula "el menú desplegable debe aparecer por debajo de la navbar").
- **Hecho cuando**: con el menú abierto, un clic/`pointerdown` fuera de él lo cierra; el botón hamburguesa sigue abriéndolo y cerrándolo.
- **Hecho**: ✅ `app/ui/mobile-menu-toggle.tsx`: `useRef` sobre un contenedor `contents` que envuelve el botón y el desplegable + `useEffect` que con el menú abierto registra `pointerdown` en `document` (si el objetivo queda fuera del contenedor, cierra) y `keydown` para `Escape` (cierre, según `plan.md` §2/§3.9); los listeners se limpian al cerrar/desmontar. Además se agregó `top-full` al desplegable: se verificó que **antes** ya se renderizaba encima de la navbar (`top: -31` con las clases originales, caso B del experimento), lo que impedía el criterio "el botón hamburguesa sigue abriéndolo y cerrándolo" (al reclickear el botón se activaba el enlace "Iniciar Sesión" y navegaba a `/login`); con `top-full` el desplegable queda debajo (`top: 64` ≥ `navBottom: 57`), lo que además cumple RF-12. Verificación CDP (Brave headless) con eventos de mouse reales a 375 px: abrir con el botón ✅; `pointerdown` fuera (60, 300) cierra ✅; `Escape` cierra ✅; abrir + reclick en el botón cierra (toggle) ✅; `pointerdown` dentro del desplegable (127, 68, sobre el propio contenedor) **no** cierra ✅; la URL permanece en `/home`. `tsc --noEmit` limpio, `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`), 23/23 tests nativos y `pnpm build` en verde.
- **Duración estimada**: 20 min

### ✅ T12. Verificación final de la spec 001
- **RNF**: RNF-4, RNF-5; RF-14 a RF-18.
- **Hecho cuando**: `pnpm lint`, `tsc --noEmit` y `pnpm build` pasan sin errores y la verificación responsive (320/375/768/1024) confirma fila única, ancho 85 %/70 %, logo → `/home` y cierre del menú al clic fuera.
- **Hecho**: ✅ Sin cambios de código. `npx tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`); `pnpm build` en verde (`/`, `/home`, `/register` prerenderizadas). Verificación CDP (Brave headless) contra el **build de producción** servido en `:3101`, a 320/375/768/1024 px: fila única en todos los anchos; ancho del contenedor 85 % del nav en 320/375 px (272/320 y 319/375) y 70 % en 768/1024 px (527/753 y 706/1009); alto 57 px móvil / 73 px escritorio; logo a la izquierda (8 px móvil, 24 px escritorio), hamburguesa a la derecha (8 px) y enlaces `Iniciar Sesión`/`Registrarse` visibles con hamburguesa oculta desde 768 px; sin desbordamiento horizontal y 0 textos de `main` ocluidos por la navbar (RF-15, RF-18); el logo navega a `/home` desde `/register` en 375 y 1024 px (RF-16); en móvil el menú se abre con el botón (clic real) y se cierra al hacer clic fuera, desplegándose por debajo de la navbar (RF-17, RF-12). RNF-4: en el build de producción TTFB 11 ms, FCP 100 ms y `load` 98 ms (< 2 s). RNF-5: `aria-label` en los tres iconos del navbar y en el botón hamburguesa (con `aria-expanded`), anillo de foco visible confirmado con Tab en los enlaces del navbar, contraste 12.88:1 en los enlaces del navbar y 10.42:1 en el `h1`, y 0 `console.error` al cargar. Cubre los ítems del DoD "`pnpm lint` y `pnpm type-check` sin errores", "No hay `console.error` en la consola" y "`next build` pasa sin errores".
- **Desviaciones preexistentes detectadas (fuera del alcance de RF-14 a RF-18, no se modifican en T12)**: (1) el párrafo secundario del hero (`text-texto-secundario` = `#7F8C8D` sobre `--color-fondo-app` = `#F8F9FA`) da **3.30:1**, por debajo del mínimo 4.5:1 de RNF-5 (proviene de T4, no de la navbar); (2) `/home` no aplica metadata propia —el título servido es "Create Next App" y `app/metadata.ts` no está importado por ninguna ruta— por lo que RNF-6 no está realmente cumplido. Ambas quedan registradas para una spec de cambio.
- **Duración estimada**: 25 min

## Orden de dependencia
1. **T1** → Estructura base (ninguna dependencia)
2. **T2** → Navbar (depende de T1)
3. **T3** → Menú móvil (depende de T2)
4. **T4** → Página principal (depende de T2 + T3)
5. **T5** → Cliente API (independiente, puede paralelizarse)
6. **T6** → Metadata SEO (depende levemente de T4)
7. **T7** → Build y verificación (depende de T1-T6)
8. **T8** → Layout navbar (depende de T2)
9. **T9** → Contenido no tapado (depende de T8)
10. **T10** → Logo → `/home` (depende de T2)
11. **T11** → Cierre del menú al clic fuera (depende de T3)
12. **T12** → Verificación final (depende de T8-T11)

## Critical Path
T1 → T2 → T3 → T4 → T7 (validación final)
T5 y T6 pueden ejecutarse en paralelo con T2-T4.

Cambio 2026-10-21: T8 → T9 → T12 (T10 y T11 pueden paralelizarse con T8-T9).

---
