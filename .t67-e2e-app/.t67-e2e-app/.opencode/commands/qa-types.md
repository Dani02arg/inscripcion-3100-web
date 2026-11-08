---
description: Next.js · Ejecuta validación estricta de TypeScript y Linting
agent: build
---
Ejecuta los siguientes comandos en la terminal sin salir de la sesión:
1. `npm run lint` (o `pnpm lint`)
2. `npx tsc --noEmit`
Reporta si hay discrepancias de tipos, especialmente en las interfaces que conectan las respuestas de Laravel (`/app/lib`) con las propiedades de los componentes (`/app/ui`). Corrige cualquier discrepancia de tipado que encuentres.
