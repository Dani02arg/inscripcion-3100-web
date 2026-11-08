import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CHANGE_ROLE_FORBIDDEN_REASON,
  CHANGE_ROLE_INVALID_REASON,
  CHANGE_ROLE_SAME_REASON,
  CHANGE_ROLE_SELF_REASON,
  CHANGE_ROLE_UNVERIFIED_REASON,
  DELETE_USER_FORBIDDEN_REASON,
  DELETE_USER_SELF_REASON,
  canChangeUserRole,
  canDeleteUser,
  getChangeRoleDisabledReason,
  getDeleteDisabledReason,
  getUserDetailActionAvailability,
  getVerificationDisplay,
  isOwnAccount,
  isSameRoleRequest,
  isStaffRole,
} from "../../app/lib/users/rules.ts";

test("reconoce la propia cuenta comparando identificadores normalizados", () => {
  assert.equal(isOwnAccount("123", "123"), true);
  assert.equal(isOwnAccount(123, "123"), true);
  assert.equal(isOwnAccount(" 123 ", "123"), true);
  assert.equal(isOwnAccount("123", "456"), false);
  assert.equal(isOwnAccount("", ""), false);
  assert.equal(isOwnAccount(null, "123"), false);
  assert.equal(isOwnAccount("123", undefined), false);
});

test("reconoce los roles del staff", () => {
  assert.equal(isStaffRole("ADMINISTRATIVO"), true);
  assert.equal(isStaffRole("ADMINISTRADOR"), true);
  assert.equal(isStaffRole("TUTOR"), false);
  assert.equal(isStaffRole(null), false);
});

test("reconoce una solicitud al mismo rol", () => {
  assert.equal(isSameRoleRequest("TUTOR", "TUTOR"), true);
  assert.equal(isSameRoleRequest("ADMINISTRADOR", "ADMINISTRADOR"), true);
  assert.equal(isSameRoleRequest("TUTOR", "ADMINISTRADOR"), false);
  assert.equal(isSameRoleRequest("OTRO", "OTRO"), false);
});

test("un administrador puede cambiar el rol de otro usuario verificado", () => {
  assert.equal(
    canChangeUserRole({
      viewerRole: "ADMINISTRADOR",
      currentRole: "TUTOR",
      newRole: "ADMINISTRATIVO",
      targetVerified: true,
      isSelf: false,
    }),
    true,
  );
  assert.equal(
    getChangeRoleDisabledReason({
      viewerRole: "ADMINISTRADOR",
      currentRole: "TUTOR",
      newRole: "ADMINISTRATIVO",
      targetVerified: true,
      isSelf: false,
    }),
    null,
  );
});

test("el estado de verificación desconocido no bloquea en el cliente", () => {
  assert.equal(
    canChangeUserRole({
      viewerRole: "ADMINISTRADOR",
      currentRole: "TUTOR",
      newRole: "ADMINISTRATIVO",
      targetVerified: null,
      isSelf: false,
    }),
    true,
  );
});

test("un administrador no puede cambiar su propio rol", () => {
  const input = {
    viewerRole: "ADMINISTRADOR" as const,
    currentRole: "ADMINISTRADOR",
    newRole: "TUTOR",
    targetVerified: true,
    isSelf: true,
  };

  assert.equal(canChangeUserRole(input), false);
  assert.equal(getChangeRoleDisabledReason(input), CHANGE_ROLE_SELF_REASON);
});

test("no se puede elegir el mismo rol actual", () => {
  const input = {
    viewerRole: "ADMINISTRADOR" as const,
    currentRole: "TUTOR",
    newRole: "TUTOR",
    targetVerified: true,
    isSelf: false,
  };

  assert.equal(canChangeUserRole(input), false);
  assert.equal(getChangeRoleDisabledReason(input), CHANGE_ROLE_SAME_REASON);
});

test("no se puede enviar un rol desconocido", () => {
  const input = {
    viewerRole: "ADMINISTRADOR" as const,
    currentRole: "TUTOR",
    newRole: "SECRETARIO",
    targetVerified: true,
    isSelf: false,
  };

  assert.equal(canChangeUserRole(input), false);
  assert.equal(getChangeRoleDisabledReason(input), CHANGE_ROLE_INVALID_REASON);
});

