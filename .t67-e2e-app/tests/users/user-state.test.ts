import assert from "node:assert/strict";
import { test } from "node:test";

import { ACCESS_DENIED_MESSAGE } from "../../app/lib/auth/types.ts";
import {
  USER_ACTION_IDLE_STATE,
  USER_ACTION_PENDING_STATE,
  USER_DETAIL_LOADING_STATE,
  USER_LIST_LOADING_STATE,
  getTutorProfileFormValues,
  toAccountState,
  toProfileState,
  toRoleRequestActionState,
  toStaffState,
  toTutorProfileActionState,
  toUserActionState,
  toUserDetailState,
  toUserListState,
} from "../../app/lib/users/user-state.ts";
import type {
  UserDetailResult,
  UserListResult,
  UserPage,
  UserSummary,
} from "../../app/lib/users/types.ts";

function makeUser(id: string): UserSummary {
  return {
    id,
    role: "TUTOR",
    name: "Ana",
    lastname: "Pérez",
    dni: "30111222",
    cuil: "20301112223",
    email: "ana@example.com",
  };
}

const page: UserPage = {
  items: [makeUser("1"), makeUser("2")],
  page: 2,
  pageSize: 10,
  total: 12,
  totalPages: 2,
  from: 11,
  to: 12,
};

test("expone los estados iniciales de listado y detalle", () => {
  assert.deepEqual(USER_LIST_LOADING_STATE, { status: "loading" });
  assert.deepEqual(USER_DETAIL_LOADING_STATE, { status: "loading" });
});

test("mapea un listado listo con su página", () => {
  const result: UserListResult = {
    ok: true,
    users: [makeUser("1")],
    meta: {
      currentPage: 2,
      lastPage: 2,
      perPage: 10,
      total: 11,
    },
    message: "",
  };

  const state = toUserListState(result, false);

  assert.equal(state.status, "ready");

  if (state.status === "ready") {
    assert.equal(state.users.length, 1);
    assert.equal(state.page.page, 2);
    assert.equal(state.page.total, 11);
    assert.equal(state.page.from, 11);
    assert.equal(state.page.to, 11);
  }
});

test("distingue listado vacío de búsqueda sin coincidencias", () => {
  const emptyResult: UserListResult = {
    ok: true,
    users: [],
    meta: { currentPage: 1, lastPage: 1, perPage: 10, total: 0 },
    message: "",
  };

  const emptyState = toUserListState(emptyResult, false);
  const noResultsState = toUserListState(emptyResult, true);

  assert.equal(emptyState.status, "empty");
  assert.equal(noResultsState.status, "no_results");

  if (emptyState.status === "empty" && noResultsState.status === "no_results") {
    assert.deepEqual(emptyState.page.items, []);
    assert.equal(emptyState.page.total, 0);
    assert.deepEqual(noResultsState.page.items, []);
    assert.equal(noResultsState.page.total, 0);
  } else {
    assert.fail("El estado vacío debe depender de los filtros activos.");
  }
});

test("mapea denegado y error del listado", () => {
  const forbidden: UserListResult = {
    ok: false,
    kind: "forbidden",
    status: 403,
    message: "Sin permisos.",
  };
  const failed: UserListResult = {
    ok: false,
    kind: "failed",
    status: 500,
    message: "Error.",
  };

  assert.deepEqual(toUserListState(forbidden, false), {
    status: "forbidden",
    message: "Sin permisos.",
  });
  assert.deepEqual(toUserListState(failed, false), {
    status: "error",
    message: "Error.",
  });
});

test("mapea el directorio con la página filtrada del cliente", () => {
  const result: UserListResult = {
    ok: true,
    users: [makeUser("1"), makeUser("2")],
    meta: { currentPage: 1, lastPage: 1, perPage: 100, total: 2 },
    message: "",
  };

  const state = toStaffState(result, page, false);

  assert.equal(state.status, "ready");

  if (state.status === "ready") {
    assert.equal(state.users.length, 2);
    assert.equal(state.page.total, 12);
  }
});

test("el directorio distingue vacío de sin coincidencias", () => {
  const result: UserListResult = {
    ok: true,
    users: [],
    meta: { currentPage: 1, lastPage: 1, perPage: 100, total: 0 },
    message: "",
  };
  const emptyPage: UserPage = {
    items: [],
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    from: 0,
    to: 0,
  };

  assert.equal(toStaffState(result, emptyPage, false).status, "empty");
  assert.equal(toStaffState(result, emptyPage, true).status, "no_results");
});

