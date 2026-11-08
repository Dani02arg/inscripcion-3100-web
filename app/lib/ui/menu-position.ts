export interface MenuTriggerRect {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

export interface MenuSize {
  readonly width: number;
  readonly height: number;
}

export interface MenuViewport {
  readonly width: number;
  readonly height: number;
}

export interface MenuPosition {
  readonly top: number;
  readonly left: number;
  readonly placement: "bottom" | "top";
}

export const MENU_VIEWPORT_MARGIN = 8;
export const MENU_TRIGGER_GAP = 4;

/**
 * Calcula la posición fija del menú de acciones. Abre debajo del disparador
 * por defecto, arriba si no hay espacio y lo mantiene dentro del viewport.
 */
export function computeMenuPosition(
  trigger: MenuTriggerRect,
  menu: MenuSize,
  viewport: MenuViewport,
): MenuPosition {
  const maxLeft = Math.max(
    MENU_VIEWPORT_MARGIN,
    viewport.width - menu.width - MENU_VIEWPORT_MARGIN,
  );
  const left = Math.min(
    Math.max(trigger.right - menu.width, MENU_VIEWPORT_MARGIN),
    maxLeft,
  );

  const spaceBelow =
    viewport.height - trigger.bottom - MENU_TRIGGER_GAP - MENU_VIEWPORT_MARGIN;
  const spaceAbove =
    trigger.top - MENU_TRIGGER_GAP - MENU_VIEWPORT_MARGIN;
  const openAbove = spaceBelow < menu.height && spaceAbove >= menu.height;

  const desiredTop = openAbove
    ? trigger.top - MENU_TRIGGER_GAP - menu.height
    : trigger.bottom + MENU_TRIGGER_GAP;
  const maxTop = Math.max(
    MENU_VIEWPORT_MARGIN,
    viewport.height - menu.height - MENU_VIEWPORT_MARGIN,
  );
  const top = Math.min(
    Math.max(desiredTop, MENU_VIEWPORT_MARGIN),
    maxTop,
  );

  return {
    top,
    left,
    placement: openAbove ? "top" : "bottom",
  };
}
