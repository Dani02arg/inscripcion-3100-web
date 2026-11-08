# docs/constitution.md — EET N° 3100 (Principios de Gobernanza)

1. **SDD Prioridad Absoluta**: Sin spec activa en `specs/` no se codifica; si falta definición, detenerse y preguntar.
2. **TypeScript Estricto**: Tipado obligatorio. Prohibido `any`, castings inseguros y suprimir errores de tipos.
3. **Separación de Capas**: Rutas en `/app`, UI pura en `/app/ui`, red/helpers en `/app/lib`.
4. **Pureza Visual UI**: Componentes en `/app/ui` reciben datos solo por `props`; sin `fetch` ni HTTP directo.
5. **Server Components First**: Por defecto Server Components; `'use client'` solo en hojas con `useState`/eventos de usuario.
6. **API Centralizada**: Integración Laravel en `/app/lib/api`; respuestas `{ data, message, errors }` uniformes.
7. **Consistencia Lingüística**: Código, tipos, interfaces y rutas en inglés; comentarios y textos UI en español.
8. **Restricción de Dependencias**: Sin paquetes externos sin aprobación previa explícita del usuario.
9. **Datos y Fechas Estándar**: Fechas ISO `YYYY-MM-DD`; estados con patrones inmutables.
10. **Planificación y Verificación**: Planificar antes de codificar; comprobar `pnpm build` y `pnpm lint` en verde.
11. **Next.js Optimizado**: Usar `next/image` y `next/font` para optimización de assets; `metadata` por ruta para SEO/Open Graph.
12. **Loading y Error Boundaries**: Usar `loading.tsx` y `error.tsx` por segmento de ruta para Suspense y límites de error.
13. **Caché y Revalidación**: Configurar adecuadamente el caché de Next.js (ISR, revalidación) para datos dinámicos.
14. **Imágenes y Assets**: Siempre informar al desarrollador qué imágenes agregar, en qué carpeta (`public/` o `app/[ruta]/`), breve descripción visual y nombre ideal del archivo.
15. **Tailwind v4 en Markdown**: Tailwind escanea TODOS los archivos, incluyendo `.md`. Queda estrictamente prohibido escribir clases utilitarias con sintaxis insegura y placeholders en archivos de memoria, planes, specs o logs. Si necesitas documentar una clase incompleta, usa paréntesis normales `bg-(var(--color-XXX))` o descríbela en lenguaje natural.
15. **Consistencia Lingüística**: Todo el código, interfaces, tipos, variables y rutas deben escribirse estrictamente en **inglés**. Los comentarios de código y textos legibles de la interfaz de usuario en **español**.
