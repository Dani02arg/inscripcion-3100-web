---
name: home-page-icons
description: Spec de iconos para navbar, footer y botones de acción en la página de inicio EET N° 3100
---
# Spec 002 — Iconos para Navbar, Footer y Botones de Acción

**Estado:** borrador

## Contexto y objetivo
Proyecto: EET N° 3100 Staff Web Application.
Stack: Next.js 16.4.1 (App Router), React 19, TypeScript strict, Tailwind CSS v4.
Objeto: Integrar iconos SVG en la barra de navegación (navbar), el footer y los botones de acción principales (hero) de la página de inicio.
Pila: Next.js (App Router), React 19, TypeScript strict, Tailwind CSS v4.
Institución: Escuela Técnica EET N° 3100, República de la India.
Los archivos de imagen están en `public/icons/`, son SVG de aproximadamente 64×64 píxeles con color `#2C3E50`. Al ser SVG, los colores pueden ser modificados mediante CSS.

## Usuarios
- **PÚBLICO** (sin auth): puede ver navbar, hero, footer, botones de acción con sus respectivos iconos.
- **USUARIO NO AUTENTICADO**: puede clickear "Iniciar sesión" y "Registrarse" (redirige a auth flow) junto a sus respectivos iconos.
- Docentes/Alumnos: contenido adicional fuera de alcance para esta spec.

## Requisitos funcionales (en EARS - español)
- RF-1: CUANDO el usuario entra a la página principal, ENTONCES debe ver el logo institucional `public/logo.png` en la navbar (el logo es el icono, no se necesita otro).
- RF-2: CUANDO el usuario está en vista móvil, ENTONCES debe verse el menú hamburguesa con el icono `ico-burger-menu.svg` a la izquierda del texto o como único elemento visual.
- RF-3: CUANDO el usuario visualiza el componente de navegación en desktop, ENTONCES cada enlace debe mostrar su icono respectivo a la izquierda del texto: "Iniciar sesión" → `ico-login.svg`, "Registrarse" → `ico-register.svg`, "Ver cursos" → `ico-course.svg`, "Ir a Escuela" → `ico-web.svg`.
- RF-4: CUANDO el usuario ve el footer, ENTONCES debe ver el nombre de cada desarrollador con el icono `public/icons/portfolio-dev.svg` a la izquierda del texto.
- RF-5: CUANDO el usuario navega por la página de inicio, ENTONCES cada botón de acción ("Iniciar sesión", "Registrarse", "Ver cursos", "Ir a Escuela") debe mostrar su icono correspondiente a la izquierda del texto.
- RF-6: CUANDO los iconos se renderizan, ENTONCES deben tener un tamaño mayor al texto que acompañan, entre un 5% y un 8% más alto en altura (no en ancho), pero sin exceder un tamaño visual excesivo.
- RF-7: CUANDO se renderizan los iconos SVG, ENTONCES deben adoptar el color de texto del elemento padre o el color institucional (`#041E88`) según el contexto, permitiendo cambiar su color mediante CSS.
- RF-8: CUANDO no exista un archivo SVG con nombre sugerente para un elemento, ENTONCES se usa otro icono existente de la carpeta y el elemento se muestra sin error de renderizado.

## Requisitos no funcionales
- RNF-1: Los iconos deben renderizarse correctamente tanto en vista móvil como en desktop.
- RNF-2: Los archivos SVG deben mantener su calidad al escalar (vectoriales).
- RNF-3: Los colores de los iconos deben ser coherentes con la paleta institucional (`#041E88` azul institucional, `#E67E22` naranja acento).
- RNF-4: Los iconos no deben afectar negativamente el tiempo de carga de la página.
- RNF-5: Los iconos deben tener accesibilidad básica con `aria-label` descriptivo cuando sea apropiado.

## Casos límite
- EC-1: Si un archivo SVG no existe o no carga, el texto correspondiente debe seguirse mostrando sin error visible.
- EC-2: Si el usuario tiene preferencia de movimiento reducido (`prefers-reduced-motion`), cualquier animación de icono debe desactivarse.
- EC-3: Si el usuario entra desde un dispositivo sin soporte de touch, los iconos deben permanecer visibles.

## Fuera de alcance
- Creación o edición de archivos SVG.
- Cambio de nombres de archivos de iconos existentes.
- Animaciones complejas de iconos (más allá de efectos hover básicos).
- Uso de iconos en páginas distintas a la página de inicio (rutas `/login`, `/register`, `/courses`, etc. quedan fuera de alcance).

## Criterios de finalización (Definition of Done)
- [ ] Spec aprobada con todos los RF en formato EARS.
- [ ] Navbar incluye logo institucional `public/logo.png` a la izquierda y links "Registrarse" e "Iniciar Sesión" a la derecha con sus respectivos iconos a la izquierda del texto.
- [ ] Menú hamburguesa móvil muestra el icono `ico-burger-menu.svg`.
- [ ] Cada botón de la página de inicio tiene su icono correspondiente a la izquierda.
- [ ] Cada desarrollador en el footer tiene el icono `public/icons/portfolio-dev.svg` a la izquierda.
- [ ] Los iconos tienen un tamaño 5-8% más alto que el texto que acompañan.
- [ ] Los colores de los iconos son consistentes con la paleta institucional.
- [ ] `pnpm lint` y `pnpm type-check` sin errores.
- [ ] `next build` pasa sin errores.

## Dudas abiertas (respondidas)
1. Nombre del logo institucional: `public/logo.png` (es el icono, no necesita otro).
2. Nombre del menú hamburguesa: `ico-burger-menu.svg`.
3. Nombres de botones: `ico-login.svg`, `ico-register.svg`, `ico-course.svg`, `ico-web.svg`.
4. Desarrolladores: ambos usan `public/icons/portfolio-dev.svg`.
5. Botones de la página de inicio: también llevan icono a la izquierda.
6. Tamaño: entre 5% y 8% más alto en altura (no en ancho).
7. Posición: a la izquierda del texto en todos los casos.
8. No hay otros elementos que requieran iconos.