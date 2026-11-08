/** Acción individual de un menú de fila. */
export interface RowActionItem {
  readonly id: string;
  readonly label: string;
  readonly accessibleLabel?: string;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  readonly badge?: string;
  readonly onSelect?: () => void;
}

/**
 * Nombre accesible de una acción: usa el alternativo si existe y agrega el
 * motivo cuando la acción está deshabilitada.
 */
export function getRowActionAccessibleLabel(item: RowActionItem): string {
  const base = item.accessibleLabel ?? item.label;

  if (!item.disabled) {
    return base;
  }

  return `${base}. ${item.disabledReason ?? "No disponible."}`;
}
