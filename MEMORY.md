# MEMORY.md — EET N° 3100 Staff Web Application

> Memoria encendida del agente (máx. 40 líneas). Estado operativo y decisiones recientes.

## 1. Estado del Proyecto
- **Stack**: Next.js 16.4.1 (App Router), React 19, TS strict, Tailwind v4, pnpm. Env: `LARAVEL_API_URL`.
- **Dependencias aprobadas**: `react-day-picker@10.0.2` (con date-fns). Sin otras dependencias externas.
- **Calidad**: Suite **950/950** en verde, `pnpm typecheck`, `pnpm lint` (0 errores) y `pnpm build` limpios. Script `pnpm test` corregido a `--test "tests/**/*.test.ts"`.

## 2. Estado de Especificaciones
- **Specs 001 a 012**: ✅ **Implementadas y cerradas** (Home, Icons, Footer, Register, Verify-Email, Login, Password-Recovery, Dashboard, Sidebar, Cursos, Staff, Alumnos).
- **Spec 013 (evaluación de inscripciones)**: ✅ **Implementada y cerrada** (2026-11-15). 103 RF / 19 RNF / 34 CL.
  - *Alcance*: módulo «Inscripciones» para `ADMINISTRATIVO`/`ADMINISTRADOR`; listado único con pestañas (`?status=`, `all`), búsqueda en vivo, filtros (DNI/CUIL con máscara), orden y paginación editable (15); detalle en 2 columnas (web) / FABs (móvil) con tutor, certificados, PDF embebido (ver/descargar/imprimir) y 4 dictámenes con alertas de elección/confirmación; contador de pendientes en el dashboard.
  - *Arquitectura*: lógica pura en `app/lib/registrations/*`, red en `app/lib/api/registrations{,-form}.ts`, Server Actions en `app/lib/actions/registrations.ts`, UI en `app/ui/registrations/*`, rutas en `app/dashboard/registrations/*`.
  - *Fases A–L (T1–T58) completadas*: dominio → lógica de listado → validación/API → estados/guardias/acciones → navegación → listado UI → detalle UI → PDF → dictámenes → contador → pruebas → E2E/cierre.
  - *Fase L (cierre)*: se cableó `PdfModal` en el detalle (botón «Ver formulario PDF» en web y móvil, cerrando RF-50/51). E2E real con Chromium headless + backend Laravel (MariaDB) verificó: pestañas (Todas=6, Pendientes=2, Observadas=1, Reasignadas=1, Aprobadas=1, Rechazadas=1), búsqueda en vivo, orden, paginación; detalle completo + PDF (Descargar/Imprimir); dictámenes (aprobar elección→confirmación, rechazar, reasignar con selector, devolver con validación y mutación `OBSERVED`); contador 2→1; tutor denegado (`Próximamente`); responsive sin desborde 320–1920; sin datos sensibles en URL/consola; smoke de Cursos/Alumnos/Usuarios en verde.

## 3. Decisiones Arquitectónicas y Convenciones
- **Auth y Sesión**: Cookies `httpOnly`, `sameSite: "lax"`, `secure` (prod). Tokens y credenciales nunca expuestos al cliente, DOM ni logs.
- **Backend Laravel**: Consumo exclusivo vía Server Actions (`app/lib/api/` y `app/lib/actions/`).
- **Privacidad UI**: DNI y CUIL se manejan en memoria/`sessionStorage`, nunca en parámetros de URL.
- **Idioma**: identificadores/tipos/rutas en inglés; textos UI y comentarios en español.

## 4. Deuda Técnica y Pendientes
- Backend `eet3100-inscripciones-api`: se corrigió `CourseController::available` (doble envoltura en `CourseResource`) para que `/api/courses/available` devuelva cursos; quedó sembrado el entorno de pruebas (users `admin@`/`administrativo@`/`tutor@eet3100.edu.ar`, password `password`; 4 cursos 2026; 6 inscripciones en todos los estados).
- Revalidar contratos HTTP reales de Laravel al conectar con el backend definitivo.
- Pendientes menores spec 001: contraste de texto secundario en hero y metadata de `/home`.
- Nota: el filtro por DNI no se aplica en cliente (el recurso no expone DNI; se documenta).