test("un correo sin verificar bloquea el cambio cuando el estado se conoce", () => {
  const input = {
    viewerRole: "ADMINISTRADOR" as const,
    currentRole: "TUTOR",
    newRole: "ADMINISTRATIVO",
    targetVerified: false,
    isSelf: false,
  };

  assert.equal(canChangeUserRole(input), false);
  assert.equal(
    getChangeRoleDisabledReason(input),
    CHANGE_ROLE_UNVERIFIED_REASON,
  );
});

test("solo el administrador puede cambiar roles", () => {
  for (const viewerRole of ["ADMINISTRATIVO", "TUTOR", null]) {
    const input = {
      viewerRole,
      currentRole: "TUTOR",
      newRole: "ADMINISTRATIVO",
      targetVerified: true,
      isSelf: false,
    };

    assert.equal(canChangeUserRole(input), false);
    assert.equal(
      getChangeRoleDisabledReason(input),
      CHANGE_ROLE_FORBIDDEN_REASON,
    );
  }
});

test("un administrador puede dar de baja a otro usuario", () => {
  assert.equal(
    canDeleteUser({ viewerRole: "ADMINISTRADOR", isSelf: false }),
    true,
  );
  assert.equal(
    getDeleteDisabledReason({ viewerRole: "ADMINISTRADOR", isSelf: false }),
    null,
  );
});

test("un administrador no puede darse de baja a sí mismo", () => {
  const input = { viewerRole: "ADMINISTRADOR" as const, isSelf: true };

  assert.equal(canDeleteUser(input), false);
  assert.equal(getDeleteDisabledReason(input), DELETE_USER_SELF_REASON);
});

test("solo el administrador puede dar de baja usuarios", () => {
  for (const viewerRole of ["ADMINISTRATIVO", "TUTOR", undefined]) {
    const input = { viewerRole, isSelf: false };

    assert.equal(canDeleteUser(input), false);
    assert.equal(getDeleteDisabledReason(input), DELETE_USER_FORBIDDEN_REASON);
  }
});

test("solo el administrador ve acciones en el detalle", () => {
  assert.deepEqual(
    getUserDetailActionAvailability("ADMINISTRATIVO", false, true),
    null,
  );
  assert.deepEqual(
    getUserDetailActionAvailability("ADMINISTRADOR", false, true),
    {
      changeRoleDisabledReason: null,
      deleteDisabledReason: null,
    },
  );
});

test("deshabilita las acciones propias y explica el motivo", () => {
  assert.deepEqual(
    getUserDetailActionAvailability("ADMINISTRADOR", true, true),
    {
      changeRoleDisabledReason: CHANGE_ROLE_SELF_REASON,
      deleteDisabledReason: DELETE_USER_SELF_REASON,
    },
  );
});

test("deshabilita el cambio de rol cuando el correo no está verificado", () => {
  assert.deepEqual(
    getUserDetailActionAvailability("ADMINISTRADOR", false, false),
    {
      changeRoleDisabledReason: CHANGE_ROLE_UNVERIFIED_REASON,
      deleteDisabledReason: null,
    },
  );
});

test("ADMINISTRADOR ve verificado cuando existe la fecha", () => {
  const display = getVerificationDisplay(
    "ADMINISTRADOR",
    "2026-11-02T18:30:00-03:00",
  );

  assert.deepEqual(display, {
    status: "verified",
    label: "Verificado",
    date: "2026-11-02T18:30:00-03:00",
  });
});

test("ADMINISTRADOR ve sin verificar cuando falta la fecha", () => {
  for (const value of [null, undefined, ""]) {
    assert.deepEqual(getVerificationDisplay("ADMINISTRADOR", value), {
      status: "unverified",
      label: "Sin verificar",
      date: null,
    });
  }
});

test("ADMINISTRATIVO ve no informado aunque llegue una fecha", () => {
  assert.deepEqual(
    getVerificationDisplay(
      "ADMINISTRATIVO",
      "2026-11-02T18:30:00-03:00",
    ),
    {
      status: "unavailable",
      label: "No informado",
      date: null,
    },
  );
});

test("otros roles ven no informado", () => {
  assert.equal(getVerificationDisplay("TUTOR", null).status, "unavailable");
  assert.equal(getVerificationDisplay(null, null).status, "unavailable");
});
