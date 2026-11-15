import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REGISTRATION_FORM_CONNECTION_ERROR_MESSAGE,
  REGISTRATION_FORM_NOT_CONFIGURED_MESSAGE,
  REGISTRATION_FORM_NOT_FOUND_MESSAGE,
  REGISTRATION_FORM_TIMEOUT_ERROR_MESSAGE,
  downloadRegistrationForm,
} from "../../app/lib/api/registration-form.ts";

type PdfMockResponse = {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: { get(name: string): string | null };
  readonly blob: () => Promise<Blob>;
};

type PdfMockFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<PdfMockResponse>;

function pdfFetch(
  status: number,
  headers: Record<string, string> = {},
  blob: Blob = new Blob(["%PDF-1.4"]),
): PdfMockFetch {
  return async () => ({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name) => headers[name] ?? null },
    blob: async () => blob,
  });
}

function throwingFetch(name: string): PdfMockFetch {
  return async () => {
    throw { name };
  };
}

test("descarga el PDF y extrae el nombre de Content-Disposition", async () => {
  const result = await downloadRegistrationForm("token", "uuid-1", {
    baseUrl: "http://localhost:8000",
    fetchImpl: pdfFetch(
      200,
      {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="inscripcion-uuid-1.pdf"',
      },
    ) as unknown as typeof fetch,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.filename, "inscripcion-uuid-1.pdf");
    assert.equal(result.contentType, "application/pdf");
    assert.ok(result.blob instanceof Blob);
  }
});

test("un PDF sin Content-Disposition conserva el nombre vacío", async () => {
  const result = await downloadRegistrationForm("token", "uuid-1", {
    baseUrl: "http://localhost:8000",
    fetchImpl: pdfFetch(200) as unknown as typeof fetch,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.filename, "");
  }
});

test("clasifica 401, 403 y 404", async () => {
  const unauthorized = await downloadRegistrationForm("token", "uuid-1", {
    baseUrl: "http://localhost:8000",
    fetchImpl: pdfFetch(401) as unknown as typeof fetch,
  });
  assert.equal(unauthorized.ok, false);
  if (!unauthorized.ok) {
    assert.equal(unauthorized.status, 401);
  }

  const forbidden = await downloadRegistrationForm("token", "uuid-1", {
    baseUrl: "http://localhost:8000",
    fetchImpl: pdfFetch(403) as unknown as typeof fetch,
  });
  assert.equal(forbidden.ok, false);

  const notFound = await downloadRegistrationForm("token", "uuid-1", {
    baseUrl: "http://localhost:8000",
    fetchImpl: pdfFetch(404) as unknown as typeof fetch,
  });
  assert.equal(notFound.ok, false);
  if (!notFound.ok) {
    assert.equal(notFound.message, REGISTRATION_FORM_NOT_FOUND_MESSAGE);
  }
});

test("clasifica tiempo agotado y error de conexión", async () => {
  const timeout = await downloadRegistrationForm("token", "uuid-1", {
    baseUrl: "http://localhost:8000",
    fetchImpl: throwingFetch("TimeoutError") as unknown as typeof fetch,
  });
  assert.equal(timeout.ok, false);
  if (!timeout.ok) {
    assert.equal(timeout.message, REGISTRATION_FORM_TIMEOUT_ERROR_MESSAGE);
  }

  const connection = await downloadRegistrationForm("token", "uuid-1", {
    baseUrl: "http://localhost:8000",
    fetchImpl: throwingFetch("TypeError") as unknown as typeof fetch,
  });
  assert.equal(connection.ok, false);
  if (!connection.ok) {
    assert.equal(connection.message, REGISTRATION_FORM_CONNECTION_ERROR_MESSAGE);
  }
});

test("sin identificador devuelve no encontrado sin llamar a la red", async () => {
  const result = await downloadRegistrationForm("token", "  ", {
    baseUrl: "http://localhost:8000",
    fetchImpl: pdfFetch(200) as unknown as typeof fetch,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, REGISTRATION_FORM_NOT_FOUND_MESSAGE);
  }
});

test("sin configuración devuelve el aviso de servicio no disponible", async () => {
  const result = await downloadRegistrationForm("token", "uuid-1", {
    baseUrl: "",
    fetchImpl: pdfFetch(200) as unknown as typeof fetch,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.message, REGISTRATION_FORM_NOT_CONFIGURED_MESSAGE);
  }
});
