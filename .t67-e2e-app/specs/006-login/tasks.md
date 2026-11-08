# Tasks 006 — Inicio de sesión

Estado: implementada (T1–T13 completadas el 2026-10-23)

Plan aprobado: `specs/006-login/plan.md`.
Spec implementada: `specs/006-login/spec.md`.

Regla de ejecución: una tarea por vez, tests primero cuando la tarea lo permita, verificación de la tarea, marcar la casilla y detenerse. No se pasa a la siguiente tarea sin revisión.

## Fase A — Lógica y API

- [x] **T1. Tipos y validación pura de login.** RF-10, RF-11, RF-19; CL-1, CL-2, CL-3, CL-4
  - Hecho cuando: `app/lib/validation/login.ts` expone los tipos y `validateLoginInput`/`buildLoginPayload`; `tests/validation/login.test.ts` cubre email vacío, contraseña vacía, email inválido, recorte de email, contraseña con espacios, payload exacto y ausencia de complejidad; los tests nuevos pasan.

- [x] **T2. Cliente API y parseo de la respuesta.** RF-12, RF-15, RF-16, RF-17; CL-5, CL-6, CL-7
  - Hecho cuando: `app/lib/api/login.ts` hace POST a `/api/auth/login` con el contrato del plan, timeout de 10 s y clasificación de éxito, email no registrado, contraseña incorrecta y fallo general; `tests/api/login.test.ts` cubre método, URL, headers, cuerpo, éxito, errores por campo, 500, red, timeout, respuesta inválida y ausencia de la contraseña en el resultado; los tests nuevos pasan.

## Fase B — Acción

- [x] **T3. Server Action de login.** RF-10, RF-11, RF-12, RF-14, RF-15, RF-16, RF-17
  - Hecho cuando: `app/lib/actions/login.ts` revalida, llama a `loginUser`, redirige a `/home` en éxito y devuelve errores por campo o banner general; `tsc --noEmit` y `pnpm lint` sin errores nuevos; una prueba con servicio simulado confirma la redirección y que no se guarda sesión.

## Fase C — Interfaz

- [x] **T4. Extender el campo de contraseña compartido.** RF-3, RF-4, RF-5; RNF-1, RNF-7
  - Hecho cuando: `app/ui/auth/password-input.tsx` acepta pegado, arrastre y autocompletado configurables; los valores por defecto conservan el bloqueo del registro; el toggle mantiene `aria-pressed`, `aria-controls` y etiqueta dinámica; el registro sigue funcionando sin cambios.

- [x] **T5. Formulario de login.** RF-1, RF-3 a RF-17, RF-19; RNF-1 a RNF-7
  - Hecho cuando: `app/ui/auth/login-form.tsx` renderiza email y contraseña, toggle, validación en tiempo real, banner, botón "Iniciar sesión" azul, enlace "Registrarse" blanco a `/register`, enlace "Recuperar contraseña" a `/password-recovery`, indicador de progreso y bloqueo de doble envío; `tsc --noEmit` y `pnpm lint` sin errores nuevos. Actualizado el 2026-10-27 por la spec 007 (T18).

- [x] **T6. Página pública `/login`.** RF-1, RF-2; RNF-5, RNF-8
  - Hecho cuando: `app/login/page.tsx` es Server Component con metadata propia, navbar y tarjeta institucional; `/login` responde 200 sin sesión y muestra el formulario; el build incluye la ruta.

## Fase D — Integración con la verificación de email

- [x] **T7. Actualizar la documentación de la spec 005.** RF-18
  - Hecho cuando: `specs/005-email-verify/spec.md`, `plan.md` y `tasks.md` reflejan que la verificación exitosa lleva a `/login` y ya no a `/home`; no queda contradicción con la spec 006.

- [x] **T8. Cambiar la redirección de la verificación a `/login`.** RF-18; CL-9
  - Hecho cuando: `app/ui/auth/verify-email-form.tsx` navega a `/login` tras el verde y el aviso accesible menciona el inicio de sesión; el cambio de `/home` a `/login` se verifica con una prueba de flujo.

## Fase E — Verificación

