---
description: Next.js · Crea un componente puro de interfaz en /app/ui (Client o Server)
agent: build
---
Crea un componente de React en `/app/ui/$1.tsx` basado en los tokens de nuestra skill `design-system`.
Reglas:
1. Por defecto, hazlo un Server Component. 
2. Solo añade `'use client'` si el componente requiere `useState`, `useEffect` o eventos de usuario (`onClick`, `onChange`).
3. Usa Tailwind CSS para los estilos.
4. Define siempre una `interface` TypeScript para las `props`.
