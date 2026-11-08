const http = require("node:http");

const now = Math.floor(Date.now() / 1000) + 3600;
const roles = ["TUTOR", "ADMINISTRATIVO", "ADMINISTRADOR"];
const events = [];
const state = new Map();

function createUser(id, role = "TUTOR", options = {}) {
  return {
    id,
    role,
    name: options.name ?? `Prueba ${id}`,
    lastname: options.lastname ?? "T67",
    dni: options.dni ?? "12345678",
    cuil: "20123456789",
    email: options.email ?? `${id}@example.test`,
    user_phone: "1123456789",
    birthdate: "2000-02-29",
    occupation: "Docente",
    education_level: "TERCIARIO",
    email_verified_at: options.verified === false ? null : "2025-03-04T12:30:00Z",
    created_at: "2024-01-02T03:04:00Z",
    updated_at: "2025-02-03T04:05:00Z",
    deleted: false,
  };
}

for (const id of [
  "verified",
  "unverified",
  "change-ok",
  "change-409",
  "change-403",
  "change-404",
  "change-422",
  "delete-ok",
  "delete-409",
  "delete-403",
  "delete-404",
  "delete-422",
]) {
  state.set(id, createUser(id, "TUTOR", { verified: id !== "unverified" }));
}

state.set("admin-1", createUser("admin-1", "ADMINISTRADOR", {
  name: "Admin",
  lastname: "T67",
  email: "admin-t67@example.test",
}));
state.set("staff-1", createUser("staff-1", "ADMINISTRATIVO", {
  name: "Staff",
  lastname: "T67",
  email: "staff-t67@example.test",
}));

function send(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function envelope(data, message = "") {
  return { data, message, errors: [] };
}

function getRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return roles.includes(payload.role) ? payload.role : null;
  } catch {
    return null;
  }
}

function getActor(request) {
  const authorization = request.headers.authorization ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const role = getRole(token);

  if (!role) return null;
  return role === "ADMINISTRADOR"
    ? { id: "admin-1", role, name: "Admin", lastname: "T67", email: "admin-t67@example.test" }
    : { id: "staff-1", role, name: "Staff", lastname: "T67", email: "staff-t67@example.test" };
}

function recordEvent(request, status, body) {
  const bodyKeys = body && typeof body === "object" && !Array.isArray(body)
    ? Object.keys(body).sort()
    : [];
  events.push({
    method: request.method,
    path: new URL(request.url, "http://localhost").pathname,
    status,
    hasAuthorization: Boolean(request.headers.authorization),
    bodyKeys,
  });
}

