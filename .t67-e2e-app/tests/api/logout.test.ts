import assert from "node:assert/strict";
import { test } from "node:test";

import {
  LOGOUT_ENDPOINT_PATH,
  LOGOUT_REQUEST_TIMEOUT_MS,
  notifyLogout,
} from "../../app/lib/api/logout.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

test("notifyLogout hace POST con Bearer y el contrato esperado", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ message: "Sesión cerrada." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await notifyLogout("jwt-token", {
    baseUrl: "http://api.test/",
    fetchImpl,
  });

  assert.equal(LOGOUT_ENDPOINT_PATH, "/api/auth/logout");
  assert.equal(LOGOUT_REQUEST_TIMEOUT_MS, 5_000);
  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(call.input.toString(), "http://api.test/api/auth/logout");
  assert.equal(call.init?.method, "POST");
  assert.equal(call.init?.credentials, "omit");
  assert.equal(call.init?.cache, "no-store");
  assert.equal(call.init?.redirect, "manual");
  assert.ok(call.init?.signal instanceof AbortSignal);

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("authorization"), "Bearer jwt-token");
});

test("un error de red devuelve ok false sin lanzar", async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new Error("network down");
  };

  const result = await notifyLogout("jwt-token", {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);
});

test("sin configuración no llama a fetch y devuelve ok false", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response("{}", { status: 200 });
  };

  const result = await notifyLogout("jwt-token", {
    baseUrl: "",
    fetchImpl,
  });

  assert.equal(calls.length, 0);
  assert.equal(result.ok, false);
});
