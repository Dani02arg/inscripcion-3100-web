import assert from "node:assert/strict";
import { test } from "node:test";

import {
  USER_OPERATION_ERROR_MESSAGE,
} from "../../app/lib/api/users.ts";
import type { SessionClaims, UserRole } from "../../app/lib/auth/types.ts";
import {
  CHANGE_ROLE_FORBIDDEN_REASON,
  CHANGE_ROLE_SAME_REASON,
  CHANGE_ROLE_SELF_REASON,
  CHANGE_ROLE_UNVERIFIED_REASON,
  DELETE_USER_SELF_REASON,
} from "../../app/lib/users/rules.ts";
import {
  changeUserRoleActionCore,
  deleteUserActionCore,
  requestRoleChangeActionCore,
  updateTutorProfileActionCore,
  type ChangeUserRoleDependencies,
  type DeleteUserDependencies,
  type RequestRoleChangeDependencies,
  type UpdateTutorProfileDependencies,
} from "../../app/lib/users/action-core.ts";
import type { UserActionAccess } from "../../app/lib/users/guard.ts";
import type {
  RoleRequestResult,
  UserActionResult,
} from "../../app/lib/users/types.ts";

function makeAccess(role: UserRole = "ADMINISTRADOR"): UserActionAccess {
  const claims: SessionClaims = {
    sub: "user-1",
    email: "admin@example.com",
    role,
    exp: 1_792_502_671,
  };

  return {
    status: "ok",
    role,
    account: {
      status: "ok",
      claims,
      user: {
        id: "user-1",
        name: "Admin",
        lastname: "Uno",
        email: "admin@example.com",
        role,
      },
    },
    token: "jwt-token",
  };
}

function makeFormData(
  values: Record<string, string> = {},
): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function validForm(): FormData {
  return makeFormData({
    userId: "user-2",
    newRole: "ADMINISTRATIVO",
    currentRole: "TUTOR",
    targetVerified: "true",
  });
}

function createDeps(
  apiResult: UserActionResult = {
    ok: true,
    message: "Rol actualizado.",
  },
  access: UserActionAccess = makeAccess(),
) {
  const calls: { token: string; userId: string; newRole: UserRole }[] = [];
  const revalidated: string[] = [];
  let redirected = "";

  const deps: ChangeUserRoleDependencies = {
    getAccess: async () => access,
    changeUserRole: async (token, userId, newRole) => {
      calls.push({ token, userId, newRole });
      return apiResult;
    },
    revalidatePath: (path) => {
      revalidated.push(path);
    },
    redirect: (path) => {
      redirected = path;
      throw new Error("redirect");
    },
  };

  return {
    deps,
    calls,
    revalidated,
    getRedirected: () => redirected,
  };
}

test("cambia el rol, revalida listados y detalle", async () => {
  const { deps, calls, revalidated } = createDeps();

  const result = await changeUserRoleActionCore(
    null,
    validForm(),
    deps,
  );

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [
    {
      token: "jwt-token",
      userId: "user-2",
      newRole: "ADMINISTRATIVO",
    },
  ]);
  assert.deepEqual(revalidated, [
    "/dashboard/users",
    "/dashboard/users/staff",
    "/dashboard/users/user-2",
  ]);
});

test("no llama a la API con el mismo rol actual", async () => {
  const { deps, calls } = createDeps();
  const result = await changeUserRoleActionCore(
    null,
    makeFormData({
      userId: "user-2",
      newRole: "TUTOR",
      currentRole: "TUTOR",
      targetVerified: "true",
    }),
    deps,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "validation");
    assert.equal(result.fieldErrors?.newRole, CHANGE_ROLE_SAME_REASON);
  }
  assert.equal(calls.length, 0);
});

test("no llama a la API con un rol inválido", async () => {
  const { deps, calls } = createDeps();
  const result = await changeUserRoleActionCore(
    null,
    makeFormData({
      userId: "user-2",
      newRole: "SECRETARIO",
      currentRole: "TUTOR",
      targetVerified: "true",
    }),
    deps,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "validation");
    assert.equal(result.fieldErrors?.newRole, "Seleccioná un rol válido.");
  }
  assert.equal(calls.length, 0);
});

test("no permite cambiar el rol de la propia cuenta", async () => {
  const { deps, calls } = createDeps();
  const result = await changeUserRoleActionCore(
    null,
    makeFormData({
      userId: "user-1",
      newRole: "ADMINISTRATIVO",
      currentRole: "ADMINISTRADOR",
      targetVerified: "true",
    }),
    deps,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "forbidden");
    assert.equal(result.message, CHANGE_ROLE_SELF_REASON);
  }
  assert.equal(calls.length, 0);
});

