---
name: nextjs-app-router-architecture
description: Fuerza la separación estricta de capas (/app para rutas, /app/ui para componentes visuales puros, /app/lib para red/helpers), Server Components por defecto y restringe 'use client' a componentes de hoja interactivos.
---

# Next.js App Router Architecture

Este skill obliga al agente a respetar la separación estricta de capas y el modelo Server Components First de Next.js App Router.

## Capas obligatorias

1. **Rutas**: exclusivamente en `/app` (App Router). No se crean rutas fuera de `/app`.
2. **UI pura**: componentes de presentación en `/app/ui`. Reciben datos únicamente mediante `props`. Prohibido `fetch` o llamadas HTTP directas dentro de `/app/ui`.
3. **Red y helpers**: llamadas de red, helpers y tipos de integración en `/app/lib` (y `/app/lib/api` para la API Laravel).

## Server Components vs Client Components

- Por defecto, todos los componentes son **Server Components**.
- Agregar `'use client'` **únicamente** en componentes de hoja que requieran interactividad directa del usuario (`useState`, `onClick`, gestores de eventos, etc.).
- No envolver páginas enteras ni layouts en `'use client'` salvo justificación explícita.

## Server Actions

- Las mutaciones de datos desde componentes de cliente deben realizarse a través de **Server Actions** ubicados en `/app/lib/actions`.
- Estos archivos deben llevar la directiva `'use server'` en la parte superior.

## Gestión de caché

- Usar `revalidatePath` o `revalidateTag` dentro de los Server Actions o rutas API tras cualquier mutación exitosa para asegurar que la UI refleje datos actualizados.

## Estados de carga y error

- Utilizar `loading.tsx` y `error.tsx` nativos del App Router para gestionar estados asincrónicos y fallos, en lugar de usar estados de carga manuales de componentes.

## Validación antes de responder

- Revisar `docs/constitution.md` (principios 3, 4 y 5).
- Revisar `AGENTS.md` (Reglas de Arquitectura).
- Si el código propuesto viola alguna de estas reglas, detenerse, explicar la violación y solicitar corrección o aprobación explícita.

## Referencias cruzadas

- `docs/constitution.md`: Principios 3 (Separación de Capas), 4 (Pureza Visual UI), 5 (Server Components First).
- `AGENTS.md`: Reglas de Arquitectura.
- `MEMORY.md`: registrar decisiones arquitectónicas excepcionales en el historial.
