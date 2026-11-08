---
name: api-laravel-integration
description: Enseña al agente a consumir la API REST de Laravel, formatear y deserializar la respuesta estándar { data, message, errors }, adjuntar el token JWT en cabeceras y gestionar errores HTTP de forma centralizada en /app/lib/api/.
---

# API Laravel Integration

Este skill enseña al agente a consumir la API REST de Laravel de forma tipada, centralizada y segura, respetando la separación de capas del proyecto.

## Ubicación del código

Todo el código de integración con la API Laravel vive exclusivamente en `/app/lib/api/`. No se realizan peticiones HTTP desde otros directorios.

## Gestión de tipos (TypeScript)

Todas las llamadas en `/app/lib/api/client.ts` deben tiparse utilizando una interfaz genérica base `ApiResponse<T>`, asegurando que el payload de `data` esté fuertemente tipado desde el momento de la deserialización.

## Formato de respuesta estándar

La API REST de Laravel responde siempre con la estructura `{ data, message, errors }`. El agente debe:

- Deserializar toda respuesta a ese shape.
- Tratar `data` como el payload principal.
- Tratar `message` como mensaje informativo de negocio.
- Tratar `errors` como lista de errores de validación o de negocio.
- Nunca asumir otra estructura de respuesta distinta.

## Autenticación JWT

Adjuntar el token JWT en el header `Authorization: Bearer <token>` en cada petición autenticada.

**Diferenciación de entornos:**
- En **Server Components** o **Server Actions**, el token debe leerse utilizando `cookies()` de `next/headers`.
- En llamadas desde **Client Components**, el token debe leerse del estado del cliente o mediante interceptores asíncronos.

La cabecera se construye de forma centralizada dentro de `/app/lib/api/`.

## Gestión centralizada de errores HTTP

Crear un cliente base (fetch wrapper o equivalente) en `/app/lib/api/client.ts` con:

- Interceptores de respuesta que mapeen códigos de estado de forma centralizada:
  - 401 → logout / redirigir a login.
  - 403 → acceso denegado.
  - 422 → errores de validación en `errors`.
  - 500 → error genérico de servidor.
- Los componentes UI nunca manejan errores HTTP directamente; reciben el estado ya procesado mediante `props`.

## Reglas de capa

- Los componentes en `/app/ui` no realizan `fetch` ni peticiones HTTP directas (principio 4 de `docs/constitution.md`).
- Los componentes de UI reciben datos ya procesados mediante `props`.
- La lógica de red y helpers reside en `/app/lib` (principio 3 de `docs/constitution.md`).

## Validación antes de responder

- Revisar `docs/constitution.md` (principio 6: Integración y DTOs Centralizados).
- Revisar `AGENTS.md` (Reglas de Arquitectura: Separación de Capas, Componentes Puros).
- Si el código propuesto viola alguna de estas reglas, detenerse, explicar la violación y solicitar corrección o aprobación explícita.

## Referencias cruzadas

- `docs/constitution.md`: Principio 6 (Integración y DTOs Centralizados).
- `AGENTS.md`: Reglas de Arquitectura.
- `MEMORY.md`: registrar decisiones de integración excepcionales en el historial.