test("no aplica el cambio si el correo no está verificado", async () => {
  const { deps, calls } = createDeps();
  const result = await changeUserRoleActionCore(
    null,
    makeFormData({
      userId: "user-2",
      newRole: "ADMINISTRATIVO",
      currentRole: "TUTOR",
      targetVerified: "false",
    }),
    deps,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "conflict");
    assert.equal(result.message, CHANGE_ROLE_UNVERIFIED_REASON);
  }
  assert.equal(calls.length, 0);
});

test("no llama a la API si el rol no tiene acceso", async () => {
  const { deps, calls } = createDeps(
    { ok: true, message: "" },
    {
      status: "forbidden",
      message: CHANGE_ROLE_FORBIDDEN_REASON,
    },
  );

  const result = await changeUserRoleActionCore(null, validForm(), deps);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "forbidden");
    assert.equal(result.message, CHANGE_ROLE_FORBIDDEN_REASON);
  }
  assert.equal(calls.length, 0);
});

test("redirige a sesión vencida ante un 401 de la API", async () => {
  const { deps, getRedirected } = createDeps({
    ok: false,
    kind: "unauthorized",
    status: 401,
    message: "Sesión vencida.",
  });

  await assert.rejects(
    () => changeUserRoleActionCore(null, validForm(), deps),
    /redirect/,
  );
  assert.equal(getRedirected(), "/session-expired");
});

test("devuelve conflicto, denegado, inexistente y validación de la API", async () => {
  for (const result of [
    {
      ok: false as const,
      kind: "conflict" as const,
      status: 409,
      message: "El rol ya es el actual.",
    },
    {
      ok: false as const,
      kind: "forbidden" as const,
      status: 403,
      message: "Sin permisos.",
    },
    {
      ok: false as const,
      kind: "not_found" as const,
      status: 404,
      message: "No existe.",
    },
    {
      ok: false as const,
      kind: "validation" as const,
      status: 422,
      message: "Revisá los campos.",
      fieldErrors: { newRole: "Inválido." },
    },
  ]) {
    const { deps } = createDeps(result);
    const outcome = await changeUserRoleActionCore(
      null,
      validForm(),
      deps,
    );

    assert.deepEqual(outcome, result);
  }
});

test("falla sin identificador de usuario y no llama a la API", async () => {
  const { deps, calls } = createDeps();
  const result = await changeUserRoleActionCore(
    null,
    makeFormData({ userId: "   ", newRole: "ADMINISTRATIVO" }),
    deps,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, USER_OPERATION_ERROR_MESSAGE);
  }
  assert.equal(calls.length, 0);
});

function deleteForm(values: Record<string, string> = {}): FormData {
  return makeFormData({ userId: "user-2", ...values });
}

function createDeleteDeps(
  apiResult: UserActionResult = {
    ok: true,
    message: "Usuario eliminado correctamente.",
  },
  access: UserActionAccess = makeAccess(),
) {
  const calls: { token: string; userId: string }[] = [];
  const revalidated: string[] = [];
  let redirected = "";

  const deps: DeleteUserDependencies = {
    getAccess: async () => access,
    deleteUser: async (token, userId) => {
      calls.push({ token, userId });
      return apiResult;
    },
    revalidatePath: (path) => {
      revalidated.push(path);
    },
    redirect: (path) => {
      redirected = path;
      throw new Error("redirect");
    },
  };

  return {
    deps,
    calls,
    revalidated,
    getRedirected: () => redirected,
  };
}

test("da de baja desde el listado y revalida listados y detalle", async () => {
  const { deps, calls, revalidated, getRedirected } =
    createDeleteDeps();

  const result = await deleteUserActionCore(null, deleteForm(), deps);

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [
    { token: "jwt-token", userId: "user-2" },
  ]);
  assert.deepEqual(revalidated, [
    "/dashboard/users",
    "/dashboard/users/staff",
    "/dashboard/users/user-2",
  ]);
  assert.equal(getRedirected(), "");
});

test("desde el detalle vuelve al origen con aviso", async () => {
  const { deps, getRedirected } = createDeleteDeps();

  await assert.rejects(
    () =>
      deleteUserActionCore(
        null,
        deleteForm({ origin: "staff" }),
        deps,
      ),
    /redirect/,
  );
  assert.equal(getRedirected(), "/dashboard/users/staff?deleted=1");
});

test("un origen desconocido vuelve al padrón", async () => {
  const { deps, getRedirected } = createDeleteDeps();

  await assert.rejects(
    () =>
      deleteUserActionCore(
        null,
        deleteForm({ origin: "otro" }),
        deps,
      ),
    /redirect/,
  );
  assert.equal(getRedirected(), "/dashboard/users?deleted=1");
});

test("no permite dar de baja la propia cuenta", async () => {
  const { deps, calls } = createDeleteDeps();
  const result = await deleteUserActionCore(
    null,
    deleteForm({ userId: "user-1" }),
    deps,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "forbidden");
    assert.equal(result.message, DELETE_USER_SELF_REASON);
  }
  assert.equal(calls.length, 0);
});

