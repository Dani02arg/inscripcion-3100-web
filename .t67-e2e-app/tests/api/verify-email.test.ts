import assert from "node:assert/strict";
import { test } from "node:test";

import type { VerifyEmailPayload } from "../../app/lib/api/verify-email.ts";
import {
  RESEND_CODE_ENDPOINT_PATH,
  RESEND_CODE_TYPE,
  VERIFICATION_REQUEST_TIMEOUT_MS,
  VERIFY_EMAIL_ENDPOINT_PATH,
  resendVerificationCode,
  verifyEmail,
} from "../../app/lib/api/verify-email.ts";
import { API_URL_ENV_VAR } from "../../app/lib/api/config.ts";
import { isRecord } from "../../app/lib/api/auth.ts";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

const payload: VerifyEmailPayload = { userId: "42", code: "12345" };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createJsonFetch(
  calls: FetchCall[],
  status: number,
  body: unknown,
): typeof fetch {
  return async (input, init) => {
    calls.push({ input, init });
    return jsonResponse(status, body);
  };
}

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

test("verifica con el contrato esperado y devuelve el éxito", async () => {
  const calls: FetchCall[] = [];
  const fetchImpl = createJsonFetch(calls, 200, {
    data: null,
    message: "Correo verificado",
    errors: [],
  });

  const result = await verifyEmail(payload, {
    baseUrl: "http://api.test/",
    fetchImpl,
  });

  assert.equal(VERIFICATION_REQUEST_TIMEOUT_MS, 10_000);
  assert.equal(VERIFY_EMAIL_ENDPOINT_PATH, "/api/auth/verify-email");
  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(
    call.input.toString(),
    "http://api.test/api/auth/verify-email",
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
    assert.deepEqual(parsedBody, { user_id: "42", code: "12345" });
    assert.equal("userId" in parsedBody, false);
  }

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.status, 200);
    assert.equal(result.message, "Correo verificado");
  }
});

test("considera éxito un 204 y un 200 sin cuerpo", async () => {
  const noContent: typeof fetch = async () =>
    new Response(null, { status: 204 });
  const emptyBody: typeof fetch = async () =>
    new Response("", { status: 200 });

  const noContentResult = await verifyEmail(payload, {
    baseUrl: "http://api.test",
    fetchImpl: noContent,
  });
  const emptyBodyResult = await verifyEmail(payload, {
    baseUrl: "http://api.test",
    fetchImpl: emptyBody,
  });

  assert.equal(noContentResult.ok, true);
  assert.equal(emptyBodyResult.ok, true);
});

test("trata un 2xx con errores como rechazo", async () => {
  const calls: FetchCall[] = [];
  const result = await verifyEmail(payload, {
    baseUrl: "http://api.test",
    fetchImpl: createJsonFetch(calls, 200, {
      message: "El código es incorrecto",
      errors: { code: ["Código inválido"] },
    }),
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "rejected");
    assert.equal(result.status, 200);
    assert.equal(result.message, "El código es incorrecto");
    assert.deepEqual(result.fieldErrors, { code: "Código inválido" });
  }
});

test("separa el error de la clave code de los errores generales en un 422", async () => {
  const result = await verifyEmail(payload, {
    baseUrl: "http://api.test",
    fetchImpl: createJsonFetch([], 422, {
      message: "No pudimos verificar tu correo",
      errors: {
        code: ["Código incorrecto"],
        intentos: ["Te quedan pocos intentos"],
      },
    }),
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "rejected");
    assert.equal(result.status, 422);
    assert.equal(result.message, "No pudimos verificar tu correo");
    assert.deepEqual(result.fieldErrors, { code: "Código incorrecto" });
    assert.deepEqual(result.errors, ["Te quedan pocos intentos"]);
  }
});

test("un 422 sin errores estructurados sigue siendo un rechazo", async () => {
  const result = await verifyEmail(payload, {
    baseUrl: "http://api.test",
    fetchImpl: createJsonFetch([], 422, {
      message: "No pudimos verificar tu correo.",
    }),
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "rejected");
    assert.equal(result.message, "No pudimos verificar tu correo.");
    assert.deepEqual(result.fieldErrors, {});
  }
});

test("clasifica el código vencido como expired", async () => {
  const withMessage = await verifyEmail(payload, {
    baseUrl: "http://api.test",
    fetchImpl: createJsonFetch([], 422, {
      message: "El código ha expirado. Solicitá uno nuevo.",
    }),
  });

  const withFieldError = await verifyEmail(payload, {
    baseUrl: "http://api.test",
    fetchImpl: createJsonFetch([], 422, {
      errors: { code: ["El código venció"] },
    }),
  });

  assert.equal(withMessage.ok, false);
  if (!withMessage.ok) {
    assert.equal(withMessage.kind, "expired");
    assert.match(withMessage.message, /expirado/i);
  }

  assert.equal(withFieldError.ok, false);
  if (!withFieldError.ok) {
    assert.equal(withFieldError.kind, "expired");
    assert.match(withFieldError.message, /venció/i);
  }
});

test("convierte 429, 403, 500 y 3xx en fallas", async () => {
  const cases: Array<{ status: number; body: unknown }> = [
    { status: 429, body: { message: "Demasiadas solicitudes" } },
    { status: 403, body: { message: "Prohibido" } },
    { status: 500, body: { message: "Error interno" } },
    { status: 302, body: { message: "Redirección inesperada" } },
  ];

  for (const item of cases) {
    const result = await verifyEmail(payload, {
      baseUrl: "http://api.test",
      fetchImpl: createJsonFetch([], item.status, item.body),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.kind, "failed");
      assert.equal(result.status, item.status);
    }
  }

  const withoutBody = await verifyEmail(payload, {
    baseUrl: "http://api.test",
    fetchImpl: async () => new Response(null, { status: 500 }),
  });
  assert.equal(withoutBody.ok, false);
  if (!withoutBody.ok) {
    assert.equal(withoutBody.status, 500);
    assert.match(withoutBody.message, /no se pudo verificar/i);
  }
});

