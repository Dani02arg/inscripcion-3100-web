import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ENROLLED_STUDENTS_REPORT_ENDPOINT_PATH,
  REPORT_API_NOT_CONFIGURED_MESSAGE,
  REPORT_REQUEST_TIMEOUT_MS,
  STAFF_REPORT_ENDPOINT_PATH,
  fetchEnrolledStudentsReport,
  fetchStaffReport,
} from "../../app/lib/api/reports.ts";
import {
  REPORT_ACCESS_DENIED_MESSAGE,
  REPORT_GENERIC_ERROR_MESSAGE,
  REPORT_INVALID_ARTIFACT_MESSAGE,
  REPORT_NETWORK_ERROR_MESSAGE,
  REPORT_SESSION_EXPIRED_MESSAGE,
  REPORT_TIMEOUT_ERROR_MESSAGE,
} from "../../app/lib/reports/constants.ts";
import type { EnrolledStudentsAppliedFilters } from "../../app/lib/reports/types.ts";

type MockResponse = {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: Headers;
  readonly arrayBuffer: () => Promise<ArrayBuffer>;
  readonly json: () => Promise<unknown>;
  readonly clone: () => MockResponse;
};

type MockFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<MockResponse>;

function textBuffer(text: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(text);
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
}

function binaryFetch(
  status: number,
  body: string | ArrayBuffer,
  headers: Record<string, string> = {},
): MockFetch {
  return async () => {
    const buffer = typeof body === "string" ? textBuffer(body) : body;
    const responseHeaders = new Headers(headers);
    const make = (): MockResponse => ({
      status,
      ok: status >= 200 && status < 300,
      headers: responseHeaders,
      arrayBuffer: async () => buffer,
      json: async () => {
        throw new Error("not json");
      },
      clone: () => make(),
    });
    return make();
  };
}

function jsonErrorFetch(status: number, body: unknown): MockFetch {
  return async () => {
    const buffer = textBuffer("");
    const responseHeaders = new Headers({ "content-type": "application/json" });
    const make = (): MockResponse => ({
      status,
      ok: status >= 200 && status < 300,
      headers: responseHeaders,
      arrayBuffer: async () => buffer,
      json: async () => body,
      clone: () => make(),
    });
    return make();
  };
}

function throwingFetch(name: string): MockFetch {
  return async () => {
    throw { name };
  };
}

const allFilters: EnrolledStudentsAppliedFilters = {
  year: null,
  studyYear: null,
  shift: null,
  speciality: null,
};

test("obtiene el listado de alumnos con headers, endpoint y sin query params cuando filtros son «Todos»", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  const fetchImpl: MockFetch = async (input, init) => {
    capturedUrl = input.toString();
    capturedInit = init;
    return binaryFetch(200, "xlsx-bytes", {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": 'attachment; filename="listado-alumnos.xlsx"',
    })(input, init);
  };

  const result = await fetchEnrolledStudentsReport("token-123", allFilters, {
    baseUrl: "http://localhost:8000",
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });

  assert.equal(REPORT_REQUEST_TIMEOUT_MS, 10_000);
  assert.equal(
    capturedUrl,
    `http://localhost:8000${ENROLLED_STUDENTS_REPORT_ENDPOINT_PATH}`,
  );
  assert.equal(capturedInit?.method, "GET");
  assert.equal(capturedInit?.cache, "no-store");
  assert.equal(capturedInit?.credentials, "omit");
  assert.equal(capturedInit?.redirect, "manual");
  assert.ok(capturedInit?.signal instanceof AbortSignal);

  const headers = new Headers(capturedInit?.headers);
  assert.equal(headers.get("authorization"), "Bearer token-123");

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.artifact.filename, "listado-alumnos.xlsx");
    assert.equal(
      result.artifact.contentType,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    assert.equal(result.artifact.byteLength, "xlsx-bytes".length);
    assert.equal(
      Buffer.from(result.artifact.base64, "base64").toString("utf8"),
      "xlsx-bytes",
    );
  }
});

test("serializa solo filtros aplicados del listado y omite «Todos/Todas»", async () => {
  let capturedUrl = "";

  const fetchImpl: MockFetch = async (input, init) => {
    capturedUrl = input.toString();
    return binaryFetch(200, "ok", {
      "content-type": "application/octet-stream",
    })(input, init);
  };

  const filters: EnrolledStudentsAppliedFilters = {
    year: 2026,
    studyYear: 3,
    shift: "morning",
    speciality: null,
  };

  await fetchEnrolledStudentsReport("t", filters, {
    baseUrl: "http://api.test",
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });

  const url = new URL(capturedUrl);
  assert.equal(url.pathname, ENROLLED_STUDENTS_REPORT_ENDPOINT_PATH);
  assert.equal(url.searchParams.get("year"), "2026");
  assert.equal(url.searchParams.get("studyYear"), "3");
  assert.equal(url.searchParams.get("shift"), "morning");
  assert.equal(url.searchParams.has("speciality"), false);
});

