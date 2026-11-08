---
name: home-page-icons-tasks
description: Tareas pequeñas y verificables para la spec 002-icons
---
# Tasks 002 — Iconos para Navbar, Footer y Botones de Acción

## Leyenda
- **RF**: Requisito funcional cubierto por la tarea.
- **Hecho cuando**: Condición verificable para marcar la tarea como completa.
- **Duración estimada**: Máximo 20-30 minutos por tarea.
- **Orden**: Tareas en orden de dependencia.

---

## Tareas

### T1. Crear componente IconLink (Server Component)
- **RF**: RF-3 (enlaces navbar con icono), RF-4 (desarrolladores con icono), RF-7 (colores del design-system)
- **Hecho cuando**: 
  - `app/ui/icon-link.tsx` existe y es un Server Component (sin `'use client'`)
  - Recibe props `href`, `icon` (nombre del archivo SVG sin extensión), `label` (texto)
  - Renderiza `<a href={href}>` con `<img src={`/public/icons/${icon}.svg`} alt={`Icono ${label}`} />` a la izquierda del texto
  - Aplica clases `text-texto-principal` y `hover:text-azul-institucional` por defecto
  - El ícono tiene `aria-label` descriptivo
- **Duración estimada**: 20 min

### T2. Crear componente IconButton (Server Component) ✅
- **RF**: RF-5 (botones hero con icono), RF-6 (tamaño 5-8% más alto), RF-7 (colores del design-system)
- **Hecho cuando**: 
  - `app/ui/icon-button.tsx` existe y es un Server Component (sin `'use client'`)
  - Recibe props `href`, `icon`, `label`, `variant` (opcional: 'azul' | 'naranja' | 'superficie')
  - Renderiza `<a href={href}>` con `<img src={`/public/icons/${icon}.svg`} />` a la izquierda del texto
  - Tamaño del icono es 5-8% más alto que el texto (ej. `h-5 w-5` si el texto es `text-base`)
  - Aplica colores del design-system (`bg-azul-institucional`, `bg-naranja-acento`, `bg-superficie`, etc.)
- **Duración estimada**: 25 min

### T3. Integrar IconLink en navbar.tsx ✅
- **RF**: RF-1 (logo institucional), RF-2 (menú hamburguesa con icono), RF-3 (enlaces desktop con icono), RF-7 (color según contexto), RF-8 (fallback de icono existente)
- **Hecho cuando**: 
  - `app/ui/navbar.tsx` importa e usa `IconLink` para los enlaces "Iniciar Sesión" e "Registrarse" (los dos enlaces de la navbar según el DoD de la spec)
  - El logo institucional usa `public/logo.png` (no necesita icono separado)
  - El menú hamburguesa móvil usa el icono `ico-burger-menu.svg` (nombre real existente, RF-8)
  - Todos los iconos están a la izquierda del texto
  - Colores usan tokens de `globals.css` (no valores hex fijos)
- **Duración estimada**: 20 min

### T4. Integrar IconButton en home/page.tsx ✅
- **RF**: RF-5 (botones de la página de inicio con icono), RF-6 (tamaño 5-8% más alto), RF-7 (colores del design-system)
- **Hecho cuando**: 
  - `app/home/page.tsx` importa e usa `IconButton` para los 4 botones del hero
  - Cada botón tiene su icono correspondiente a la izquierda del texto (`ico-login`, `ico-register`, `ico-course`, `ico-web`)
  - Los botones están apilados verticalmente (`flex flex-col gap-4`)
  - Colores usan clases de Tailwind v4 (`bg-azul-institucional`, `bg-naranja-acento`, `bg-superficie`)
- **Duración estimada**: 20 min

### T5. Verificar build y lint ✅
- **RF**: RF-1 a RF-8 (verificación técnica completa)
- **Hecho cuando**: 
  - `pnpm lint` pasa sin errores
  - `pnpm type-check` (o `npx tsc --noEmit`) pasa sin errores
  - `pnpm build` pasa sin errores de TypeScript ni de CSS
  - No hay advertencias de Tailwind v4 relacionadas con clases entre corchetes y `var(--color-XXX)` en archivos CSS o MD
- **Resultado**: lint 0 errores (4 warnings de `<img>`), `tsc --noEmit` OK, `next build` OK sin advertencias CSS, sin `var(--color-...)` literal ni clases entre corchetes con `var(--color`.
- **Duración estimada**: 15 min

### T6. Integrar IconLink en el footer con portfolio-dev.svg ✅
- **RF**: RF-4 (desarrolladores con icono), RF-7 (color según contexto)
- **Hecho cuando**: 
  - `app/home/page.tsx` usa `IconLink` para ambos desarrolladores
  - Ambos desarrolladores muestran `portfolio-dev.svg` a la izquierda del texto
  - Se conservan los enlaces externos con `target="_blank"` y `rel="noopener noreferrer"`
- **Resultado**: lint 0 errores, `tsc --noEmit` OK, `next build` OK sin advertencias CSS.
- **Duración estimada**: 15 min

## Orden de dependencia

1. **T1** → IconLink (ninguna dependencia)
2. **T2** → IconButton (depende de T1, usa patrones similares)
3. **T3** → Navbar (depende de T1, usa IconLink)
4. **T4** → Página principal (depende de T2, usa IconButton)
5. **T5** → Build y verificación (depende de T1-T4)
6. **T6** → Footer (depende de T1, usa IconLink)

## Critical Path

T1 → T2 → T3 → T4 → T5 → T6

## Notas

- Todos los componentes de UI son Server Components por defecto (principio #5 de constitution.md).
- Los componentes reciben datos exclusivamente vía `props` (principio #4).
- Las rutas de los iconos usan `/public/icons/${nombre}.svg` (archivos estáticos, sin fetch).
- Las clases de Tailwind v4 usan valores hexadecimales directos (ej. `bg-azul-institucional`)