test("un 2xx con cuerpo no JSON o no objeto es una falla", async () => {
  const nonJson: typeof fetch = async () =>
    new Response("no es json", { status: 200 });
  const jsonNull: typeof fetch = async () =>
    new Response("null", { status: 200 });

  const nonJsonResult = await verifyEmail(payload, {
    baseUrl: "http://api.test",
    fetchImpl: nonJson,
  });
  const jsonNullResult = await verifyEmail(payload, {
    baseUrl: "http://api.test",
    fetchImpl: jsonNull,
  });

  assert.equal(nonJsonResult.ok, false);
  if (!nonJsonResult.ok) {
    assert.equal(nonJsonResult.kind, "failed");
    assert.match(nonJsonResult.message, /formato esperado/i);
  }

  assert.equal(jsonNullResult.ok, false);
  if (!jsonNullResult.ok) {
    assert.equal(jsonNullResult.kind, "failed");
  }
});

test("convierte un error de red en falla general", async () => {
  const result = await verifyEmail(payload, {
    baseUrl: "http://api.test",
    fetchImpl: async () => {
      throw new TypeError("red no disponible");
    },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(result.status, null);
    assert.match(result.message, /no se pudo conectar/i);
  }
});

test("aborta por timeout y devuelve una falla general", async () => {
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
          reject(new DOMException("La petición fue abortada", "AbortError")),
        { once: true },
      );
    });

  const keepAlive = setTimeout(() => undefined, 25);

  try {
    const result = await verifyEmail(payload, {
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
  const result = await verifyEmail(payload, {
    baseUrl: "http://api.test",
    fetchImpl: async () => {
      throw new DOMException("Timeout", "TimeoutError");
    },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /tardó demasiado/i);
  }
});

test("no llama al servicio y avisa cuando falta LARAVEL_API_URL", async () => {
  const calls: FetchCall[] = [];
  const { result, messages } = await captureConsoleError(() =>
    withApiUrlEnv(undefined, () =>
      verifyEmail(payload, { fetchImpl: createJsonFetch(calls, 200, {}) }),
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
  await withApiUrlEnv("  http://env.test/  ", () =>
    verifyEmail(payload, {
      fetchImpl: createJsonFetch(calls, 200, { errors: [] }),
    }),
  );

  assert.equal(
    calls[0]?.input.toString(),
    "http://env.test/api/auth/verify-email",
  );
});

test("reenvía con el contrato esperado y devuelve el éxito", async () => {
  const calls: FetchCall[] = [];
  const result = await resendVerificationCode("ana@example.com", {
    baseUrl: "http://api.test/",
    fetchImpl: createJsonFetch(calls, 200, {
      message: "Código reenviado",
      errors: [],
    }),
  });

  assert.equal(RESEND_CODE_ENDPOINT_PATH, "/api/auth/resend-code");
  assert.equal(RESEND_CODE_TYPE, "REGISTER");
  assert.equal(calls.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(
    call.input.toString(),
    "http://api.test/api/auth/resend-code",
  );

  const body = call.init?.body;
  if (typeof body !== "string") {
    assert.fail("El cuerpo de la petición debe ser JSON serializado.");
  }

  assert.deepEqual(JSON.parse(body), {
    email: "ana@example.com",
    type: "REGISTER",
  });
  assert.equal(body.includes("user_id"), false);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.message, "Código reenviado");
  }
});

test("clasifica el rechazo y la falla del reenvío", async () => {
  const rejected = await resendVerificationCode("ana@example.com", {
    baseUrl: "http://api.test",
    fetchImpl: createJsonFetch([], 422, {
      message: "Todavía no podés reenviar",
    }),
  });
  const rejectedWithErrors = await resendVerificationCode("ana@example.com", {
    baseUrl: "http://api.test",
    fetchImpl: createJsonFetch([], 200, {
      errors: { email: ["No se pudo reenviar"] },
    }),
  });
  const failed = await resendVerificationCode("ana@example.com", {
    baseUrl: "http://api.test",
    fetchImpl: createJsonFetch([], 500, { message: "Error interno" }),
  });

  assert.equal(rejected.ok, false);
  if (!rejected.ok) {
    assert.equal(rejected.kind, "rejected");
    assert.equal(rejected.message, "Todavía no podés reenviar");
    assert.deepEqual(rejected.errors, []);
  }

  assert.equal(rejectedWithErrors.ok, false);
  if (!rejectedWithErrors.ok) {
    assert.equal(rejectedWithErrors.kind, "rejected");
    assert.deepEqual(rejectedWithErrors.errors, ["No se pudo reenviar"]);
  }

  assert.equal(failed.ok, false);
  if (!failed.ok) {
    assert.equal(failed.kind, "failed");
    assert.equal(failed.status, 500);
    assert.equal(failed.message, "Error interno");
  }
});

test("un 2xx del reenvío con cuerpo ilegible es una falla", async () => {
  const result = await resendVerificationCode("ana@example.com", {
    baseUrl: "http://api.test",
    fetchImpl: async () => new Response("no es json", { status: 200 }),
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.match(result.message, /formato esperado/i);
  }
});