test("obtiene el padrón de personal desde su endpoint con bearer y metadatos", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  const fetchImpl: MockFetch = async (input, init) => {
    capturedUrl = input.toString();
    capturedInit = init;
    return binaryFetch(200, "%PDF-1.7", {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="padron-personal.pdf"',
    })(input, init);
  };

  const result = await fetchStaffReport("staff-token", {
    baseUrl: "http://api.test",
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });

  assert.equal(capturedUrl, `http://api.test${STAFF_REPORT_ENDPOINT_PATH}`);
  const headers = new Headers(capturedInit?.headers);
  assert.equal(headers.get("authorization"), "Bearer staff-token");

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.artifact.filename, "padron-personal.pdf");
    assert.equal(result.artifact.contentType, "application/pdf");
    assert.equal(result.artifact.byteLength, "%PDF-1.7".length);
  }
});

test("mapea 401, 403, 422 y errores inesperados con mensaje del servicio cuando existe", async () => {
  const unauthorized = await fetchStaffReport("t", {
    baseUrl: "http://api.test",
    fetchImpl: jsonErrorFetch(401, { message: "Token expirado" }) as unknown as typeof fetch,
  });
  assert.deepEqual(unauthorized, {
    ok: false,
    kind: "unauthorized",
    status: 401,
    message: "Token expirado",
  });

  const forbidden = await fetchStaffReport("t", {
    baseUrl: "http://api.test",
    fetchImpl: jsonErrorFetch(403, {}) as unknown as typeof fetch,
  });
  assert.deepEqual(forbidden, {
    ok: false,
    kind: "forbidden",
    status: 403,
    message: REPORT_ACCESS_DENIED_MESSAGE,
  });

  const validation = await fetchEnrolledStudentsReport("t", allFilters, {
    baseUrl: "http://api.test",
    fetchImpl: jsonErrorFetch(422, {
      message: "Los filtros no son válidos.",
      errors: { year: ["Año inválido"], studyYear: ["Año de estudio inválido"] },
    }) as unknown as typeof fetch,
  });
  assert.equal(validation.ok, false);
  if (!validation.ok) {
    assert.equal(validation.kind, "validation");
    assert.equal(validation.status, 422);
    assert.equal(validation.message, "Los filtros no son válidos.");
    assert.deepEqual(validation.fieldErrors, {
      year: "Año inválido",
      studyYear: "Año de estudio inválido",
    });
  }

  const redirect = await fetchStaffReport("t", {
    baseUrl: "http://api.test",
    fetchImpl: binaryFetch(302, "", {}) as unknown as typeof fetch,
  });
  assert.equal(redirect.ok, false);
  if (!redirect.ok) {
    assert.equal(redirect.kind, "failed");
    assert.equal(redirect.status, 302);
  }

  const unexpected = await fetchStaffReport("t", {
    baseUrl: "http://api.test",
    fetchImpl: jsonErrorFetch(500, { message: "Error interno" }) as unknown as typeof fetch,
  });
  assert.equal(unexpected.ok, false);
  if (!unexpected.ok) {
    assert.equal(unexpected.kind, "failed");
    assert.equal(unexpected.status, 500);
    assert.equal(unexpected.message, "Error interno");
  }
});

test("mapea timeout, red y artefacto inválido", async () => {
  const timeout = await fetchStaffReport("t", {
    baseUrl: "http://api.test",
    fetchImpl: throwingFetch("TimeoutError") as unknown as typeof fetch,
  });
  assert.deepEqual(timeout, {
    ok: false,
    kind: "timeout",
    status: null,
    message: REPORT_TIMEOUT_ERROR_MESSAGE,
  });

  const network = await fetchStaffReport("t", {
    baseUrl: "http://api.test",
    fetchImpl: throwingFetch("TypeError") as unknown as typeof fetch,
  });
  assert.deepEqual(network, {
    ok: false,
    kind: "network",
    status: null,
    message: REPORT_NETWORK_ERROR_MESSAGE,
  });

  const invalid = await fetchStaffReport("t", {
    baseUrl: "http://api.test",
    fetchImpl: binaryFetch(200, "", {
      "content-type": "application/pdf",
      "content-disposition": 'attachment; filename="padron.pdf"',
    }) as unknown as typeof fetch,
  });
  assert.deepEqual(invalid, {
    ok: false,
    kind: "invalid-artifact",
    status: 200,
    message: REPORT_INVALID_ARTIFACT_MESSAGE,
  });
});

test("falla con mensaje controlado si la API no está configurada", async () => {
  const result = await fetchStaffReport("t", {
    baseUrl: "",
    fetchImpl: binaryFetch(200, "x") as unknown as typeof fetch,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(result.status, null);
    assert.equal(result.message, REPORT_API_NOT_CONFIGURED_MESSAGE);
  }

  const fallback401 = await fetchStaffReport("t", {
    baseUrl: "http://api.test",
    fetchImpl: jsonErrorFetch(401, {}) as unknown as typeof fetch,
  });
  assert.equal(fallback401.ok, false);
  if (!fallback401.ok) {
    assert.equal(fallback401.message, REPORT_SESSION_EXPIRED_MESSAGE);
  }

  const fallback500 = await fetchStaffReport("t", {
    baseUrl: "http://api.test",
    fetchImpl: jsonErrorFetch(500, {}) as unknown as typeof fetch,
  });
  assert.equal(fallback500.ok, false);
  if (!fallback500.ok) {
    assert.equal(fallback500.message, REPORT_GENERIC_ERROR_MESSAGE);
  }
});
