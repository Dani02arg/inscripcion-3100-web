import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getRowActionAccessibleLabel,
  type RowActionItem,
} from "../../app/lib/ui/row-actions.ts";

function item(overrides: Partial<RowActionItem> = {}): RowActionItem {
  return {
    id: "action",
    label: "Eliminar",
    ...overrides,
  };
}

test("usa la etiqueta visible cuando la acción está habilitada", () => {
  assert.equal(getRowActionAccessibleLabel(item()), "Eliminar");
});

test("prioriza el nombre accesible alternativo", () => {
  assert.equal(
    getRowActionAccessibleLabel(
      item({ accessibleLabel: "Eliminar curso" }),
    ),
    "Eliminar curso",
  );
});

test("agrega el motivo cuando la acción está deshabilitada", () => {
  assert.equal(
    getRowActionAccessibleLabel(
      item({
        disabled: true,
        disabledReason: "El curso tiene inscriptos.",
      }),
    ),
    "Eliminar. El curso tiene inscriptos.",
  );
});

test("usa un motivo genérico cuando no se informa", () => {
  assert.equal(
    getRowActionAccessibleLabel(item({ disabled: true })),
    "Eliminar. No disponible.",
  );
});

test("combina nombre accesible alternativo y motivo", () => {
  assert.equal(
    getRowActionAccessibleLabel(
      item({
        accessibleLabel: "Generar reporte del curso",
        disabled: true,
        disabledReason: "No disponible, próximamente.",
      }),
    ),
    "Generar reporte del curso. No disponible, próximamente.",
  );
});

test("el badge no altera el nombre accesible", () => {
  assert.equal(
    getRowActionAccessibleLabel(
      item({ accessibleLabel: "Generar reporte", badge: "Próximamente" }),
    ),
    "Generar reporte",
  );
});
