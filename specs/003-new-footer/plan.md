---
name: new-footer-plan
description: Plan técnico de la spec 003-new-footer - Footer independiente y reutilizable
---
# Plan 003 — Footer independiente y reutilizable

Spec de referencia: `specs/003-new-footer/spec.md` (estado: **aprobada**).

## 1. Archivos a crear/modificar

| Archivo | Acción | Propósito | RFs cubiertas |
|---------|--------|-----------|---------------|
| `app/ui/copyright-year.tsx` | Crear | Hoja cliente que resuelve el año dinámico en el navegador para que el copyright se actualice al recargar | RF-6, EC-1 |
| `app/ui/footer.tsx` | Crear | Server Component del footer con las tres zonas (izquierda reservada, centro institucional, derecha desarrolladores) | RF-1 a RF-14 |
| `app/layout.tsx` | Modificar | Renderizar `<Footer />` dentro del `body` en columna para cubrir todas las rutas, incluidas error, 404 y autenticación | RF-1 |
| `app/home/page.tsx` | Modificar | Eliminar el footer inline y el cálculo local del año; el footer pasa a ser global | RF-1, RF-6 |
| `MEMORY.md` | Modificar | Registrar que el footer es un componente independiente y global | — |

## 2. Funciones lógicas

| Función | Descripción | RFs | Decisión técnica |
|---------|-------------|-----|------------------|
| `calcularCopyright(anioFundacion: number, anioActual: number): string` | Devuelve `© 2026` si `anioActual <= anioFundacion`; `© 2026-{anioActual}` si es posterior. Separador guion y símbolo literal | RF-6, EC-6 | Función pura, sin efectos secundarios |
| `CopyrightYear()` | Hoja cliente: lee el año del navegador con `useSyncExternalStore` (instantánea del servidor = 2026, instantánea del cliente = año actual) | RF-6, EC-1 | Evita el año congelado en build y el desajuste de hidratación sin `setState` dentro de un efecto (regla `react-hooks/set-state-in-effect`) |
| `Footer()` | Server Component que arma el footer completo y delega el año a `CopyrightYear` | RF-1 a RF-14 | Server Component por defecto (principio #5) |
| `ZonaIzquierda()` | Área reservada vacía; solo se representa en escritorio | RF-3, RF-11 | `hidden lg:block` y `aria-hidden="true"`; no reserva espacio en móvil |
| `ZonaInstitucional()` | Nombre institucional en una fila y copyright en la fila inferior, centrados | RF-4, RF-6, RF-7 | `text-xl font-bold` (20 px) para el nombre |
| `ZonaDesarrolladores()` | Encabezado `DESARROLLADORES:` y los dos desarrolladores en filas separadas | RF-5, RF-7, RF-13, RF-14 | `text-sm` (14 px) como tamaño final renderizado |
| `DeveloperLink()` | Componente interno: icono a la izquierda + nombre en un único enlace externo seguro | RF-8, RF-9, RF-13 | `next/image` con `unoptimized`, `alt=""` y `aria-hidden` en el icono |

## 3. Decisiones técnicas justificadas

| Decisión | Justificación | Alternativa descartada | Principio |
|----------|---------------|------------------------|-----------|
| Footer en el layout raíz | Una sola fuente para todas las páginas (incl. error/404/autenticación) y un único cambio | Repetir `<Footer />` en cada página | RF-1, RNF-6 |
| Fondo a ancho completo con contenedor interno del 90 % centrado | Mantiene el ancho visual actual y ordena el contenido | Footer con margen lateral fijo | RF-2, decisión de clarificación |
| Breakpoint `lg` (1024 px) para apilar | Umbral acordado; por debajo se apila en una columna centrada | 768 px o 640 px | RF-10 |
| Zona izquierda solo en escritorio | Evita un espacio en blanco grande en la columna única móvil | Reservar la columna izquierda también en móvil | RF-11 |
| Nombre institucional `text-xl font-bold` | Igual al tamaño actual (20 px) | Reducirlo a `text-lg` | RF-7, respuesta de clarificación |
| Bloque de desarrolladores `text-sm` | 14 px como tamaño final renderizado en el estado base | `text-base` | RF-7, respuesta de clarificación |
| Copyright con función pura + hoja cliente | El copyright debe reflejar el año real al recargar sin desajuste de hidratación | Calcular el año en el Server Component (queda fijo en build) | RF-6, EC-1 |
| Icono con `next/image` y `unoptimized` | Cumple el uso de `next/image` sin exigir configuración del optimizador para SVG | Etiqueta `img` plana | Principio #11 |
| Icono decorativo con `alt` vacío y `aria-hidden` | Evita que el lector de pantalla repita el nombre del desarrollador | Texto alternativo con el nombre | RF-14 |
| Enlace con `target="_blank"` y `rel="noopener noreferrer"` | Apertura segura de perfiles externos | `target="_blank"` sin `rel` | RF-9 |
| Foco visible con `focus-visible` y anillo del design system | Accesibilidad por teclado | Quitar el contorno del foco | RNF-3, RF-14 |
| Clases nativas del design system | Los tokens institucionales ya están registrados como clases de Tailwind | Construir clases con variables CSS dentro de corchetes | Principio #15 |
| Sin dependencias nuevas | Solo se usan utilidades de Next.js y React | Instalar un runner de tests | Principio #8 |

## 4. Estrategia de verificación

No hay runner de tests instalado en el proyecto, por lo que la verificación es manual y técnica; automatizarla exigiría aprobar dependencias (principio #8).

| Tipo | Herramienta | Qué cubre | RFs |
|------|-------------|-----------|-----|
| Función pura | Revisión manual de los tres casos: 2026, año posterior y año anterior a 2026 | `calcularCopyright` en 2026, 2027 y 2025 | RF-6, EC-6 |
| Integración visual | `pnpm dev` + navegador (MCP `playwright` o `chrome-devtools`) | 320, 768, 1023, 1024, 1280 y 1920 px; apilado y tres columnas | RF-2 a RF-12 |
| Accesibilidad | Navegación por teclado + árbol de accesibilidad del navegador | Orden de lectura, foco visible, nombres accesibles, iconos decorativos | RF-14, RNF-3 |
| Año dinámico | Recarga tras simular otro año (DevTools) | El copyright cambia al recargar | RF-6, EC-1 |
| Types / Lint / Build | `npx tsc --noEmit`, `pnpm lint`, `pnpm build` | Sin errores de tipos, lint en verde y build sin advertencias CSS | Definición de Done |

## 5. Verificación contra docs/constitution.md

| Principio | Cumplimiento | Comentario |
|-----------|--------------|------------|
| #1 SDD Prioridad | ✅ | Spec aprobada antes de planificar e implementar |
| #2 TypeScript Estricto | ✅ | Tipos explícitos en props y función pura; sin `any` |
| #3 Separación de Capas | ✅ | UI pura en `/app/ui`, ruta en `/app` |
| #4 Pureza Visual UI | ✅ | Sin `fetch`; el footer recibe datos solo por props |
| #5 Server Components First | ✅ | `Footer` es Server Component; la única hoja cliente es `CopyrightYear`, que lee el año con `useSyncExternalStore` |
| #6 API Centralizada | ✅ | No aplica: no hay llamadas a API |
| #7 Consistencia Lingüística | ✅ | Nombres de código en inglés; textos de UI en español |
| #8 Restricción de Dependencias | ✅ | Solo utilidades de Next.js y React; no se instala nada |
| #9 Datos y Fechas Estándar | ✅ | El copyright es texto de presentación, no un dato de fecha; no aplica ISO |
| #10 Planificación y Verificación | ✅ | Plan previo y verificación con `pnpm build` y `pnpm lint` |
| #11 Next.js Optimizado | ✅ | Iconos con `next/image` y `unoptimized` para SVG |
| #12 Loading y Error Boundaries | ✅ | No aplica en esta spec |
| #13 Caché y Revalidación | ✅ | El footer es estático; el año se resuelve en el cliente |
| #14 Imágenes y Assets | ✅ | Se reutiliza `public/icons/portfolio-dev.svg`, ya existente; no se agregan imágenes nuevas |
| #15 Tailwind v4 en Markdown | ✅ | Se describen en lenguaje natural las clases; sin fragmentos inseguros con variables dentro de corchetes |

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| El año queda fijo en build porque la página es estática | `CopyrightYear` como hoja cliente que actualiza el año al montar |
| `next/image` con SVG puede fallar en el optimizador | Usar `unoptimized` en el icono |
| La zona izquierda deja un hueco en móvil | Renderizarla solo en escritorio con `hidden lg:block` |
| Páginas de error que definan su propio layout sin el layout raíz | Verificar en `/not-found` y en cada ruta de segmento; el layout raíz cubre `not-found` |
| No reutilizar `IconLink` duplica el estilo del enlace | Componente `DeveloperLink` pequeño y local, con `next/image`; se documenta la mejora futura de migrar `IconLink` a `next/image` |

## 7. Estado y próximos pasos

- **Estado:** Spec `specs/003-new-footer/spec.md` aprobada con 14 RF, 8 RNF y 12 EC; sin dudas abiertas.
- **Próximo paso:** Ejecutar las tareas de `specs/003-new-footer/tasks.md` en orden (T1 → T4).
- **Después:** Actualizar `MEMORY.md` y registrar la verificación final.
