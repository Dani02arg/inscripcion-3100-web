import assert from "node:assert/strict";
import { test } from "node:test";

import { ApiRequestError, fetchAPI } from "../../app/lib/api-client.ts";

const originalFetch = globalThis.fetch;

function stubFetch(
  impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): void {
  globalThis.fetch = impl as typeof fetch;
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("adjunta el Bearer y el Content-Type por defecto", async () => {
  let captured: RequestInit | undefined;

  stubFetch(async (_input, init) => {
    captured = init;
    return new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  const result = await fetchAPI<{ ok: boolean }>(
    "http://api.test/privado",
    {},
    "jwt-token",
  );

  const headers = new Headers(captured?.headers);
  assert.equal(headers.get("authorization"), "Bearer jwt-token");
  assert.equal(headers.get("content-type"), "application/json");
  assert.deepEqual(result, { ok: true });
});

test("un 401 lanza unauthorized con el mensaje de sesión expirada", async () => {
  stubFetch(async () => new Response("{}", { status: 401 }));

  await assert.rejects(
    () => fetchAPI("http://api.test/x", {}, "jwt-token"),
    (error: unknown) =>
      error instanceof ApiRequestError &&
      error.kind === "unauthorized" &&
      error.status === 401 &&
      error.message === "Tu sesión expiró. Iniciá sesión nuevamente.",
  );
});

test("un 403 lanza forbidden con el mensaje de acceso denegado", async () => {
  stubFetch(async () => new Response("{}", { status: 403 }));

  await assert.rejects(
    () => fetchAPI("http://api.test/x", {}, "jwt-token"),
    (error: unknown) =>
      error instanceof ApiRequestError &&
      error.kind === "forbidden" &&
      error.message === "No tenés permisos para acceder a esta sección.",
  );
});

test("un 422 lanza validation", async () => {
  stubFetch(async () => new Response("{}", { status: 422 }));

  await assert.rejects(
    () => fetchAPI("http://api.test/x", {}, "jwt-token"),
    (error: unknown) =>
      error instanceof ApiRequestError && error.kind === "validation",
  );
});

test("un 500 lanza server", async () => {
  stubFetch(async () => new Response("{}", { status: 500 }));

  await assert.rejects(
    () => fetchAPI("http://api.test/x", {}, "jwt-token"),
    (error: unknown) =>
      error instanceof ApiRequestError &&
      error.kind === "server" &&
      error.status === 500,
  );
});

test("un error de red lanza network", async () => {
  stubFetch(async () => {
    throw new Error("network down");
  });

  await assert.rejects(
    () => fetchAPI("http://api.test/x", {}, "jwt-token"),
    (error: unknown) =>
      error instanceof ApiRequestError && error.kind === "network",
  );
});

test("un cuerpo sin JSON lanza invalid_response", async () => {
  stubFetch(
    async () => new Response("no json", { status: 200 }),
  );

  await assert.rejects(
    () => fetchAPI("http://api.test/x", {}, "jwt-token"),
    (error: unknown) =>
      error instanceof ApiRequestError && error.kind === "invalid_response",
  );
});
