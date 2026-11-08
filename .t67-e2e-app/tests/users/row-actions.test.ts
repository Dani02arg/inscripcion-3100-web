import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getUserRowActionDefinitions,
  getUserRowActionsLabel,
} from "../../app/lib/users/row-actions.ts";
import type { UserSummary } from "../../app/lib/users/types.ts";

const user: UserSummary = {
  id: "42",
  role: "TUTOR",
  name: "Ana",
  lastname: "Pérez",
  dni: "30111222",
  cuil: "20301112223",
  email: "ana@example.com",
};

test("ofrece ver a administrativo y reserva acciones de gestión para admin", () => {
  assert.deepEqual(
    getUserRowActionDefinitions("ADMINISTRATIVO"),
    [{ id: "view", label: "Ver usuario" }],
  );
  assert.deepEqual(
    getUserRowActionDefinitions("ADMINISTRADOR"),
    [
      { id: "view", label: "Ver usuario" },
      { id: "change-role", label: "Cambiar rol" },
      { id: "delete", label: "Dar de baja" },
    ],
  );
});

test("deshabilita las acciones irreversibles en la propia cuenta", () => {
  const actions = getUserRowActionDefinitions("ADMINISTRADOR", true);

  assert.deepEqual(actions, [
    { id: "view", label: "Ver usuario" },
    {
      id: "change-role",
      label: "Cambiar rol",
      disabled: true,
      disabledReason: "No podés cambiar tu propio rol.",
    },
    {
      id: "delete",
      label: "Dar de baja",
      disabled: true,
      disabledReason: "No podés dar de baja tu propia cuenta.",
    },
  ]);
});

test("no ofrece acciones a roles sin acceso al padrón", () => {
  assert.deepEqual(getUserRowActionDefinitions("TUTOR"), []);
  assert.deepEqual(getUserRowActionDefinitions("DESCONOCIDO"), []);
});

test("nombra el disparador con nombre y apellido del usuario", () => {
  assert.equal(getUserRowActionsLabel(user), "Acciones de Ana Pérez");
});

test("usa una etiqueta accesible si faltan nombre y apellido", () => {
  const anonymousUser: UserSummary = {
    ...user,
    name: " ",
    lastname: "",
  };

  assert.equal(
    getUserRowActionsLabel(anonymousUser),
    "Acciones de No informado",
  );
});
