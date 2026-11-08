import assert from "node:assert/strict";
import { test } from "node:test";

import type { RegisterPayload } from "../../app/lib/validation/register.ts";
import {
  REGISTER_REQUEST_TIMEOUT_MS,
  isRecord,
  registerUser,
} from "../../app/lib/api/auth.ts";
import { API_URL_ENV_VAR } from "../../app/lib/api/config.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

const payload: RegisterPayload = {
  dni: "12345678",
  cuil: "20123456789",
  name: "Ana",
  lastname: "Pérez",
  email: "ana@example.com",
  password: "Abcdef1!",
  user_phone: "1123456789",
  birthdate: "2000-01-01",
};

test("hace POST con el contrato esperado y devuelve el éxito", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({
        data: { id: 1 },
        message: "Registro exitoso",
        errors: [],
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  const result = await registerUser(payload, {
    baseUrl: "http://api.test/",
    fetchImpl,
  });

  assert.equal(REGISTER_REQUEST_TIMEOUT_MS, 10_000);
  assert.equal(calls.length, 1);
  const call = calls[0];
  assert.ok(call);
  assert.equal(
    call.input.toString(),
    "http://api.test/api/auth/register",
  );
  assert.equal(call.init?.method, "POST");
  assert.equal(call.init?.credentials, "omit");
  assert.equal(call.init?.cache, "no-store");
  assert.equal(call.init?.redirect, "manual");
  assert.ok(call.init?.signal instanceof AbortSignal);

  const headers = new Headers(call.init?.headers);
  assert.equal(headers.get("content-type"), "application/json");
  assert.equal(headers.get("accept"), "application/json");

  const body = call.init?.body;
  if (typeof body !== "string") {
    assert.fail("El cuerpo de la petición debe ser JSON serializado.");
  }

  const parsedBody: unknown = JSON.parse(body);
  assert.equal(isRecord(parsedBody), true);
  if (isRecord(parsedBody)) {
    assert.deepEqual(
      Object.keys(parsedBody).sort(),
      [
        "birthdate",
        "cuil",
        "dni",
        "email",
        "lastname",
        "name",
        "password",
        "user_phone",
      ],
    );
    assert.equal(parsedBody.password, payload.password);
    assert.equal("confirmPassword" in parsedBody, false);
  }

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, { id: 1 });
    assert.equal(result.message, "Registro exitoso");
  }

  assert.equal(
    JSON.stringify(result).includes(payload.password),
    false,
  );
});

test("devuelve errores por campo de un 422", async () => {
  const fetchImpl: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        message: "La validación falló",
        errors: {
          email: ["Correo inválido"],
          dni: ["DNI inválido"],
        },
      }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      },
    );

  const result = await registerUser(payload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 422);
    assert.equal(result.message, "La validación falló");
    assert.deepEqual(result.fieldErrors, {
      email: "Correo inválido",
      dni: "DNI inválido",
    });
  }

  assert.equal(
    JSON.stringify(result).includes(payload.password),
    false,
  );
});

test("convierte 500, 3xx y cuerpos no JSON en error general", async () => {
  const serverError: typeof fetch = async () =>
    new Response(
      JSON.stringify({ message: "Error interno" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );

  const errorResult = await registerUser(payload, {
    baseUrl: "http://api.test",
    fetchImpl: serverError,
  });
  assert.equal(errorResult.ok, false);
  if (!errorResult.ok) {
    assert.equal(errorResult.status, 500);
    assert.equal(errorResult.message, "Error interno");
  }

  const redirect: typeof fetch = async () =>
    new Response(
      JSON.stringify({ message: "Redirección inesperada" }),
      {
        status: 302,
        headers: { "Content-Type": "application/json" },
      },
    );

  const redirectResult = await registerUser(payload, {
    baseUrl: "http://api.test",
    fetchImpl: redirect,
  });
  assert.equal(redirectResult.ok, false);
  if (!redirectResult.ok) {
    assert.equal(redirectResult.status, 302);
  }

  const nonJson: typeof fetch = async () =>
    new Response("no es json", { status: 200 });

  const nonJsonResult = await registerUser(payload, {
    baseUrl: "http://api.test",
    fetchImpl: nonJson,
  });
  assert.equal(nonJsonResult.ok, false);
  if (!nonJsonResult.ok) {
    assert.match(nonJsonResult.message, /formato esperado/i);
  }
});

test("convierte un error de red en error general", async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new TypeError("red no disponible");
  };

  const result = await registerUser(payload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, null);
    assert.match(result.message, /no se pudo conectar/i);
  }
});

