# AGENTS.md — EET N° 3100 Staff Web Application

## Stack y Comandos
- Next.js (App Router, React 19, TS strict), Tailwind CSS v4, pnpm.
- Comandos: `pnpm dev` | `pnpm build` | `pnpm lint` | `pnpm test` | `pnpm typecheck`

## Gobernanza y Reglas Críticas
- **Constitución**: Consultar `docs/constitution.md` (16 principios) y la spec activa en `specs/` antes de modificar código.
- **Dependencias**: Prohibición absoluta de instalar librerías externas sin aprobación previa.
- **Tailwind v4**: Nunca usar tres puntos literales (`...`) en corchetes de clases (rompe Turbopack).
- **Imports**: Preferir rutas relativas si Turbopack falla resolviendo `@/`.
- **Seguridad**: Nunca exponer API keys ni tokens (`GITHUB_PAT`, `CONTEXT7_API_KEY`, JWT) en código, commits o logs.

## Model Context Protocol (MCP)
- MCPs: `context7`, `next-devtools`, `playwright`, `chrome-devtools`, `github`. Guía detallada en `README.md`.

## Memoria Encendida (MEMORY.md)
- Actualizar al finalizar cada tarea. Mantener en ≤ 40 líneas: solo estado activo, decisiones recientes y TODO inmediato.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
