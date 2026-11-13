# AGENTS.md — EET N° 3100 Staff Web Application

## Stack Técnico
- **Next.js** (App Router, React 19, TypeScript strict)
- **Tailwind CSS** (Estilizado de interfaz)
- **pnpm** (Gestor de paquetes obligatorio)

## Comandos Esenciales
- Instalar dependencias: `pnpm install`
- Servidor de desarrollo: `pnpm dev`
- Compilar proyecto: `pnpm build`
- Linter / Verificación: `pnpm lint`

## Constitución de Gobernanza (leer siempre antes de iniciar)
- Los principios innegociables de desarrollo viven en `docs/constitution.md` (16 principios).
- Consultar obligatoriamente `docs/constitution.md` y la especificación activa en `specs/` antes de realizar cualquier modificación.

## Model Context Protocol (MCP)
- MCPs disponibles: `context7`, `next-devtools`, `playwright`, `chrome-devtools`, `github`.
- Consulta `README.md` para la guía detallada de cuándo y cómo usar cada MCP.
- Nunca exponer ni registrar API keys ni tokens (`GITHUB_PAT`, `CONTEXT7_API_KEY`) en código, commits ni salidas de terminal.

## Reglas de dominio / Trampas conocidas
- **Tailwind v4 vs Markdown**: Nunca uses tres puntos literales (`...`) dentro de corchetes de clases Tailwind en ningún archivo. Turbopack leerá el punto como un delimitador CSS inválido (`Unexpected token Delim('.')`) y destruirá el build.

## Protocolo de Trabajo con Agentes
- Prohibición absoluta de instalar dependencias externas sin aprobación previa.
- Al finalizar cada tarea, actualizar el archivo `MEMORY.md`.

## Memoria Encendida (MEMORY.md)
- `MEMORY.md` es la memoria encendida del agente: se carga al inicio de cada sesión y concentra el estado del proyecto.
- Sirve como índice operativo; las reglas estáticas viven en `AGENTS.md`.
- No duplicar en `MEMORY.md` lo ya definido en `AGENTS.md`; registrar solo lo sesional y de decisión.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
