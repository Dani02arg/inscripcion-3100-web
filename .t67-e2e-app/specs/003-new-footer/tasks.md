---
name: new-footer-tasks
description: Tareas pequenas y verificables para la spec 003-new-footer
---
# Tasks 003 — Footer independiente y reutilizable

## Leyenda

- **RF:** Requisito funcional cubierto por la tarea.
- **Hecho cuando:** Condición verificable para marcar la tarea como completa.
- **Duración estimada:** Máximo 20-30 minutos por tarea.
- **Orden:** Tareas en orden de dependencia.

---

## Tareas

### T1. Crear el footer y la hoja del año — ✅ HECHA

- **Estado:** ✅ hecha — cubre **RF-1 a RF-14**.
- **RF:** RF-1 a RF-14
- **Hecho cuando:**
  - `app/ui/footer.tsx` existe y es un Server Component (sin `'use client'`).
  - `app/ui/copyright-year.tsx` existe como hoja cliente; es el único `'use client'` de la spec y fija el año del navegador con `useSyncExternalStore` (sin `setState` dentro de un efecto).
  - `Footer` no hace `fetch` ni HTTP directo; solo renderiza contenido estático (principio #4).
  - Renderiza tres zonas: izquierda reservada, centro institucional y derecha desarrolladores.
  - En ancho mayor o igual a 1024 px: fondo a ancho completo, contenedor interno del 90 % centrado y tres zonas de igual ancho.
  - En ancho mayor o igual a 1024 px: la zona izquierda es un área vacía reservada, sin empujar el contenido.
  - En ancho mayor o igual a 1024 px: la zona central muestra el nombre `EET 3100 REPUBLICA DE LA INDIA` en una fila y el copyright en la fila inferior, centrado.
  - En ancho mayor o igual a 1024 px: la zona derecha muestra `DESARROLLADORES:` y los dos nombres alineados a la derecha.
  - En ancho menor a 1024 px: apila en una sola columna centrada, con el bloque institucional primero y el de desarrolladores después.
  - En ancho menor a 1024 px: la zona izquierda no se representa y no deja un espacio en blanco visible.
  - El copyright usa `calcularCopyright`: `© 2026` si el año actual es 2026 o anterior; `© 2026-{año actual}` si es posterior; separador guion y símbolo literal.
  - El nombre institucional se muestra a 20 px y en negrita; el bloque de desarrolladores a 14 px como tamaño final renderizado.
  - Cada desarrollador muestra el icono a su izquierda, con el icono entre 5 % y 8 % más alto que el texto y alineado con él.
  - El icono y el nombre forman un único enlace clicable hacia el perfil, con `target="_blank"` y `rel="noopener noreferrer"`.
  - El icono se sirve con `next/image` en modo no optimizado para SVG y se marca como decorativo (texto alternativo vacío).
  - El footer expone un landmark semántico y un encabezado semántico para el bloque de desarrolladores.
  - No hay desplazamiento horizontal ni solapamientos entre 320 px y 1920 px.
- **Duración estimada:** 30 min

### T2. Integrar el footer en el layout raíz — ✅ HECHA

- **Estado:** ✅ hecha — cubre **RF-1, RF-6, RF-10, RF-11**.
- **RF:** RF-1, RF-6, RF-10, RF-11
- **Hecho cuando:**
  - `app/layout.tsx` importa y renderiza `<Footer />` dentro del `body` en columna, de modo que aparece en todas las rutas, incluidas error, 404 y autenticación.
  - El `body` conserva su estructura de columna y el footer se mantiene al final del contenido.
  - `app/home/page.tsx` ya no contiene el bloque de footer inline ni el cálculo local del año.
  - La página de inicio sigue mostrando un único footer, idéntico en contenido y distribución.
  - No queda contenido de footer duplicado.
- **Duración estimada:** 15 min

### T3. Verificar tipos, lint y build — ✅ HECHA

- **Estado:** ✅ hecha — cubre la verificación técnica de **RF-1 a RF-14**.
- **RF:** RF-1 a RF-14 (verificación técnica completa)
- **Hecho cuando:**
  - `npx tsc --noEmit` pasa sin errores.
  - `pnpm lint` no reporta errores nuevos (los avisos de imagen previos no son bloqueantes).
  - `pnpm build` finaliza sin errores de TypeScript ni advertencias de CSS o Turbopack.
  - No aparece el patrón inseguro descrito en el principio #15 (variables CSS dentro de corchetes en clases utilitarias) en archivos `.md`, `.tsx` ni `.css`.
- **Duración estimada:** 15 min

### T4. Verificar responsive y accesibilidad — ✅ HECHA

- **Estado:** ✅ hecha — cubre **RF-2 a RF-14 y RNF-1 a RNF-8** (verificación en navegador headless).
- **RF:** RF-2 a RF-14, RNF-1 a RNF-8
- **Hecho cuando:**
  - En 320, 768, 1023, 1024, 1280 y 1920 px no hay solapamientos ni desplazamiento horizontal.
  - En 1024 px exactos y hasta 1100 px se mantienen las tres zonas, con ajuste de línea si hace falta.
  - En anchos menores a 1024 px la columna única está centrada y sin el hueco de la zona izquierda.
  - Con zoom del navegador o texto ampliado al 200 % el contenido sigue legible y sin solapamientos.
  - Todos los enlaces son accesibles por teclado y muestran foco visible.
  - El orden de lectura del lector de pantalla es: nombre institucional, copyright, título de desarrolladores y cada desarrollador.
  - Los iconos no duplican los nombres en el lector de pantalla.
  - El copyright refleja el año del sistema al recargar la página.
- **Duración estimada:** 25 min

---

## Orden de dependencia

1. T1 → Footer y año (sin dependencia).
2. T2 → Integración en el layout raíz (depende de T1).
3. T3 → Tipos, lint y build (depende de T1-T2).
4. T4 → Responsive y accesibilidad (depende de T1-T2).

## Critical Path

T1 → T2 → T3 → T4

## Notas

- Los componentes de UI son Server Components por defecto; la única hoja cliente es el año del copyright (principio #5).
- Los componentes reciben datos solo por props (principio #4).
- Las rutas de los iconos usan `/icons/<archivo>.svg` (archivos estáticos, sin fetch).
- Los iconos se sirven con `next/image` en modo no optimizado para SVG (principio #11).
- El año de fundación es la constante 2026; el año actual se resuelve en el cliente.
- No se instalan dependencias nuevas (principio #8).