test("no llama a la API si el rol no tiene acceso", async () => {
  const { deps, calls } = createDeleteDeps(
    { ok: true, message: "" },
    { status: "forbidden", message: "Sin permisos." },
  );

  const result = await deleteUserActionCore(null, deleteForm(), deps);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "forbidden");
    assert.equal(result.message, "Sin permisos.");
  }
  assert.equal(calls.length, 0);
});

test("devuelve conflicto, denegado e inexistente de la API", async () => {
  for (const result of [
    {
      ok: false as const,
      kind: "conflict" as const,
      status: 409,
      message: "No se puede eliminar al último administrador activo.",
    },
    {
      ok: false as const,
      kind: "forbidden" as const,
      status: 403,
      message: "Sin permisos.",
    },
    {
      ok: false as const,
      kind: "not_found" as const,
      status: 404,
      message: "No existe.",
    },
  ]) {
    const { deps } = createDeleteDeps(result);
    const outcome = await deleteUserActionCore(null, deleteForm(), deps);

    assert.deepEqual(outcome, result);
  }
});

test("redirige a sesión vencida ante un 401 de la API", async () => {
  const { deps, getRedirected } = createDeleteDeps({
    ok: false,
    kind: "unauthorized",
    status: 401,
    message: "Sesión vencida.",
  });

  await assert.rejects(
    () => deleteUserActionCore(null, deleteForm(), deps),
    /redirect/,
  );
  assert.equal(getRedirected(), "/session-expired");
});

test("falla sin identificador de usuario y no llama a la API", async () => {
  const { deps, calls } = createDeleteDeps();
  const result = await deleteUserActionCore(
    null,
    deleteForm({ userId: "   " }),
    deps,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, USER_OPERATION_ERROR_MESSAGE);
  }
  assert.equal(calls.length, 0);
});

function profileForm(values: Record<string, string> = {}): FormData {
  return makeFormData({
    occupation: "Docente",
    educationLevel: "UNIVERSITARIO",
    ...values,
  });
}

function createProfileDeps(
  apiResult: UserActionResult = {
    ok: true,
    message: "Perfil actualizado correctamente.",
  },
  access: UserActionAccess = makeAccess("TUTOR"),
) {
  const calls: {
    token: string;
    payload: { occupation: string; education_level: string };
  }[] = [];
  const revalidated: string[] = [];
  let redirected = "";

  const deps: UpdateTutorProfileDependencies = {
    getAccess: async () => access,
    updateTutorProfile: async (token, payload) => {
      calls.push({ token, payload });
      return apiResult;
    },
    revalidatePath: (path) => {
      revalidated.push(path);
    },
    redirect: (path) => {
      redirected = path;
      throw new Error("redirect");
    },
  };

  return {
    deps,
    calls,
    revalidated,
    getRedirected: () => redirected,
  };
}

test("actualiza el perfil de tutor con el payload exacto", async () => {
  const { deps, calls, revalidated, getRedirected } =
    createProfileDeps();

  const result = await updateTutorProfileActionCore(
    null,
    profileForm(),
    deps,
  );

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [
    {
      token: "jwt-token",
      payload: {
        occupation: "Docente",
        education_level: "UNIVERSITARIO",
      },
    },
  ]);
  assert.deepEqual(revalidated, [
    "/dashboard/profile",
    "/dashboard/account",
  ]);
  assert.equal(getRedirected(), "");
});

test("no llama a la API con datos inválidos", async () => {
  const { deps, calls } = createProfileDeps();
  const result = await updateTutorProfileActionCore(
    null,
    profileForm({ occupation: "   ", educationLevel: "OTRO" }),
    deps,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "validation");
    assert.equal(result.fieldErrors?.occupation, "Ingresá tu ocupación.");
    assert.equal(
      result.fieldErrors?.education_level,
      "Seleccioná tu nivel educativo.",
    );
  }
  assert.equal(calls.length, 0);
});

test("no llama a la API si el rol no es TUTOR", async () => {
  const { deps, calls } = createProfileDeps(
    { ok: true, message: "" },
    {
      status: "forbidden",
      message: "Esta operación es exclusiva de tutores.",
    },
  );

  const result = await updateTutorProfileActionCore(
    null,
    profileForm(),
    deps,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "forbidden");
    assert.equal(result.message, "Esta operación es exclusiva de tutores.");
  }
  assert.equal(calls.length, 0);
});

test("devuelve validación y denegado de la API", async () => {
  for (const result of [
    {
      ok: false as const,
      kind: "validation" as const,
      status: 422,
      message: "Revisá los campos.",
      fieldErrors: { occupation: "Inválido." },
    },
    {
      ok: false as const,
      kind: "forbidden" as const,
      status: 403,
      message: "Sin permisos.",
    },
  ]) {
    const { deps } = createProfileDeps(result);
    const outcome = await updateTutorProfileActionCore(
      null,
      profileForm(),
      deps,
    );

    assert.deepEqual(outcome, result);
  }
});

