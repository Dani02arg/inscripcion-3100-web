---
name: design-system
description: Sistema de diseño, paleta de colores institucionales y tokens de UI compartidos con Flutter para mantener consistencia visual.
triggers: ["Tailwind", "UI", "diseño", "componentes", "estilos", "css", "frontend", "vista"]
---

# Sistema de Diseño y Tokens UI (Next.js + Tailwind CSS)

Para mantener una consistencia visual estricta con la aplicación móvil en Flutter, **TODO** el desarrollo de componentes visuales en `/app/ui/` debe utilizar EXCLUSIVAMENTE los siguientes tokens de diseño mapeados a Tailwind CSS.

## 1. Paleta de Colores (Brand & UI)

**Prohibido usar colores arbitrarios de Tailwind (ej. `bg-blue-500`).** Debes configurar y usar estas variables exactas:

*   **Marca:**
    *   `azulInstitucional` (`#041E88`): Uso en Navbar, botones principales, íconos y acentos.
    *   `naranjaAcento` (`#E67E22`): Uso en Floating Action Buttons (FAB), estados "reasignados" y destacados.
    *   `verdeInstitucional` (`#2E7D32`): SOLO para el logo. No utilizar como token de UI general.
*   **Superficies:**
    *   `fondoApp` (`#F8F9FA`): Fondo principal de la aplicación (Body / Scaffold / Layout base).
    *   `superficie` (`#FFFFFF`): Fondo para tarjetas (Cards), inputs, modales y drawers.
    *   `navbarGris` (`#D3D4D8`): Variante de barra de navegación (solo si se especifica).
*   **Texto:**
    *   `textoPrincipal` (`#2C3E50`): Texto estándar de lectura y encabezados.
    *   `textoSecundario` (`#7F8C8D`): Subtítulos, descripciones secundarias y metadatos.
    *   `placeholder` (`#BDBDBD`): Textos de placeholder en formularios.
*   **Bordes y Estados:**
    *   `bordeInput` (`#767676`): Bordes por defecto de campos de texto. Cumple WCAG 2.1 AA para componentes (4.54:1 sobre blanco; mínimo 3:1).
    *   `bordeFocus` (`#041E88`): Bordes de campos de texto al hacer focus (mismo que azulInstitucional).
    *   `estadoError`: Borde (`#FF5252`) / Texto de error (`#F44336`).
    *   `estadoPendiente` (`#FF9800`): Badges o textos de estado "Pendiente".
    *   `estadoAprobado` (`#4CAF50`): Badges o textos de estado "Aprobado".
    *   `estadoRechazado` (`#F44336`): Badges o textos de estado "Rechazado".

## 2. Tipografía y Escalas

*   **Fuente Principal:** `Roboto`. Asegúrate de que esté configurada globalmente usando `next/font/google`.
*   **Escala de tamaños permitida (Tailwind):**
    *   14px (`text-sm`) - Para metadatos y texto secundario.
    *   16px (`text-base`) - Texto de cuerpo principal y botones.
    *   20px (`text-xl`) - Subtítulos de sección.
    *   24px (`text-2xl`) - Títulos de página o modales.

## 3. Radios de Borde (Border Radius)

*   **Cards / Tarjetas:** 12px a 16px (Usar `rounded-xl` o `rounded-2xl`).
*   **Botones:** 10px a 16px (Usar `rounded-lg` o `rounded-xl`).
*   **Inputs / Formularios:** 10px a 14px (Usar `rounded-lg`).

## Instrucciones de Implementación para el Agente:
1. Si los colores no están configurados en el proyecto, tu PRIMERA TAREA antes de crear componentes es extender el tema de Tailwind CSS (`tailwind.config.ts` o `app/globals.css` según la versión) inyectando estos códigos HEX exactos.
2. Utiliza las clases utilitarias semánticas que crees (ej. `bg-brand-blue`, `text-surface-main`) en lugar de usar valores fijos como `bg-[#041E88]`.
3. Todos los componentes deben respetar la pureza de la UI; enfócate solo en la presentación.