- [x] **T9. Suite unitaria completa.** RF-10, RF-11, RF-12, RF-15, RF-16, RF-17, RF-19
  - Hecho cuando: `node --experimental-strip-types --test` pasa todos los tests, incluidos los de login y los preexistentes, sin regresiones.

- [x] **T10. E2E de login con servicio simulado.** RF-1 a RF-17, RF-19
  - Hecho cuando: con `pnpm dev` y `LARAVEL_API_URL` apuntando a un servicio simulado se verifica acceso, toggle, botones, validación, éxito a `/home`, email no registrado, contraseña incorrecta, 500, red, timeout, doble envío y conservación de valores.

- [x] **T11. E2E de verificación a login.** RF-18
  - Hecho cuando: un registro completo, la verificación con código válido y la espera de 1,5 s llevan a `/login`, la cookie de verificación se elimina y el texto accesible es correcto.

- [x] **T12. Accesibilidad y responsive.** RNF-1, RNF-2, RNF-3, RNF-4, RNF-7
  - Hecho cuando: 320, 375, 768, 1024 y 1440 px no tienen desbordamiento; los botones se apilan por debajo de 768 px y se alinean en fila desde 768 px; el teclado recorre y opera todo; el árbol de accesibilidad expone etiquetas, `aria-pressed`, `aria-invalid` y `aria-describedby`; el contraste cumple AA.
  - **Verificación 2026-10-23:** CDP con `next dev` en `:3108` y Chrome headless. Sin desbordamiento horizontal en 320/375/768/1024/1440 px (`scrollWidth` 305/360/753/1009/1425, todos ≤ viewport); botones apilados en 320/375 (login 29-276, registro 29-276/30-330) y en fila desde 768 (login 67-370, registro 382-686); todos los controles dentro del viewport. Teclado: Tab desde email → contraseña → toggle → "Iniciar sesión" → "Registrarse" → "Recuperar contraseña"; Enter en email envía y muestra errores locales sin banner; el toggle responde a Enter y Espacio (`password`→`text`→`password`) y expone `aria-pressed` false/true/false con nombres "Mostrar/Ocultar contraseña". Árbol AX: textboxes "Correo electrónico" y "Contraseña" con `invalid=true`, `required=true`, `describedby="login-email-error"`/equivalente y la descripción del error; botones "Iniciar sesión" y "Mostrar contraseña" (`pressed=false`); enlaces "Registrarse" y "Recuperar contraseña". Contraste: texto 10.98:1; enlaces y botones 13.58:1; anillo de foco 13.58:1; texto de error 10.98:1; icono de error 3.68:1; borde de error 3.19:1. **Borde en reposo resuelto:** por decisión del usuario se cambió `--color-borde-input` de `#E0E0E0` a `#767676` (4.54:1 sobre blanco) en `app/globals.css` (ambos bloques) y en la skill `design-system`; reverificado en login (4.54:1), `/register` (4.54:1, 320 px sin desborde) y `/verify-email` vacío (320 px sin desborde). `pnpm exec tsc --noEmit` limpio, `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`), suite **82/82** y `pnpm build` en verde.

- [x] **T13. Verificación final y cierre de la spec.** Todos los RF y RNF
  - Hecho cuando: `pnpm exec tsc --noEmit`, `pnpm lint`, la suite de tests y `pnpm build` están en verde; `package.json` no tiene dependencias nuevas; `MEMORY.md` registra la implementación y las decisiones; la spec 006 pasa a `implementada`.
  - **Verificación 2026-10-23:** `pnpm exec tsc --noEmit` limpio; `pnpm lint` 0 errores (4 avisos preexistentes de `<img>`); suite **82/82**; `pnpm build` en verde con `/`, `/home`, `/login` y `/register` estáticas y `/verify-email` dinámica. `package.json` no incorporó dependencias nuevas para esta spec: el login usa solo Next/React y APIs nativas. `MEMORY.md` registra T1–T13, el token `--color-borde-input` `#767676` y las decisiones. `spec.md` pasó a **implementada** con la nota de validación con servicio simulado; las 7 dudas abiertas y el contrato real de `POST /api/auth/login` quedan pendientes de validación con backend/producto. Spec cerrada.