test("mapea el detalle listo, no encontrado, denegado y error", () => {
  const ready: UserDetailResult = {
    ok: true,
    user: { ...makeUser("1"), userPhone: null, occupation: null, educationLevel: null, birthdate: null, emailVerifiedAt: null, createdAt: null, updatedAt: null },
    message: "",
  };
  const missing: UserDetailResult = {
    ok: false,
    kind: "not_found",
    status: 404,
    message: "No existe.",
  };
  const forbidden: UserDetailResult = {
    ok: false,
    kind: "forbidden",
    status: 403,
    message: "Sin permisos.",
  };
  const failed: UserDetailResult = {
    ok: false,
    kind: "failed",
    status: 500,
    message: "Error.",
  };

  assert.equal(toUserDetailState(ready).status, "ready");
  assert.deepEqual(toUserDetailState(missing), { status: "not_found" });
  assert.deepEqual(toUserDetailState(forbidden), {
    status: "forbidden",
    message: "Sin permisos.",
  });
  assert.deepEqual(toUserDetailState(failed), {
    status: "error",
    message: "Error.",
  });
});

test("no muta los resultados de entrada", () => {
  const users = [makeUser("1")];
  const result: UserListResult = {
    ok: true,
    users,
    meta: { currentPage: 1, lastPage: 1, perPage: 10, total: 1 },
    message: "",
  };

  toUserListState(result, false);

  assert.deepEqual(users.map((user) => user.id), ["1"]);
});

test("mapea el perfil y la cuenta desde la cuenta privada", () => {
  const claims = {
    sub: "u1",
    email: "ana@example.com",
    role: "TUTOR" as const,
    exp: 1_792_502_671,
  };
  const user = {
    id: "u1",
    name: "Ana",
    lastname: "Pérez",
    email: "ana@example.com",
    role: "TUTOR" as const,
  };

  const ready = toProfileState({ status: "ok", claims, user });
  const forbidden = toProfileState({
    status: "forbidden",
    claims,
  });
  const failed = toProfileState({
    status: "error",
    claims,
    message: "No se pudo cargar.",
  });

  assert.deepEqual(ready, { status: "ready", user });
  assert.deepEqual(forbidden, {
    status: "forbidden",
    message: ACCESS_DENIED_MESSAGE,
  });
  assert.deepEqual(failed, {
    status: "error",
    message: "No se pudo cargar.",
  });
  assert.deepEqual(toAccountState({ status: "ok", claims, user }), ready);
  assert.deepEqual(
    toAccountState({ status: "forbidden", claims }),
    {
      status: "forbidden",
      message: ACCESS_DENIED_MESSAGE,
    },
  );
  assert.deepEqual(
    toAccountState({
      status: "error",
      claims,
      message: "No se pudo cargar.",
    }),
    failed,
  );
});

test("mapea las acciones exitosas con y sin usuario", () => {
  const detail = {
    ...makeUser("1"),
    userPhone: null,
    occupation: null,
    educationLevel: null,
    birthdate: null,
    emailVerifiedAt: null,
    createdAt: null,
    updatedAt: null,
  };

  assert.deepEqual(
    toUserActionState({
      ok: true,
      message: "Rol actualizado.",
      user: detail,
    }),
    { status: "success", message: "Rol actualizado.", user: detail },
  );
  assert.deepEqual(
    toUserActionState({ ok: true, message: "Solicitud enviada." }),
    { status: "success", message: "Solicitud enviada." },
  );
});

test("mapea validación, conflicto, denegado, inexistente y error", () => {
  assert.deepEqual(
    toUserActionState({
      ok: false,
      kind: "validation",
      status: 422,
      message: "Revisá los campos.",
      fieldErrors: { reason: "Requerido." },
    }),
    {
      status: "validation",
      message: "Revisá los campos.",
      fieldErrors: { reason: "Requerido." },
    },
  );
  assert.deepEqual(
    toUserActionState({
      ok: false,
      kind: "validation",
      status: 422,
      message: "Revisá los campos.",
    }),
    {
      status: "validation",
      message: "Revisá los campos.",
      fieldErrors: {},
    },
  );
  assert.deepEqual(
    toUserActionState({
      ok: false,
      kind: "conflict",
      status: 409,
      message: "Conflicto.",
    }),
    { status: "conflict", message: "Conflicto." },
  );
  assert.deepEqual(
    toUserActionState({
      ok: false,
      kind: "forbidden",
      status: 403,
      message: "Sin permisos.",
    }),
    { status: "forbidden", message: "Sin permisos." },
  );
  assert.deepEqual(
    toUserActionState({
      ok: false,
      kind: "not_found",
      status: 404,
      message: "No existe.",
    }),
    { status: "not_found", message: "No existe." },
  );
  assert.deepEqual(
    toUserActionState({
      ok: false,
      kind: "failed",
      status: 500,
      message: "Error.",
    }),
    { status: "error", message: "Error." },
  );
  assert.deepEqual(
    toUserActionState({
      ok: false,
      kind: "unauthorized",
      status: 401,
      message: "Sesión vencida.",
    }),
    { status: "error", message: "Sesión vencida." },
  );
});

