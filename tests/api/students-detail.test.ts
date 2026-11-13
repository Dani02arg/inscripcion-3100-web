import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ACCESS_DENIED_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "../../app/lib/auth/types.ts";
import {
  STUDENTS_LOAD_ERROR_MESSAGE,
  STUDENT_NOT_FOUND_MESSAGE,
  getStudentDetail,
  getStudentTutor,
} from "../../app/lib/api/students.ts";

interface FetchCall {
  readonly url: string;
  readonly init?: RequestInit;
}

function student(): Record<string, unknown> {
  return {
    id: "uuid-1",
    studentDni: "50123456",
    studentCuil: "20501234567",
    firstName: "Lucas",
    lastName: "Pérez",
    birthdate: "2010-08-20",
    gender: "Masculino",
  };
}

function tutor(): Record<string, unknown> {
  return {
    name: "Andrés",
    lastname: "Pérez",
    email: "andres@example.com",
    user_phone: "3875123159",
  };
}

function makeFetch(
  body: unknown,
  status = 200,
): {
  readonly fetchImpl: typeof fetch;
  readonly calls: FetchCall[];
} {
  const calls: FetchCall[] = [];

  const fetchImpl: typeof fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    calls.push({ url, init });

    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };

  return { fetchImpl, calls };
}

const OPTIONS = { baseUrl: "http://api.test" };

test("el detalle consulta el alumno con Bearer y opciones seguras", async () => {
  const { fetchImpl, calls } = makeFetch({ data: student() });

  const result = await getStudentDetail("token-1", "uuid-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.student.id, "uuid-1");
  }

  assert.equal(calls.length, 1);
  assert.ok(calls[0]?.url.endsWith("/api/students/uuid-1"));

  const init = calls[0]?.init;
  assert.ok(init);
  const headers = new Headers(init.headers);
  assert.equal(headers.get("Authorization"), "Bearer token-1");
  assert.equal(init.credentials, "omit");
  assert.equal(init.cache, "no-store");
  assert.equal(init.redirect, "manual");
});

test("el detalle codifica el identificador y lo recorta", async () => {
  const { fetchImpl, calls } = makeFetch({ data: student() });

  await getStudentDetail("token-1", " id con espacio ", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.ok(
    calls[0]?.url.endsWith("/api/students/id%20con%20espacio"),
  );
});

test("un identificador vacío no consulta y devuelve no encontrado", async () => {
  const { fetchImpl, calls } = makeFetch({ data: student() });

  const result = await getStudentDetail("token-1", "   ", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, false);
  assert.equal(calls.length, 0);

  if (!result.ok) {
    assert.equal(result.kind, "not_found");
    assert.equal(result.status, null);
    assert.equal(result.message, STUDENT_NOT_FOUND_MESSAGE);
  }
});

test("el detalle clasifica sesión, permisos, no encontrado y error", async () => {
  const statuses = [
    { status: 401, kind: "unauthorized", message: SESSION_EXPIRED_MESSAGE },
    { status: 403, kind: "forbidden", message: ACCESS_DENIED_MESSAGE },
    { status: 404, kind: "not_found", message: STUDENT_NOT_FOUND_MESSAGE },
    { status: 500, kind: "failed", message: STUDENTS_LOAD_ERROR_MESSAGE },
  ] as const;

  for (const { status, kind, message } of statuses) {
    const { fetchImpl } = makeFetch({}, status);
    const result = await getStudentDetail("token-1", "uuid-1", {
      ...OPTIONS,
      fetchImpl,
    });

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.equal(result.kind, kind);
      assert.equal(result.message, message);
    }
  }
});

test("un detalle con cuerpo inválido no se acepta", async () => {
  const { fetchImpl } = makeFetch({ data: {} });
  const result = await getStudentDetail("token-1", "uuid-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.kind, "failed");
  }
});

test("el detalle informa red y tiempo agotado como fallo", async () => {
  const network: typeof fetch = async () => {
    throw new Error("sin red");
  };
  const timeout: typeof fetch = async () => {
    const error = new Error("tiempo agotado");
    error.name = "TimeoutError";
    throw error;
  };

  for (const fetchImpl of [network, timeout]) {
    const result = await getStudentDetail("token-1", "uuid-1", {
      ...OPTIONS,
      fetchImpl,
    });

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.equal(result.kind, "failed");
      assert.equal(result.status, null);
    }
  }
});

test("el tutor consulta la ruta anidada con el identificador codificado", async () => {
  const { fetchImpl, calls } = makeFetch({ data: tutor() });

  const result = await getStudentTutor("token-1", "uuid-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.tutor.email, "andres@example.com");
  }

  assert.ok(
    calls[0]?.url.endsWith("/api/students/uuid-1/tutor"),
  );
});

test("un identificador vacío del tutor no consulta y devuelve no encontrado", async () => {
  const { fetchImpl, calls } = makeFetch({ data: tutor() });

  const result = await getStudentTutor("token-1", "", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, false);
  assert.equal(calls.length, 0);

  if (!result.ok) {
    assert.equal(result.kind, "not_found");
  }
});

test("el tutor clasifica no encontrado, permisos y error", async () => {
  const statuses = [
    { status: 403, kind: "forbidden" },
    { status: 404, kind: "not_found" },
    { status: 500, kind: "failed" },
  ] as const;

  for (const { status, kind } of statuses) {
    const { fetchImpl } = makeFetch({}, status);
    const result = await getStudentTutor("token-1", "uuid-1", {
      ...OPTIONS,
      fetchImpl,
    });

    assert.equal(result.ok, false);

    if (!result.ok) {
      assert.equal(result.kind, kind);
    }
  }
});

test("el fallo del tutor no altera el detalle del alumno", async () => {
  const fetchImpl: typeof fetch = async (input) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    if (url.endsWith("/tutor")) {
      return new Response(JSON.stringify({}), { status: 404 });
    }

    return new Response(JSON.stringify({ data: student() }), {
      status: 200,
    });
  };

  const detail = await getStudentDetail("token-1", "uuid-1", {
    ...OPTIONS,
    fetchImpl,
  });
  const tutorResult = await getStudentTutor("token-1", "uuid-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(detail.ok, true);
  assert.equal(tutorResult.ok, false);

  if (!tutorResult.ok) {
    assert.equal(tutorResult.kind, "not_found");
  }
});

test("el tutor informa un fallo de transporte", async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new Error("sin red");
  };

  const result = await getStudentTutor("token-1", "uuid-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(result.status, null);
  }
});
