import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getStudentRowActionDefinitions,
  getStudentRowActionsLabel,
} from "../../app/lib/students/row-actions.ts";

test("el tutor ve, edita y elimina", () => {
  const actions = getStudentRowActionDefinitions("TUTOR");

  assert.deepEqual(
    actions.map((action) => action.id),
    ["view", "edit", "delete"],
  );
  assert.deepEqual(
    actions.map((action) => action.label),
    ["Ver", "Editar", "Eliminar"],
  );
});

test("los roles administrativos solo ven", () => {
  for (const role of ["ADMINISTRATIVO", "ADMINISTRADOR"] as const) {
    const actions = getStudentRowActionDefinitions(role);

    assert.deepEqual(
      actions.map((action) => action.id),
      ["view"],
    );
    assert.deepEqual(
      actions.map((action) => action.label),
      ["Ver"],
    );
  }
});

test("un rol desconocido no recibe acciones", () => {
  for (const role of ["OTRO", "", null, undefined, 1, {}, []]) {
    assert.deepEqual(getStudentRowActionDefinitions(role), []);
  }
});

test("las acciones y sus definiciones están congeladas", () => {
  const tutorActions = getStudentRowActionDefinitions("TUTOR");
  const adminActions = getStudentRowActionDefinitions("ADMINISTRATIVO");

  assert.equal(Object.isFrozen(tutorActions), true);
  assert.equal(Object.isFrozen(adminActions), true);

  for (const action of [...tutorActions, ...adminActions]) {
    assert.equal(Object.isFrozen(action), true);
  }
});

test("el nombre accesible del menú usa apellido y nombre", () => {
  assert.equal(
    getStudentRowActionsLabel({
      firstName: "Lucas",
      lastName: "Pérez",
    }),
    "Acciones de Pérez, Lucas",
  );
});