test("expone los estados iniciales de acción", () => {
  assert.deepEqual(USER_ACTION_IDLE_STATE, { status: "idle" });
  assert.deepEqual(USER_ACTION_PENDING_STATE, { status: "pending" });
});

test("mapea el estado del formulario de perfil de tutor", () => {
  const values = {
    occupation: "Docente anterior",
    educationLevel: "SECUNDARIO",
  };
  const detail = {
    ...makeUser("1"),
    userPhone: null,
    occupation: "Docente confirmado",
    educationLevel: "POSTGRADO",
    birthdate: null,
    emailVerifiedAt: null,
    createdAt: null,
    updatedAt: null,
  };

  assert.deepEqual(
    toTutorProfileActionState(
      { ok: true, message: "Perfil actualizado.", user: detail },
      values,
    ),
    {
      status: "success",
      message: "Perfil actualizado.",
      user: detail,
      values,
    },
  );
  assert.deepEqual(
    toTutorProfileActionState(
      {
        ok: false,
        kind: "validation",
        status: 422,
        message: "Revisá los campos.",
        fieldErrors: {
          occupation: "Requerido.",
          education_level: "Seleccioná un nivel.",
        },
      },
      values,
    ),
    {
      status: "validation",
      message: "Revisá los campos.",
      fieldErrors: {
        occupation: "Requerido.",
        education_level: "Seleccioná un nivel.",
      },
      values,
    },
  );
  assert.deepEqual(
    toTutorProfileActionState(
      {
        ok: false,
        kind: "forbidden",
        status: 403,
        message: "Sin permisos.",
      },
      values,
    ),
    { status: "forbidden", message: "Sin permisos.", values },
  );
  assert.deepEqual(
    toTutorProfileActionState(
      {
        ok: false,
        kind: "conflict",
        status: 409,
        message: "Conflicto.",
      },
      values,
    ),
    { status: "error", message: "Conflicto.", values },
  );
});

test("prefiere los datos del servicio tras guardar y conserva valores si falla", () => {
  const submittedValues = {
    occupation: "Docente anterior",
    educationLevel: "SECUNDARIO",
  };
  const returnedUser = {
    ...makeUser("1"),
    userPhone: null,
    occupation: "Docente confirmado",
    educationLevel: "POSTGRADO",
    birthdate: null,
    emailVerifiedAt: null,
    createdAt: null,
    updatedAt: null,
  };
  const successState = toTutorProfileActionState(
    { ok: true, message: "Guardado.", user: returnedUser },
    submittedValues,
  );
  const validationState = toTutorProfileActionState(
    {
      ok: false,
      kind: "validation",
      status: 422,
      message: "Revisá los campos.",
      fieldErrors: { occupation: "Inválida." },
    },
    submittedValues,
  );

  assert.deepEqual(getTutorProfileFormValues(successState, submittedValues), {
    occupation: "Docente confirmado",
    educationLevel: "POSTGRADO",
  });
  assert.deepEqual(
    getTutorProfileFormValues(validationState, submittedValues),
    submittedValues,
  );
});

test("mapea el estado del formulario de solicitud de rol", () => {
  const values = {
    requestedRole: "ADMINISTRATIVO",
    reason: "Motivo",
  };

  assert.deepEqual(
    toRoleRequestActionState(
      { ok: true, message: "Solicitud enviada." },
      values,
    ),
    { status: "success", message: "Solicitud enviada.", values },
  );
  assert.deepEqual(
    toRoleRequestActionState(
      {
        ok: false,
        kind: "validation",
        status: 422,
        message: "Revisá los campos.",
        fieldErrors: { reason: "Requerido." },
      },
      values,
    ),
    {
      status: "validation",
      message: "Revisá los campos.",
      fieldErrors: { reason: "Requerido." },
      values,
    },
  );
  assert.deepEqual(
    toRoleRequestActionState(
      {
        ok: false,
        kind: "forbidden",
        status: 403,
        message: "Sin permisos.",
      },
      values,
    ),
    { status: "forbidden", message: "Sin permisos.", values },
  );
  assert.deepEqual(
    toRoleRequestActionState(
      {
        ok: false,
        kind: "failed",
        status: 500,
        message: "Error.",
      },
      values,
    ),
    { status: "error", message: "Error.", values },
  );
});
