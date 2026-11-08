This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment variables

Create a `.env` file in the project root (it is git-ignored; `.env.example` is the committed template):

```bash
LARAVEL_API_URL=http://localhost:8000
```

`LARAVEL_API_URL` is the base URL of the Laravel API. It is a **server-only** variable (no `NEXT_PUBLIC_`): the registration form calls the API through a Server Action, so the browser never talks to Laravel. The value must be an absolute `http://` or `https://` URL and point to the API root, because the code appends `/api/auth/register`. There is no default in the code; if the variable is missing or invalid, the registration form shows a generic error, keeps the entered data and makes no request. Restart `pnpm dev` after changing it.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Model Context Protocol (MCP) — Guía de Uso

Este documento detalla cuándo y cómo usar cada MCP instalado en el proyecto. Consulta `AGENTS.md` para la lista breve de MCPs disponibles.

### 1. `context7` — Documentación de librerías y frameworks
- **Qué es:** MCP remoto que recupera documentación oficial y actualizada de librerías/frameworks.
- **Cuándo usar:** necesites documentación actualizada de Next.js, React, Tailwind CSS, TypeScript, pnpm u otra librería del stack (ej. sintaxis de `next/image`, API de Tailwind v4).
- **Cómo usar:**
  1. `resolve-library_id` con el nombre exacto (ej. `'Next.js'`).
  2. `query-docs` con el `libraryId` obtenido, un concepto específico y el lenguaje (`TypeScript`).
- **No usar para:** refactorizar, escribir scripts desde cero, depurar lógica de negocio o revisar código.
- **Restricción de seguridad:** no exponer la `CONTEXT7_API_KEY` en código, commits ni salidas de terminal.

### 2. `next-devtools` — Documentación y entorno Next.js específico
- **Qué es:** MCP local que ofrece documentación version-accurate de Next.js para este proyecto y descubre servidores de desarrollo corriendo.
- **Cuándo usar:** necesites documentación de Next.js específica para la versión del proyecto (16.4.1), listar servidores dev Next.js activos o evaluar expresiones en el contexto del navegador del proyecto.
- **Cómo usar:** `nextjs_docs` con el tema específico; `nextjs_index` para listar servidores dev y sus herramientas MCP; `browser_eval` para automatización de navegador ligada al proyecto.
- **No usar para:** inspección estática de código o documentación de librerías no Next.js (usar `context7`).
- **Restricción de seguridad:** ninguna específica más allá de no exponer salidas sensibles del navegador.

### 3. `playwright` — Pruebas E2E y automatización de UI
- **Qué es:** MCP local para pruebas end-to-end, navegación automatizada y capturas de pantalla de UI.
- **Cuándo usar:** necesites navegar páginas de la aplicación (`http://localhost:3000`), hacer capturas de componentes o ejecutar flujos E2E para verificar comportamientos de UI.
- **Cómo usar:** `browser_navigate` a la URL del servidor dev, luego acciones de navegación/captura según sea necesario.
- **No usar para:** inspección estática de código o búsqueda de documentación.
- **Restricción de seguridad:** ninguna específica.

### 4. `chrome-devtools` — Inspección y grabación de navegador real
- **Qué es:** MCP local para automatización e inspección de un navegador real mediante Chrome DevTools.
- **Cuándo usar:** necesites listar páginas abiertas, iniciar/detener grabación de screencast (video) de una página, o cerrar páginas específicas durante debugging visual.
- **Cómo usar:** `list_pages` para obtener `pageId`, luego `screencast_start/stop` o `close_page` según sea necesario.
- **No usar para:** pruebas automatizadas estructuradas (usar `playwright` en su lugar).
- **Restricción de seguridad:** ninguna específica.

### 5. `github` — Gestión del repositorio y colaboración
- **Qué es:** MCP remoto para interactuar con GitHub (issues, PRs, labels, releases, tags).
- **Cuándo usar:** crear/listar issues, pull requests, labels, releases o tags del repositorio `eet3100-web`.
- **Cómo usar:** `get_me` primero para verificar permisos; `search_issues`/`list_issues` para evitar duplicados; `get_label`, `get_latest_release`, `get_tag` según necesidad.
- **No usar para:** operaciones de desarrollo local o gestión de dependencias.
- **Restricción de seguridad:** nunca exponer ni registrar el `GITHUB_PAT` en código, commits ni salidas de terminal.

**Regla general:** Antes de usar cualquier MCP, verificar que la tarea no pueda resolverse con lectura de archivos locales o con el conocimiento base. Usar el MCP más específico para la tarea; no combinar varios MCPs para la misma acción salvo que sea estrictamente necesario.
