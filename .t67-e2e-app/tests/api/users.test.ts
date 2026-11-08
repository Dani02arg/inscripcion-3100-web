import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ROLE_REQUEST_SUCCESS_MESSAGE,
  STAFF_LOAD_ERROR_MESSAGE,
  STAFF_PAGE_SIZE,
  USER_DELETE_SUCCESS_MESSAGE,
  USER_DETAIL_LOAD_ERROR_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
  USER_OPERATION_ERROR_MESSAGE,
  USER_PROFILE_UPDATED_MESSAGE,
  USERS_LOAD_ERROR_MESSAGE,
  USERS_MAX_PAGES,
  USERS_PAGE_SIZE,
  changeUserRole,
  deleteUser,
  getUser,
  listAllStaff,
  listStaffPage,
  listUsersPage,
  parseStaffListResponse,
  parseUserDeleteResponse,
  parseUserDetail,
  parseUserDetailResponse,
  parseUserListMeta,
  parseUserListResponse,
  parseUserRoleChangeResponse,
  parseRoleRequestResponse,
  parseUserSummary,
  parseTutorProfileResponse,
  requestRoleChange,
  updateTutorProfile,
} from "../../app/lib/api/users.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}
import {
  ACCESS_DENIED_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "../../app/lib/auth/types.ts";

const validUser = {
  id: 123,
  role: "TUTOR",
  name: "Ana",
  lastname: "Pérez",
  dni: "30111222",
  cuil: "20301112223",
  email: "ana@example.com",
};

const validMeta = {
  current_page: 1,
  last_page: 2,
  per_page: 10,
  total: 12,
};

test("parsea un usuario resumido y normaliza el id numérico", () => {
  const user = parseUserSummary(validUser);

  assert.ok(user);
  assert.deepEqual(user, {
    id: "123",
    role: "TUTOR",
    name: "Ana",
    lastname: "Pérez",
    dni: "30111222",
    cuil: "20301112223",
    email: "ana@example.com",
  });
});

test("acepta campos opcionales ausentes, nulos o vacíos", () => {
  const user = parseUserSummary({
    id: "user-1",
    role: "ADMINISTRADOR",
    name: "Ana",
    lastname: "Pérez",
    dni: null,
    cuil: "",
    email: undefined,
  });

  assert.ok(user);
  assert.equal(user.dni, null);
  assert.equal(user.cuil, null);
  assert.equal(user.email, null);
});

test("conserva un rol desconocido como texto", () => {
  const user = parseUserSummary({
    ...validUser,
    role: "SECRETARIO",
  });

  assert.ok(user);
  assert.equal(user.role, "SECRETARIO");
});

test("rechaza usuarios con campos obligatorios inválidos", () => {
  const invalidCases = [
    { ...validUser, id: "" },
    { ...validUser, id: null },
    { ...validUser, name: "" },
    { ...validUser, lastname: "   " },
    { ...validUser, role: "" },
    { ...validUser, role: null },
    { ...validUser, name: 123 },
  ];

  for (const value of invalidCases) {
    assert.equal(parseUserSummary(value), null);
  }

  assert.equal(parseUserSummary(null), null);
  assert.equal(parseUserSummary([]), null);
});

test("parsea metadatos de paginación válidos", () => {
  assert.deepEqual(parseUserListMeta(validMeta), {
    currentPage: 1,
    lastPage: 2,
    perPage: 10,
    total: 12,
  });
});

test("rechaza metadatos inválidos", () => {
  const invalidCases = [
    null,
    {},
    { ...validMeta, current_page: 0 },
    { ...validMeta, last_page: 0 },
    { ...validMeta, per_page: 0 },
    { ...validMeta, total: -1 },
    { ...validMeta, current_page: "1" },
  ];

  for (const value of invalidCases) {
    assert.equal(parseUserListMeta(value), null);
  }
});

test("parsea una lista paginada válida", () => {
  const result = parseUserListResponse(200, {
    data: [validUser],
    meta: validMeta,
    message: "Listado de usuarios.",
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.users.length, 1);
    assert.equal(result.users[0]?.id, "123");
    assert.deepEqual(result.meta, {
      currentPage: 1,
      lastPage: 2,
      perPage: 10,
      total: 12,
    });
    assert.equal(result.message, "Listado de usuarios.");
  }
});

test("acepta una lista vacía con metadatos válidos", () => {
  const result = parseUserListResponse(200, {
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.deepEqual(result.users, []);
    assert.equal(result.meta.total, 0);
  }
});

test("clasifica 401 y 403 con sus mensajes", () => {
  const unauthorized = parseUserListResponse(401, null);
  const forbidden = parseUserListResponse(403, null);

  assert.equal(unauthorized.ok, false);
  assert.equal(forbidden.ok, false);

  if (!unauthorized.ok && !forbidden.ok) {
    assert.equal(unauthorized.kind, "unauthorized");
    assert.equal(unauthorized.message, SESSION_EXPIRED_MESSAGE);
    assert.equal(forbidden.kind, "forbidden");
    assert.equal(forbidden.message, ACCESS_DENIED_MESSAGE);
  }
});

test("un error de servidor devuelve fallo genérico", () => {
  const result = parseUserListResponse(500, null);

  assert.deepEqual(result, {
    ok: false,
    kind: "failed",
    status: 500,
    message: USERS_LOAD_ERROR_MESSAGE,
  });
});

test("rechaza cuerpos inválidos, metadatos ausentes o errores en 2xx", () => {
  const invalidCases = [
    null,
    {},
    { data: [validUser] },
    { data: [validUser], meta: {} },
    {
      data: [validUser],
      meta: { ...validMeta, last_page: 1 },
    },
    {
      data: [validUser],
      meta: { ...validMeta, total: 0 },
    },
    {
      data: [validUser],
      meta: { ...validMeta, per_page: 20 },
    },
    { data: "no-array", meta: validMeta },
    { data: [validUser], meta: validMeta, errors: { dni: ["inválido"] } },
    { data: [{ ...validUser, name: "" }], meta: validMeta },
  ];

  for (const body of invalidCases) {
    const result = parseUserListResponse(200, body);

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.equal(result.kind, "failed");
      assert.equal(result.message, USERS_LOAD_ERROR_MESSAGE);
    }
  }
});

test("listUsersPage hace GET con Bearer, filtros activos y página", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({
        data: [validUser],
        meta: { ...validMeta, per_page: 10 },
        message: "Listado de usuarios.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await listUsersPage(
    "jwt-token",
    {
      dni: "30111222",
      cuil: "",
      name: "  Ana  ",
      lastname: "",
      email: "ana@example.com",
    },
    2,
    { baseUrl: "http://api.test/", fetchImpl },
  );

  assert.equal(USERS_PAGE_SIZE, 10);
  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);

  const url = new URL(call.input.toString());
  assert.equal(url.origin + url.pathname, "http://api.test/api/users");
  assert.equal(url.searchParams.get("per_page"), "10");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("dni"), "30111222");
  assert.equal(url.searchParams.has("cuil"), false);
  assert.equal(url.searchParams.get("name"), "Ana");
  assert.equal(url.searchParams.has("lastname"), false);
  assert.equal(url.searchParams.get("email"), "ana@example.com");

  assert.equal(call.init?.method, "GET");
  assert.equal(call.init?.credentials, "omit");
  assert.equal(call.init?.cache, "no-store");
  assert.equal(call.init?.redirect, "manual");
  assert.ok(call.init?.signal instanceof AbortSignal);

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("authorization"), "Bearer jwt-token");
  assert.equal(headers.get("accept"), "application/json");

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.users.length, 1);
    assert.equal(result.message, "Listado de usuarios.");
  }
});

