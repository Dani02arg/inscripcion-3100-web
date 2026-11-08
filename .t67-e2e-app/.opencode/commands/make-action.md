---
description: Next.js · Crea un Server Action para mutar datos (POST/PUT/DELETE) en /app/lib/api
agent: build
---
Crea un Server Action en `/app/lib/api/$1.ts`.
Reglas:
1. El archivo debe incluir la directiva `'use server'` en la primera línea.
2. Debe recibir datos de un formulario (`FormData`) o payload tipado, y hacer la petición mutadora a la API de Laravel con el token JWT de las cookies.
3. Tras una respuesta 200/201 de la API, **debes invocar** `revalidatePath` para invalidar la caché de Next.js y asegurar que la UI se actualice.
4. Retorna el estado de la operación (éxito o error) para que la UI lo maneje.
