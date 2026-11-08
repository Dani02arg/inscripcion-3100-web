---
descripcion: Next.js · Crea una función de lectura de API de /app/lib/api
agent: build
---
Crea una función asíncrona en `/app/lib/api/$1.ts` encargada de hacer un `fetch` GET a la API de Laravel.
Reglas:
1- La función debe leer el token JWT usando `cookies()` de `next/headers`.
2- Adjuntar el token en el header `Authorization: Bearer <token>`.
3- Tipar la respuesta de la API de Laravel usando una interfaz que respete el formato: `{ data, message, errors }` y la interfaz genérica `ApiResponse<T>`.
4- Manejar los errores de red con un bloque `try/catch`.