test("listUsersPage no envía DNI ni CUIL inválidos", async () => {
  let requestedUrl = "";
  const fetchImpl: typeof fetch = async (input) => {
    requestedUrl = input.toString();

    return new Response(
      JSON.stringify({
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  await listUsersPage(
    "jwt-token",
    {
      dni: "30.111.222",
      cuil: "20-30111222-3",
      name: "",
      lastname: "",
      email: "",
    },
    1,
    { baseUrl: "http://api.test", fetchImpl },
  );

  const params = new URL(requestedUrl).searchParams;
  assert.equal(params.has("dni"), false);
  assert.equal(params.has("cuil"), false);
});

test("listUsersPage ajusta una página inválida a 1", async () => {
  let requestedUrl = "";
  const fetchImpl: typeof fetch = async (input) => {
    requestedUrl = input.toString();

    return new Response(
      JSON.stringify({
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  await listUsersPage(
    "jwt-token",
    { dni: "", cuil: "", name: "", lastname: "", email: "" },
    0,
    { baseUrl: "http://api.test", fetchImpl },
  );

  assert.equal(new URL(requestedUrl).searchParams.get("page"), "1");
});

test("listUsersPage reintenta con la última página si la solicitada quedó fuera de rango", async () => {
  const requestedPages: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const page = new URL(input.toString()).searchParams.get("page") ?? "";
    requestedPages.push(page);

    const body =
      page === "5"
        ? {
            data: [],
            meta: {
              current_page: 5,
              last_page: 3,
              per_page: 10,
              total: 25,
            },
          }
        : {
            data: [validUser],
            meta: {
              current_page: 3,
              last_page: 3,
              per_page: 10,
              total: 25,
            },
          };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await listUsersPage(
    "jwt-token",
    { dni: "", cuil: "", name: "", lastname: "", email: "" },
    5,
    { baseUrl: "http://api.test", fetchImpl },
  );

  assert.deepEqual(requestedPages, ["5", "3"]);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.meta.currentPage, 3);
    assert.equal(result.users.length, 1);
  }
});

test("listUsersPage rechaza metadata inconsistente en vez de ajustar la página", async () => {
  let requestCount = 0;
  const fetchImpl: typeof fetch = async () => {
    requestCount += 1;

    return new Response(
      JSON.stringify({
        data: [],
        meta: {
          current_page: 5,
          last_page: 3,
          per_page: 10,
          total: 15,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await listUsersPage(
    "jwt-token",
    { dni: "", cuil: "", name: "", lastname: "", email: "" },
    5,
    { baseUrl: "http://api.test", fetchImpl },
  );

  assert.equal(requestCount, 1);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, USERS_LOAD_ERROR_MESSAGE);
  }
});

test("listUsersPage clasifica 401, 403 y 5xx", async () => {
  for (const [status, kind, message] of [
    [401, "unauthorized", "Tu sesión expiró. Iniciá sesión nuevamente."],
    [403, "forbidden", "No tenés permisos para acceder a esta sección."],
    [500, "failed", USERS_LOAD_ERROR_MESSAGE],
  ] as const) {
    const fetchImpl: typeof fetch = async () =>
      new Response("{}", { status });

    const result = await listUsersPage(
      "jwt-token",
      { dni: "", cuil: "", name: "", lastname: "", email: "" },
      1,
      { baseUrl: "http://api.test", fetchImpl },
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.kind, kind);
      assert.equal(result.message, message);
    }
  }
});

test("listUsersPage clasifica red, timeout y cuerpo inválido", async () => {
  const network: typeof fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  const timeout: typeof fetch = async () => {
    throw new DOMException("Aborted", "AbortError");
  };
  const invalid: typeof fetch = async () =>
    new Response("no-json", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  for (const fetchImpl of [network, timeout, invalid]) {
    const result = await listUsersPage(
      "jwt-token",
      { dni: "", cuil: "", name: "", lastname: "", email: "" },
      1,
      { baseUrl: "http://api.test", fetchImpl },
    );

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.kind, "failed");
      assert.equal(result.message, USERS_LOAD_ERROR_MESSAGE);
    }
  }
});

test("listUsersPage no llama a fetch sin configuración", async () => {
  let called = false;
  const fetchImpl: typeof fetch = async () => {
    called = true;
    return new Response("{}", { status: 200 });
  };

  const result = await listUsersPage(
    "jwt-token",
    { dni: "", cuil: "", name: "", lastname: "", email: "" },
    1,
    { baseUrl: "", fetchImpl },
  );

  assert.equal(called, false);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, USERS_LOAD_ERROR_MESSAGE);
  }
});

const staffUser = {
  ...validUser,
  id: "staff-1",
  role: "ADMINISTRATIVO",
  name: "Carla",
  lastname: "Gómez",
  email: "carla@example.com",
};

const adminUser = {
  ...validUser,
  id: "admin-1",
  role: "ADMINISTRADOR",
  name: "Diego",
  lastname: "Ruiz",
  email: "diego@example.com",
};

test("parseStaffListResponse usa el mensaje del directorio", () => {
  const failed = parseStaffListResponse(500, null);
  const invalid = parseStaffListResponse(200, { data: [] });

  assert.equal(failed.ok, false);
  assert.equal(invalid.ok, false);

  if (!failed.ok && !invalid.ok) {
    assert.equal(failed.message, STAFF_LOAD_ERROR_MESSAGE);
    assert.equal(invalid.message, STAFF_LOAD_ERROR_MESSAGE);
  }
});

test("listStaffPage hace GET con Bearer y per_page=100", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({
        data: [staffUser],
        meta: { current_page: 2, last_page: 2, per_page: 100, total: 1 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await listStaffPage("jwt-token", 2, {
    baseUrl: "http://api.test/",
    fetchImpl,
  });

  assert.equal(STAFF_PAGE_SIZE, 100);
  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);

  const url = new URL(call.input.toString());
  assert.equal(url.origin + url.pathname, "http://api.test/api/users/staff");
  assert.equal(url.searchParams.get("per_page"), "100");
  assert.equal(url.searchParams.get("page"), "2");

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("authorization"), "Bearer jwt-token");

  assert.equal(result.ok, true);
});

test("listAllStaff recorre páginas, excluye TUTOR y recalcula totales", async () => {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(input.toString());
    calls.push(url.toString());
    const page = url.searchParams.get("page") ?? "1";
    const data = page === "1" ? [staffUser, validUser] : [adminUser];

    return new Response(
      JSON.stringify({
        data,
        meta: {
          current_page: Number(page),
          last_page: 2,
          per_page: 100,
          total: 3,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await listAllStaff("jwt-token", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(calls.length, 2);
  assert.equal(result.ok, true);

  if (result.ok) {
    assert.deepEqual(
      result.users.map((user) => user.id),
      ["staff-1", "admin-1"],
    );
    assert.equal(result.meta.total, 2);
    assert.equal(result.meta.lastPage, 1);
    assert.equal(result.meta.perPage, 100);
  }
});

test("listAllStaff no devuelve datos parciales si falla una página", async () => {
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(input.toString());
    const page = url.searchParams.get("page");

    if (page === "1") {
      return new Response(
        JSON.stringify({
          data: [staffUser],
          meta: { current_page: 1, last_page: 2, per_page: 100, total: 2 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response("{}", { status: 500 });
  };

  const result = await listAllStaff("jwt-token", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(result.message, STAFF_LOAD_ERROR_MESSAGE);
  }
});

test("listAllStaff corta si la primera página supera el tope", async () => {
  let calls = 0;
  const fetchImpl: typeof fetch = async () => {
    calls += 1;

    return new Response(
      JSON.stringify({
        data: [staffUser],
        meta: {
          current_page: 1,
          last_page: USERS_MAX_PAGES + 1,
          per_page: 100,
          total: 1,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await listAllStaff("jwt-token", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(calls, 1);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, STAFF_LOAD_ERROR_MESSAGE);
  }
});

test("listAllStaff corta si una página posterior supera el tope", async () => {
  let calls = 0;
  const fetchImpl: typeof fetch = async (input) => {
    const page = new URL(input.toString()).searchParams.get("page");
    calls += 1;

    return new Response(
      JSON.stringify({
        data: [staffUser],
        meta: {
          current_page: Number(page),
          last_page: page === "1" ? 2 : USERS_MAX_PAGES + 1,
          per_page: 100,
          total: 1,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await listAllStaff("jwt-token", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(calls, 2);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, STAFF_LOAD_ERROR_MESSAGE);
  }
});

test("listStaffPage clasifica 401 y red", async () => {
  const unauthorized: typeof fetch = async () =>
    new Response("{}", { status: 401 });
  const network: typeof fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  const first = await listStaffPage("jwt-token", 1, {
    baseUrl: "http://api.test",
    fetchImpl: unauthorized,
  });
  const second = await listStaffPage("jwt-token", 1, {
    baseUrl: "http://api.test",
    fetchImpl: network,
  });

  assert.equal(first.ok, false);
  assert.equal(second.ok, false);

  if (!first.ok && !second.ok) {
    assert.equal(first.kind, "unauthorized");
    assert.equal(second.kind, "failed");
    assert.equal(second.message, STAFF_LOAD_ERROR_MESSAGE);
  }
});

const validDetail = {
  ...validUser,
  user_phone: "3871234567",
  occupation: "Docente",
  education_level: "UNIVERSITARIO",
  birthdate: "1990-01-15",
  email_verified_at: "2026-11-02T18:30:00-03:00",
  created_at: "2026-11-01T10:00:00-03:00",
  updated_at: "2026-11-02T18:30:00-03:00",
};

test("parsea el detalle completo con auditoría", () => {
  const user = parseUserDetail(validDetail);

  assert.ok(user);
  assert.equal(user.id, "123");
  assert.equal(user.role, "TUTOR");
  assert.equal(user.userPhone, "3871234567");
  assert.equal(user.occupation, "Docente");
  assert.equal(user.educationLevel, "UNIVERSITARIO");
  assert.equal(user.birthdate, "1990-01-15");
  assert.equal(user.emailVerifiedAt, "2026-11-02T18:30:00-03:00");
  assert.equal(user.createdAt, "2026-11-01T10:00:00-03:00");
  assert.equal(user.updatedAt, "2026-11-02T18:30:00-03:00");
});

test("acepta detalle sin datos opcionales ni auditoría", () => {
  const user = parseUserDetail(validUser);

  assert.ok(user);
  assert.equal(user.userPhone, null);
  assert.equal(user.occupation, null);
  assert.equal(user.educationLevel, null);
  assert.equal(user.birthdate, null);
  assert.equal(user.emailVerifiedAt, null);
  assert.equal(user.createdAt, null);
  assert.equal(user.updatedAt, null);
});

test("rechaza un detalle sin campos obligatorios", () => {
  assert.equal(parseUserDetail({ ...validDetail, id: "" }), null);
  assert.equal(parseUserDetail({ ...validDetail, name: "" }), null);
  assert.equal(parseUserDetail(null), null);
});

test("parsea la respuesta de detalle y clasifica sus errores", () => {
  const success = parseUserDetailResponse(200, {
    data: validDetail,
    message: "Usuario.",
  });
  const unauthorized = parseUserDetailResponse(401, null);
  const forbidden = parseUserDetailResponse(403, null);
  const missing = parseUserDetailResponse(404, null);
  const failed = parseUserDetailResponse(500, null);

  assert.equal(success.ok, true);
  assert.equal(unauthorized.ok, false);
  assert.equal(forbidden.ok, false);
  assert.equal(missing.ok, false);
  assert.equal(failed.ok, false);

  if (
    !unauthorized.ok &&
    !forbidden.ok &&
    !missing.ok &&
    !failed.ok
  ) {
    assert.equal(unauthorized.kind, "unauthorized");
    assert.equal(forbidden.kind, "forbidden");
    assert.equal(missing.kind, "not_found");
    assert.equal(missing.message, USER_NOT_FOUND_MESSAGE);
    assert.equal(failed.kind, "failed");
    assert.equal(failed.message, USER_DETAIL_LOAD_ERROR_MESSAGE);
  }
});

test("rechaza respuestas de detalle con errores o cuerpo inválido", () => {
  for (const body of [
    null,
    {},
    { data: {} },
    { data: validDetail, errors: { name: ["inválido"] } },
  ]) {
    const result = parseUserDetailResponse(200, body);

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.message, USER_DETAIL_LOAD_ERROR_MESSAGE);
    }
  }
});

test("getUser hace GET al detalle con Bearer y ruta codificada", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({ data: validDetail }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await getUser("jwt-token", "user/1", {
    baseUrl: "http://api.test/",
    fetchImpl,
  });

  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(
    call.input.toString(),
    "http://api.test/api/users/user%2F1",
  );
  assert.equal(call.init?.method, "GET");
  assert.equal(call.init?.credentials, "omit");
  assert.equal(call.init?.cache, "no-store");
  assert.equal(call.init?.redirect, "manual");

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("authorization"), "Bearer jwt-token");

  assert.equal(result.ok, true);
});

test("getUser clasifica 404, red, timeout y configuración", async () => {
  const missing: typeof fetch = async () =>
    new Response("{}", { status: 404 });
  const network: typeof fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  const timeout: typeof fetch = async () => {
    throw new DOMException("Aborted", "AbortError");
  };

  const missingResult = await getUser("jwt-token", "user-1", {
    baseUrl: "http://api.test",
    fetchImpl: missing,
  });
  const networkResult = await getUser("jwt-token", "user-1", {
    baseUrl: "http://api.test",
    fetchImpl: network,
  });
  const timeoutResult = await getUser("jwt-token", "user-1", {
    baseUrl: "http://api.test",
    fetchImpl: timeout,
  });
  const configResult = await getUser("jwt-token", "user-1", {
    baseUrl: "",
    fetchImpl: network,
  });

  assert.equal(missingResult.ok, false);
  assert.equal(networkResult.ok, false);
  assert.equal(timeoutResult.ok, false);
  assert.equal(configResult.ok, false);

  if (!missingResult.ok && !networkResult.ok && !timeoutResult.ok && !configResult.ok) {
    assert.equal(missingResult.kind, "not_found");
    assert.equal(networkResult.message, USER_DETAIL_LOAD_ERROR_MESSAGE);
    assert.equal(timeoutResult.message, USER_DETAIL_LOAD_ERROR_MESSAGE);
    assert.equal(configResult.message, USER_DETAIL_LOAD_ERROR_MESSAGE);
  }
});

test("getUser rechaza un identificador vacío sin llamar a fetch", async () => {
  let called = false;
  const fetchImpl: typeof fetch = async () => {
    called = true;
    return new Response("{}", { status: 200 });
  };

  const result = await getUser("jwt-token", "   ", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(called, false);
  assert.equal(result.ok, false);
});

test("parsea el cambio de rol exitoso con el usuario actualizado", () => {
  const result = parseUserRoleChangeResponse(200, {
    data: validDetail,
    message: "Rol actualizado.",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.user?.id, "123");
    assert.equal(result.message, "Rol actualizado.");
  }
});

test("clasifica los errores del cambio de rol", () => {
  const unauthorized = parseUserRoleChangeResponse(401, null);
  const forbidden = parseUserRoleChangeResponse(403, null);
  const missing = parseUserRoleChangeResponse(404, null);
  const conflict = parseUserRoleChangeResponse(409, {
    message: "El rol ya es el actual.",
  });
  const validation = parseUserRoleChangeResponse(422, {
    errors: { newRole: ["The selected new role is invalid."] },
  });
  const failed = parseUserRoleChangeResponse(500, null);
  const invalid = parseUserRoleChangeResponse(200, { data: {} });

  for (const result of [
    unauthorized,
    forbidden,
    missing,
    conflict,
    validation,
    failed,
    invalid,
  ]) {
    assert.equal(result.ok, false);
  }

  if (
    !unauthorized.ok &&
    !forbidden.ok &&
    !missing.ok &&
    !conflict.ok &&
    !validation.ok &&
    !failed.ok &&
    !invalid.ok
  ) {
    assert.equal(unauthorized.kind, "unauthorized");
    assert.equal(forbidden.kind, "forbidden");
    assert.equal(missing.kind, "not_found");
    assert.equal(missing.message, USER_NOT_FOUND_MESSAGE);
    assert.equal(conflict.kind, "conflict");
    assert.equal(conflict.message, "El rol ya es el actual.");
    assert.equal(validation.kind, "validation");
    assert.equal(validation.fieldErrors?.newRole, "Seleccioná un rol válido.");
    assert.equal(failed.kind, "failed");
    assert.equal(failed.message, USER_OPERATION_ERROR_MESSAGE);
  }
});

test("parsea la baja exitosa y su mensaje por defecto", () => {
  const withMessage = parseUserDeleteResponse(200, {
    message: "Usuario eliminado correctamente.",
  });
  const withoutMessage = parseUserDeleteResponse(200, null);

  assert.equal(withMessage.ok, true);
  assert.equal(withoutMessage.ok, true);

  if (withMessage.ok && withoutMessage.ok) {
    assert.equal(withMessage.message, USER_DELETE_SUCCESS_MESSAGE);
    assert.equal(withoutMessage.message, USER_DELETE_SUCCESS_MESSAGE);
  }
});

test("clasifica los errores de la baja", () => {
  const forbidden = parseUserDeleteResponse(403, null);
  const missing = parseUserDeleteResponse(404, null);
  const conflict = parseUserDeleteResponse(409, {
    message: "No se puede eliminar al último administrador activo.",
  });
  const failed = parseUserDeleteResponse(500, null);
  const invalid = parseUserDeleteResponse(200, {
    errors: { id: ["inválido"] },
  });

  for (const result of [forbidden, missing, conflict, failed, invalid]) {
    assert.equal(result.ok, false);
  }

  if (
    !forbidden.ok &&
    !missing.ok &&
    !conflict.ok &&
    !failed.ok &&
    !invalid.ok
  ) {
    assert.equal(forbidden.kind, "forbidden");
    assert.equal(missing.kind, "not_found");
    assert.equal(conflict.kind, "conflict");
    assert.equal(failed.message, USER_OPERATION_ERROR_MESSAGE);
    assert.equal(invalid.kind, "failed");
  }
});

test("changeUserRole hace PUT con el payload exacto", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({ data: validDetail, message: "Rol actualizado." }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await changeUserRole(
    "jwt-token",
    "user/1",
    "ADMINISTRATIVO",
    { baseUrl: "http://api.test/", fetchImpl },
  );

  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(
    call.input.toString(),
    "http://api.test/api/users/user%2F1/role",
  );
  assert.equal(call.init?.method, "PUT");

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("authorization"), "Bearer jwt-token");
  assert.equal(headers.get("content-type"), "application/json");
  assert.deepEqual(JSON.parse(String(call.init?.body)), {
    newRole: "ADMINISTRATIVO",
  });

  assert.equal(result.ok, true);
});

test("deleteUser hace DELETE sin cuerpo", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({ message: "Usuario eliminado correctamente." }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await deleteUser("jwt-token", "user-1", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(call.input.toString(), "http://api.test/api/users/user-1");
  assert.equal(call.init?.method, "DELETE");
  assert.equal(call.init?.body, undefined);

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("authorization"), "Bearer jwt-token");
  assert.equal(headers.get("content-type"), null);

  assert.equal(result.ok, true);
});

test("las acciones de usuario clasifican red, configuración e identificador vacío", async () => {
  const network: typeof fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  const networkResult = await changeUserRole(
    "jwt-token",
    "user-1",
    "TUTOR",
    { baseUrl: "http://api.test", fetchImpl: network },
  );
  const configResult = await deleteUser("jwt-token", "user-1", {
    baseUrl: "",
    fetchImpl: network,
  });
  const emptyResult = await deleteUser("jwt-token", "   ", {
    baseUrl: "http://api.test",
    fetchImpl: network,
  });

  for (const result of [networkResult, configResult, emptyResult]) {
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.message, USER_OPERATION_ERROR_MESSAGE);
    }
  }
});

test("parsea la actualización del perfil de tutor", () => {
  const result = parseTutorProfileResponse(200, {
    data: validDetail,
    message: "Perfil actualizado correctamente.",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.user?.occupation, "Docente");
    assert.equal(result.user?.educationLevel, "UNIVERSITARIO");
    assert.equal(result.message, USER_PROFILE_UPDATED_MESSAGE);
  }
});

test("clasifica los errores del perfil de tutor", () => {
  const forbidden = parseTutorProfileResponse(403, null);
  const validation = parseTutorProfileResponse(422, {
    errors: {
      occupation: ["The occupation field is required."],
      education_level: ["The selected education level is invalid."],
    },
  });
  const failed = parseTutorProfileResponse(500, null);
  const invalid = parseTutorProfileResponse(200, { data: {} });

  for (const result of [forbidden, validation, failed, invalid]) {
    assert.equal(result.ok, false);
  }

  if (!forbidden.ok && !validation.ok && !failed.ok && !invalid.ok) {
    assert.equal(forbidden.kind, "forbidden");
    assert.equal(validation.kind, "validation");
    assert.equal(
      validation.fieldErrors?.occupation,
      "Ingresá tu ocupación.",
    );
    assert.equal(
      validation.fieldErrors?.education_level,
      "Seleccioná tu nivel educativo.",
    );
    assert.equal(failed.message, USER_OPERATION_ERROR_MESSAGE);
    assert.equal(invalid.kind, "failed");
  }
});

test("updateTutorProfile hace PUT con el payload exacto", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({
        data: validDetail,
        message: "Perfil actualizado correctamente.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await updateTutorProfile(
    "jwt-token",
    { occupation: "Docente", education_level: "UNIVERSITARIO" },
    { baseUrl: "http://api.test/", fetchImpl },
  );

  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(
    call.input.toString(),
    "http://api.test/api/profile/tutor",
  );
  assert.equal(call.init?.method, "PUT");

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("authorization"), "Bearer jwt-token");
  assert.equal(headers.get("content-type"), "application/json");
  assert.deepEqual(JSON.parse(String(call.init?.body)), {
    occupation: "Docente",
    education_level: "UNIVERSITARIO",
  });

  assert.equal(result.ok, true);
});

test("updateTutorProfile clasifica red y configuración", async () => {
  const network: typeof fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  const networkResult = await updateTutorProfile(
    "jwt-token",
    { occupation: "Docente", education_level: "UNIVERSITARIO" },
    { baseUrl: "http://api.test", fetchImpl: network },
  );
  const configResult = await updateTutorProfile(
    "jwt-token",
    { occupation: "Docente", education_level: "UNIVERSITARIO" },
    { baseUrl: "", fetchImpl: network },
  );

  for (const result of [networkResult, configResult]) {
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.message, USER_OPERATION_ERROR_MESSAGE);
    }
  }
});

test("parsea la solicitud de rol exitosa con mensaje por defecto", () => {
  const withMessage = parseRoleRequestResponse(200, {
    message: "Solicitud enviada.",
  });
  const withoutMessage = parseRoleRequestResponse(200, null);

  assert.equal(withMessage.ok, true);
  assert.equal(withoutMessage.ok, true);

  if (withMessage.ok && withoutMessage.ok) {
    assert.equal(withMessage.message, "Solicitud enviada.");
    assert.equal(withoutMessage.message, ROLE_REQUEST_SUCCESS_MESSAGE);
  }
});

test("clasifica los errores de la solicitud de rol", () => {
  const forbidden = parseRoleRequestResponse(403, null);
  const validation = parseRoleRequestResponse(422, {
    errors: {
      requested_role: ["The requested role is invalid."],
      reason: ["The reason may not be greater than 500 characters."],
    },
  });
  const failed = parseRoleRequestResponse(500, null);
  const invalid = parseRoleRequestResponse(200, {
    errors: { reason: ["inválido"] },
  });

  for (const result of [forbidden, validation, failed, invalid]) {
    assert.equal(result.ok, false);
  }

  if (!forbidden.ok && !validation.ok && !failed.ok && !invalid.ok) {
    assert.equal(forbidden.kind, "forbidden");
    assert.equal(validation.kind, "validation");
    assert.equal(
      validation.fieldErrors?.requested_role,
      "Seleccioná el rol que querés solicitar.",
    );
    assert.equal(
      validation.fieldErrors?.reason,
      "El motivo no puede superar los 500 caracteres.",
    );
    assert.equal(failed.message, USER_OPERATION_ERROR_MESSAGE);
    assert.equal(invalid.kind, "failed");
  }
});

test("requestRoleChange hace POST con el payload exacto", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({ message: "Solicitud enviada." }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await requestRoleChange(
    "jwt-token",
    {
      requested_role: "ADMINISTRATIVO",
      reason: "Necesito gestionar inscripciones.",
    },
    { baseUrl: "http://api.test/", fetchImpl },
  );

  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(
    call.input.toString(),
    "http://api.test/api/role-request",
  );
  assert.equal(call.init?.method, "POST");

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("authorization"), "Bearer jwt-token");
  assert.equal(headers.get("content-type"), "application/json");
  assert.deepEqual(JSON.parse(String(call.init?.body)), {
    requested_role: "ADMINISTRATIVO",
    reason: "Necesito gestionar inscripciones.",
  });

  assert.equal(result.ok, true);
});

test("requestRoleChange clasifica red y configuración", async () => {
  const network: typeof fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  const networkResult = await requestRoleChange(
    "jwt-token",
    { requested_role: "ADMINISTRATIVO", reason: "Motivo" },
    { baseUrl: "http://api.test", fetchImpl: network },
  );
  const configResult = await requestRoleChange(
    "jwt-token",
    { requested_role: "ADMINISTRATIVO", reason: "Motivo" },
    { baseUrl: "", fetchImpl: network },
  );

  for (const result of [networkResult, configResult]) {
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.message, USER_OPERATION_ERROR_MESSAGE);
    }
  }
});