function statusFor(id, action) {
  if (id.startsWith(`${action}-`)) {
    const status = Number(id.slice(action.length + 1));
    if ([401, 403, 404, 409, 422].includes(status)) return status;
  }
  return null;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  const chunks = [];

  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => {
    let body = null;
    try {
      body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : null;
    } catch {
      body = null;
    }

    if (url.pathname === "/__health") {
      send(response, 200, { ok: true });
      return;
    }
    if (url.pathname === "/__events") {
      send(response, 200, events);
      return;
    }

    let status = 200;
    let result;

    if (request.method === "POST" && url.pathname === "/api/auth/login") {
      const email = body?.email === "staff-t67@example.test"
        ? "staff-t67@example.test"
        : "admin-t67@example.test";
      const role = email.startsWith("staff-") ? "ADMINISTRATIVO" : "ADMINISTRADOR";
      const id = role === "ADMINISTRADOR" ? "admin-1" : "staff-1";
      const payload = Buffer.from(JSON.stringify({
        sub: id,
        email,
        role,
        exp: Math.floor(Date.now() / 1000) + 86400,
      })).toString("base64url");
      const token = `e30.${payload}.synthetic`;
      result = envelope({ token, user: { id, email } });
    } else if (request.method === "GET" && url.pathname === "/api/auth/me") {
      const actor = getActor(request);
      if (!actor) {
        status = 401;
        result = { data: null, message: "No autorizado.", errors: [] };
      } else {
        result = envelope({
          ...actor,
          user_phone: "1123456789",
          birthdate: "1980-01-01",
          email_verified_at: "2024-01-01T10:00:00Z",
          created_at: "2020-01-01T10:00:00Z",
          updated_at: "2025-01-01T10:00:00Z",
        });
      }
    } else if (request.method === "GET" && url.pathname === "/api/users") {
      const users = [...state.values()].filter((user) => !user.deleted && user.id !== "admin-1");
      const perPage = Number(url.searchParams.get("per_page") ?? 10);
      const currentPage = Number(url.searchParams.get("page") ?? 1);
      const lastPage = Math.max(1, Math.ceil(users.length / perPage));
      result = {
        ...envelope(users.slice((currentPage - 1) * perPage, currentPage * perPage)),
        meta: { current_page: currentPage, last_page: lastPage, per_page: perPage, total: users.length },
      };
    } else if (request.method === "GET" && url.pathname.startsWith("/api/users/")) {
      const id = decodeURIComponent(url.pathname.slice("/api/users/".length));
      const user = state.get(id);
      if (id === "forbidden-detail") {
        status = 403;
        result = { data: null, message: "Acceso denegado.", errors: [] };
      } else if (!user || user.deleted) {
        status = 404;
        result = { data: null, message: "No encontrado.", errors: [] };
      } else {
        const actor = getActor(request);
        const detail = { ...user };
        if (actor?.role === "ADMINISTRATIVO") {
          delete detail.email_verified_at;
          delete detail.created_at;
          delete detail.updated_at;
        }
        delete detail.deleted;
        result = envelope(detail);
      }
    } else if (request.method === "PUT" && /^\/api\/users\/[^/]+\/role$/.test(url.pathname)) {
      const id = decodeURIComponent(url.pathname.split("/")[3]);
      const user = state.get(id);
      const forcedStatus = statusFor(id, "change");
      status = forcedStatus ?? 200;
      if (status === 404 || !user || user.deleted) {
        status = 404;
        if (user) user.deleted = true;
        result = { data: null, message: "No encontrado.", errors: [] };
      } else if (status === 403) {
        result = { data: null, message: "Acceso denegado.", errors: [] };
      } else if (status === 409) {
        result = { data: null, message: "No se puede cambiar el rol por una regla de negocio.", errors: [] };
      } else if (status === 422) {
        result = { data: null, message: "Revisá el rol seleccionado.", errors: { newRole: ["El rol no es válido."] } };
      } else if (!roles.includes(body?.newRole)) {
        status = 422;
        result = { data: null, message: "Revisá el rol seleccionado.", errors: { newRole: ["El rol no es válido."] } };
      } else {
        user.role = body.newRole;
        result = envelope({ ...user, deleted: undefined }, "Rol actualizado desde el mock.");
      }
    } else if (request.method === "DELETE" && /^\/api\/users\/[^/]+$/.test(url.pathname)) {
      const id = decodeURIComponent(url.pathname.slice("/api/users/".length));
      const user = state.get(id);
      const forcedStatus = statusFor(id, "delete");
      status = forcedStatus ?? 200;
      if (status === 404 || !user || user.deleted) {
        status = 404;
        if (user) user.deleted = true;
        result = { data: null, message: "No encontrado.", errors: [] };
      } else if (status === 403) {
        result = { data: null, message: "Acceso denegado.", errors: [] };
      } else if (status === 409) {
        result = { data: null, message: "No se puede dar de baja al último administrador.", errors: [] };
      } else if (status === 422) {
        result = { data: null, message: "No se pudo completar la baja.", errors: { userId: ["Identificador no válido."] } };
      } else {
        user.deleted = true;
        result = envelope(null, "Baja lógica confirmada desde el mock.");
      }
    } else {
      status = 404;
      result = { data: null, message: "Ruta no simulada.", errors: [] };
    }

    recordEvent(request, status, body);
    send(response, status, result);
  });
});

server.listen(18773, "127.0.0.1", () => {
  process.stdout.write("T67 synthetic API listening on 127.0.0.1:18773\n");
});