test("aborta por timeout y devuelve un error general", async () => {
  const fetchImpl: typeof fetch = (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;

      if (!signal) {
        reject(new Error("La petición no recibió AbortSignal."));
        return;
      }

      signal.addEventListener(
        "abort",
        () =>
          reject(
            new DOMException("La petición fue abortada", "AbortError"),
          ),
        { once: true },
      );
    });

  const keepAlive = setTimeout(() => undefined, 25);

  try {
    const result = await registerUser(payload, {
      baseUrl: "http://api.test",
      timeoutMs: 5,
      fetchImpl,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, null);
      assert.match(result.message, /tardó demasiado/i);
    }
  } finally {
    clearTimeout(keepAlive);
  }
});

test("reconoce el TimeoutError nativo como timeout", async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new DOMException(
      "La operación fue abortada por timeout",
      "TimeoutError",
    );
  };

  const result = await registerUser(payload, {
    baseUrl: "http://api.test",
    fetchImpl,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, null);
    assert.match(result.message, /tardó demasiado/i);
  }
});

async function withApiUrlEnv<T>(
  value: string | undefined,
  run: () => Promise<T>,
): Promise<T> {
  const original = process.env[API_URL_ENV_VAR];

  if (value === undefined) {
    delete process.env[API_URL_ENV_VAR];
  } else {
    process.env[API_URL_ENV_VAR] = value;
  }

  try {
    return await run();
  } finally {
    if (original === undefined) {
      delete process.env[API_URL_ENV_VAR];
    } else {
      process.env[API_URL_ENV_VAR] = original;
    }
  }
}

async function captureConsoleError<T>(
  run: () => Promise<T>,
): Promise<{ result: T; messages: string[] }> {
  const original = console.error;
  const messages: string[] = [];

  console.error = (...args: unknown[]) => {
    messages.push(args.map((arg) => String(arg)).join(" "));
  };

  try {
    return { result: await run(), messages };
  } finally {
    console.error = original;
  }
}

function createAcceptedFetch(calls: FetchCall[]): typeof fetch {
  return async (input, init) => {
    calls.push({ input, init });

    return new Response(
      JSON.stringify({ data: null, message: "ok", errors: [] }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  };
}

test("no llama al servicio y avisa cuando falta LARAVEL_API_URL", async () => {
  const calls: FetchCall[] = [];
  const { result, messages } = await captureConsoleError(() =>
    withApiUrlEnv(undefined, () =>
      registerUser(payload, { fetchImpl: createAcceptedFetch(calls) }),
    ),
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, null);
    assert.match(result.message, /no está disponible/i);
  }
  assert.equal(calls.length, 0);
  assert.equal(messages.length, 1);
  assert.match(messages[0] ?? "", /LARAVEL_API_URL/);
});

test("usa LARAVEL_API_URL y normaliza espacios y barra final", async () => {
  const calls: FetchCall[] = [];
  const result = await withApiUrlEnv("  http://env.test/  ", () =>
    registerUser(payload, { fetchImpl: createAcceptedFetch(calls) }),
  );

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0]?.input.toString(),
    "http://env.test/api/auth/register",
  );
});

test("el baseUrl explícito tiene prioridad sobre LARAVEL_API_URL", async () => {
  const calls: FetchCall[] = [];
  await withApiUrlEnv("http://env.test", () =>
    registerUser(payload, {
      baseUrl: "http://api.test",
      fetchImpl: createAcceptedFetch(calls),
    }),
  );

  assert.equal(
    calls[0]?.input.toString(),
    "http://api.test/api/auth/register",
  );
});

test("rechaza una LARAVEL_API_URL sin esquema http y no llama al servicio", async () => {
  const calls: FetchCall[] = [];
  const { result, messages } = await captureConsoleError(() =>
    withApiUrlEnv("localhost:8000", () =>
      registerUser(payload, { fetchImpl: createAcceptedFetch(calls) }),
    ),
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, null);
    assert.match(result.message, /no está disponible/i);
  }
  assert.equal(calls.length, 0);
  assert.match(messages[0] ?? "", /http/i);
});
