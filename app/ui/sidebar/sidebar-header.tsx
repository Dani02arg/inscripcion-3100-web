import Image from "next/image";
import Link from "next/link";

import {
  INSTITUTION_FULL_NAME,
  INSTITUTION_LOGO_PATH,
  INSTITUTION_SHORT_NAME,
} from "../../lib/sidebar/presentation.ts";
import type { SidebarMode } from "../../lib/sidebar/types.ts";

interface SidebarHeaderProps {
  mode: SidebarMode;
  onToggleCollapse: () => void;
  onCloseDrawer: () => void;
  sidebarId?: string;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie";

/** Cabecera con identidad institucional rediseñada: logo circular arriba, texto abajo y controles limpios. */
export default function SidebarHeader({
  mode,
  onToggleCollapse,
  onCloseDrawer,
  sidebarId,
}: SidebarHeaderProps) {
  const isCollapsed = mode === "collapsed";
  const isDrawer = mode === "drawer";
  const isExpanded = mode === "expanded";

  return (
    <header
      className={
        // CAMBIO 1: Estructura vertical (flex-col) en lugar de horizontal para apilar los elementos
        isCollapsed
          ? "relative flex flex-col items-center gap-2 px-1 py-4"
          : "relative flex flex-col items-center text-center gap-2 px-3 py-5 border-b border-borde-subtle"
      }
    >
      {/* Contenedor principal que enlaza al dashboard */}
      <Link
        href="/dashboard"
        className={`flex w-full flex-col items-center gap-2 rounded-sm ${FOCUS_RING_CLASSES}`}
      >
        {/* CAMBIO 2: Contenedor circular con bordes redondeados (Avatar visual) para la imagen */}
        <div 
          className={
            isCollapsed 
              ? "relative size-10 rounded-full overflow-hidden border border-borde-subtle shrink-0 bg-white" 
              : "relative size-20 rounded-full overflow-hidden border-2 border-borde-subtle shadow-sm shrink-0 bg-white"
          }
        >
          <Image
            src={INSTITUTION_LOGO_PATH}
            alt="Logo Institucional"
            fill
            sizes={isCollapsed ? "40px" : "80px"}
            priority
            // CAMBIO 3: object-cover asegura que la imagen llene por completo el círculo sin deformarse
            className="object-cover size-full"
          />
        </div>

        {/* Texto alternativo accesible para lectores de pantalla */}
        <span className="sr-only">{INSTITUTION_FULL_NAME}</span>

        {/* CAMBIO 4: Textos institucionales ubicados DEBAJO del logo (se ocultan si el menú está contraído) */}
        {!isCollapsed && (
          <div className="flex flex-col items-center text-center gap-0.5 w-full mt-1">
            {isDrawer ? (
              <span className="text-sm font-bold text-texto-principal leading-tight break-words">
                {INSTITUTION_SHORT_NAME}
              </span>
            ) : (
              <>
                <span className="text-sm font-bold text-texto-principal leading-tight break-words">
                  {INSTITUTION_FULL_NAME}
                </span>
                <span className="text-xs text-texto-secundario font-medium break-words">
                  República de la India
                </span>
              </>
            )}
          </div>
        )}
      </Link>

      {/* CAMBIO 5: Reubicación del botón de colapsar / cerrar en la esquina superior derecha 
          para que no interfiera con el centrado del logo y el nombre de la escuela */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {isDrawer ? (
          <button
            type="button"
            data-drawer-close="true"
            aria-label="Cerrar menú"
            onClick={onCloseDrawer}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        ) : (
          <>
            {/* Si deseas mantener la campana en el header superior, puedes ubicarla aquí o en otra barra */}
            <button
              type="button"
              aria-label={isExpanded ? "Contraer menú" : "Expandir menú"}
              aria-expanded={isExpanded}
              aria-controls={sidebarId}
              onClick={onToggleCollapse}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isExpanded ? (
                  <path d="m15 18-6-6 6-6" />
                ) : (
                  <path d="m9 18 6-6-6-6" />
                )}
              </svg>
            </button>
          </>
        )}
      </div>
    </header>
  );
}