test("redirige a sesión vencida ante un 401 del perfil", async () => {
  const { deps, getRedirected } = createProfileDeps({
    ok: false,
    kind: "unauthorized",
    status: 401,
    message: "Sesión vencida.",
  });

  await assert.rejects(
    () => updateTutorProfileActionCore(null, profileForm(), deps),
    /redirect/,
  );
  assert.equal(getRedirected(), "/session-expired");
});

function roleForm(values: Record<string, string> = {}): FormData {
  return makeFormData({
    requestedRole: "ADMINISTRATIVO",
    reason: "Necesito gestionar inscripciones.",
    ...values,
  });
}

function createRoleRequestDeps(
  apiResult: RoleRequestResult = {
    ok: true,
    message: "Solicitud enviada.",
  },
  access: UserActionAccess = makeAccess("TUTOR"),
) {
  const calls: {
    token: string;
    payload: { requested_role: string; reason: string };
  }[] = [];
  const revalidated: string[] = [];
  let redirected = "";

  const deps: RequestRoleChangeDependencies = {
    getAccess: async () => access,
    requestRoleChange: async (token, payload) => {
      calls.push({ token, payload });
      return apiResult;
    },
    revalidatePath: (path) => {
      revalidated.push(path);
    },
    redirect: (path) => {
      redirected = path;
      throw new Error("redirect");
    },
  };

  return {
    deps,
    calls,
    revalidated,
    getRedirected: () => redirected,
  };
}

test("envía la solicitud de rol y revalida la cuenta", async () => {
  const { deps, calls, revalidated, getRedirected } =
    createRoleRequestDeps();

  const result = await requestRoleChangeActionCore(
    null,
    roleForm(),
    deps,
  );

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [
    {
      token: "jwt-token",
      payload: {
        requested_role: "ADMINISTRATIVO",
        reason: "Necesito gestionar inscripciones.",
      },
    },
  ]);
  assert.deepEqual(revalidated, ["/dashboard/account"]);
  assert.equal(getRedirected(), "");
});

test("no llama a la API si se pide el mismo rol", async () => {
  const { deps, calls } = createRoleRequestDeps();
  const result = await requestRoleChangeActionCore(
    null,
    roleForm({ requestedRole: "TUTOR" }),
    deps,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "validation");
    assert.equal(
      result.fieldErrors?.requested_role,
      "El rol solicitado debe ser distinto del actual.",
    );
  }
  assert.equal(calls.length, 0);
});

test("no llama a la API con rol o motivo inválidos", async () => {
  const { deps, calls } = createRoleRequestDeps();
  const result = await requestRoleChangeActionCore(
    null,
    roleForm({ requestedRole: "OTRO", reason: "   " }),
    deps,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "validation");
    assert.equal(
      result.fieldErrors?.requested_role,
      "Seleccioná el rol que querés solicitar.",
    );
    assert.equal(
      result.fieldErrors?.reason,
      "Ingresá el motivo de la solicitud.",
    );
  }
  assert.equal(calls.length, 0);
});

test("no llama a la API si el rol no es TUTOR", async () => {
  const { deps, calls } = createRoleRequestDeps(
    { ok: true, message: "" },
    {
      status: "forbidden",
      message: "Esta operación es exclusiva de tutores.",
    },
  );

  const result = await requestRoleChangeActionCore(
    null,
    roleForm(),
    deps,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "forbidden");
    assert.equal(result.message, "Esta operación es exclusiva de tutores.");
  }
  assert.equal(calls.length, 0);
});

test("devuelve validación y denegado de la solicitud", async () => {
  for (const result of [
    {
      ok: false as const,
      kind: "validation" as const,
      status: 422,
      message: "Revisá los campos.",
      fieldErrors: { reason: "Inválido." },
    },
    {
      ok: false as const,
      kind: "forbidden" as const,
      status: 403,
      message: "Sin permisos.",
    },
  ]) {
    const { deps } = createRoleRequestDeps(result);
    const outcome = await requestRoleChangeActionCore(
      null,
      roleForm(),
      deps,
    );

    assert.deepEqual(outcome, result);
  }
});

test("redirige a sesión vencida ante un 401 de la solicitud", async () => {
  const { deps, getRedirected } = createRoleRequestDeps({
    ok: false,
    kind: "unauthorized",
    status: 401,
    message: "Sesión vencida.",
  });

  await assert.rejects(
    () => requestRoleChangeActionCore(null, roleForm(), deps),
    /redirect/,
  );
  assert.equal(getRedirected(), "/session-expired");
});
