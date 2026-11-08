---
description: Next.js · Genera una ruta (page.tsx) en el App Router
agent: build
---
Genera una nueva ruta para el panel administrativo creando el archivo `/app/$1/page.tsx`.
Reglas:
1. Debe ser un Server Component puro.
2. Si la página necesita mostrar datos iniciales, debe consumirlos aquí mismo de forma asíncrona antes de pasarlos como `props` a los componentes de UI.
3. El componente principal debe llamarse `Page` exportado por defecto.
