---
name: home-page-icons-plan
description: Plan técnico de la spec 002-icons - Iconos para navbar, footer y botones de acción
---
# Plan 002 — Iconos para Navbar, Footer y Botones de Acción

## 1. Archivos a crear

| Archivo | Propósito | RFs cubiertas |
|---------|-----------|---------------|
| `app/ui/icon-link.tsx` | Componente Server que renderiza un enlace `<a>` con icono SVG a la izquierda del texto | RF-3, RF-4 |
| `app/ui/icon-button.tsx` | Componente Server que renderiza un botón con icono SVG a la izquierda del texto | RF-5, RF-6, RF-7 |
| `app/ui/navbar.tsx` | (Modificar) Integrar `IconLink` para las rutas de navegación | RF-1, RF-2, RF-3 |
| `app/home/page.tsx` | (Modificar) Integrar `IconButton` en los botones de acción del hero | RF-5, RF-6, RF-7 |

## 2. Funciones lógicas

| Función | Descripción | RFs | Decisión técnica |
|---------|-------------|-----|------------------|
| `obtenerRutaIcono(nombre)` | Retorna la ruta `/public/icons/${nombre}.svg` | RF-1 a RF-5 | Centraliza la ubicación de los archivos SVG |
| `IconLink({ icono, texto, ruta })` | Renderiza un enlace `<a>` con `<img src={`/public/icons/${icono}.svg`} />` a la izquierda del texto | RF-3, RF-4 | Server Component puro, no usa `'use client'` |
| `IconButton({ icono, texto, ruta, variante })` | Renderiza un botón `<a>` con icono SVG a la izquierda y estilos de Tailwind | RF-5, RF-6, RF-7 | Server Component, usa clases Tailwind con valores hex directos |

## 3. Decisiones técnicas justificadas

| Decisión | Justificación | Principio de constitution.md |
|----------|---------------|------------------------------|
| Server Components por defecto | `IconLink` y `IconButton` son Server Components por defecto. `'use client'` solo si se necesita interactividad de usuario. | Principio 5 |
| Componentes puros en `/app/ui/` | Los componentes reciben datos vía `props`; no realizan `fetch` ni llamadas HTTP directas. | Principio 4 |
| Rutas estáticas en `/public/icons/` | Los archivos SVG se encuentran en `public/icons/` y se acceden directamente por ruta, sin llamadas de red. | Principio 6 (no aplica a assets estáticos), Principio 3 |
| Clases Tailwind con valores hex | Se usan clases como `bg-azul-institucional`, `text-texto-principal`, `bg-superficie` en lugar de clases con `var(--color-XXX)` entre corchetes para evitar problemas con Turbopack y Turbopack CSS. | Principio 5, Principio 4 |

## 4. Estrategia de tests

| Tipo | Herramienta | Qué cubre | RFs |
|------|-------------|-----------|-----|
| Unitarios | `jest` o `vitest` | Función `obtenerRutaIcono(nombre)` retorna la ruta correcta | RF-1 a RF-5 |
| Componentes | `@testing-library/react` | `IconLink` y `IconButton` renderizan icono + texto correctamente | RF-3, RF-4, RF-5 |
| Build | `pnpm build` | No hay errores de TypeScript, ESLint ni advertencias de CSS | Definición de Done |

## 5. Verificación contra docs/constitution.md

| Principio | Cumplimiento | Comentario |
|-----------|--------------|------------|
| #1 SDD Prioridad | ✅ | Spec creada antes de planificar |
| #2 TypeScript Estricto | ✅ | Todos los componentes tendrán tipos definidos |
| #3 Separación de Capas | ✅ | `/app/ui` para componentes de presentación, `/app/lib` para lógica de red |
| #4 Pureza Visual UI | ✅ | Componentes reciben datos por `props`, sin `fetch` directo |
| #5 Server Components First | ✅ | Server Components por defecto; `'use client'` solo si es necesario |
| #6 API Centralizada | ✅ | No aplica directamente (son assets estáticos) |
| #7 Consistencia Lingüística | ✅ | Código en inglés, comentarios en español |
| #8 Restricción de Dependencias | ✅ | Solo `next/image`, `next/link`, React |
| #9 Datos y Fechas Estándar | ✅ | No aplica directamente |
| #10 Planificación y Verificación | ✅ | Plan creado antes de implementar; `pnpm build` verificado |

## 6. Estado y próximos pasos

- **Estado actual**: Spec `specs/002-icons/spec.md` aprobada con 8 RF y 5 RNF.
- **Próximo paso**: Ejecutar `/sdd-tasks` para generar `specs/002-icons/tasks.md` con tareas pequeñas en orden de dependencia.
- **Luego**: Ejecutar `/sdd-implement` una tarea por vez, comenzando por crear `app/ui/icon-link.tsx`.