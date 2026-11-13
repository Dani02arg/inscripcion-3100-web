import assert from "node:assert/strict";
import { test } from "node:test";

import {
  STUDENTS_MAX_PAGES,
  STUDENTS_PAGE_SIZE,
  listAllStudents,
  listMyStudents,
  listStudentsPage,
} from "../../app/lib/api/students.ts";
import { clearStudentFilters } from "../../app/lib/students/list.ts";

interface FetchCall {
  readonly url: string;
  readonly init?: RequestInit;
}

function student(id: string): Record<string, unknown> {
  return {
    id,
    studentDni: "50123456",
    studentCuil: "20501234567",
    firstName: "Lucas",
    lastName: "Pérez",
    birthdate: "2010-08-20",
    gender: "Masculino",
  };
}

function meta(
  page: number,
  lastPage: number,
  total: number,
  perPage = STUDENTS_PAGE_SIZE,
): Record<string, unknown> {
  return {
    current_page: page,
    last_page: lastPage,
    per_page: perPage,
    total,
  };
}

function pageBody(
  page: number,
  lastPage: number,
  total: number,
  students: readonly unknown[],
): Record<string, unknown> {
  return {
    data: students,
    meta: meta(page, lastPage, total),
  };
}

function makeFetch(
  bodies: Readonly<Record<number, unknown>>,
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

    const page = Number(new URL(url).searchParams.get("page") ?? "1");
    const body = bodies[page];

    if (body === undefined) {
      return new Response("{}", { status: 500 });
    }

    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };

  return { fetchImpl, calls };
}

const OPTIONS = { baseUrl: "http://api.test" };

test("el listado propio consulta /api/students/me con Bearer", async () => {
  const { fetchImpl, calls } = makeFetch({
    1: { data: [student("a"), student("b")] },
  });

  const result = await listMyStudents("token-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.students.length, 2);
    assert.equal(result.meta.total, 2);
  }

  assert.equal(calls.length, 1);
  assert.ok(calls[0]?.url.endsWith("/api/students/me"));

  const init = calls[0]?.init;
  assert.ok(init);
  const headers = new Headers(init.headers);
  assert.equal(headers.get("Authorization"), "Bearer token-1");
  assert.equal(init.credentials, "omit");
  assert.equal(init.cache, "no-store");
  assert.equal(init.redirect, "manual");
});

test("el listado propio informa un fallo de transporte", async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new Error("sin red");
  };

  const result = await listMyStudents("token-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.kind, "failed");
    assert.equal(result.status, null);
  }
});

test("el listado propio respeta 403", async () => {
  const { fetchImpl } = makeFetch({ 1: {} }, 403);
  const result = await listMyStudents("token-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.kind, "forbidden");
  }
});

test("el padrón completo pide per_page=100 y una sola página", async () => {
  const { fetchImpl, calls } = makeFetch({
    1: pageBody(1, 1, 2, [student("a"), student("b")]),
  });

  const result = await listAllStudents("token-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.students.length, 2);
    assert.equal(result.meta.total, 2);
    assert.equal(result.meta.currentPage, 1);
  }

  assert.equal(calls.length, 1);
  const params = new URL(calls[0]?.url ?? "").searchParams;
  assert.equal(params.get("per_page"), "100");
  assert.equal(params.get("page"), "1");
  assert.equal(params.get("studentDni"), null);
  assert.equal(params.get("firstName"), null);
});

test("el padrón completo recorre todas las páginas y concatena", async () => {
  const { fetchImpl, calls } = makeFetch({
    1: pageBody(1, 3, 3, [student("a")]),
    2: pageBody(2, 3, 3, [student("b")]),
    3: pageBody(3, 3, 3, [student("c")]),
  });

  const result = await listAllStudents("token-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.deepEqual(
      result.students.map((item) => item.id),
      ["a", "b", "c"],
    );
    assert.equal(result.meta.total, 3);
    assert.equal(
      result.meta.lastPage,
      Math.max(1, Math.ceil(3 / STUDENTS_PAGE_SIZE)),
    );
  }

  assert.deepEqual(
    calls.map(
      (call) => new URL(call.url).searchParams.get("page"),
    ),
    ["1", "2", "3"],
  );
});

test("una página con metadatos inválidos falla sin datos parciales", async () => {
  const { fetchImpl, calls } = makeFetch({
    1: pageBody(1, 2, 2, [student("a")]),
    2: { data: [student("b")], meta: {} },
  });

  const result = await listAllStudents("token-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, false);
  assert.equal(calls.length, 2);

  if (!result.ok) {
    assert.equal(result.kind, "failed");
  }
});

test("los metadatos inválidos de la primera página no se aceptan", async () => {
  const { fetchImpl, calls } = makeFetch({
    1: { data: [student("a")], meta: {} },
  });

  const result = await listAllStudents("token-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, false);
  assert.equal(calls.length, 1);
});

test("se rechaza un padrón que supera el tope de páginas", async () => {
  const { fetchImpl, calls } = makeFetch({
    1: pageBody(1, STUDENTS_MAX_PAGES + 1, 100, [student("a")]),
  });

  const result = await listAllStudents("token-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, false);
  assert.equal(calls.length, 1);

  if (!result.ok) {
    assert.equal(result.kind, "failed");
  }
});

test("un crecimiento posterior del tope también se rechaza", async () => {
  const { fetchImpl, calls } = makeFetch({
    1: pageBody(1, 2, 2, [student("a")]),
    2: pageBody(2, STUDENTS_MAX_PAGES + 1, 2, [student("b")]),
  });

  const result = await listAllStudents("token-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, false);
  assert.equal(calls.length, 2);
});

test("un 500 en una página posterior se propaga sin concatenar", async () => {
  const fetchImpl: typeof fetch = async (input) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const page = new URL(url).searchParams.get("page");

    if (page === "1") {
      return new Response(
        JSON.stringify(pageBody(1, 2, 2, [student("a")])),
        { status: 200 },
      );
    }

    return new Response("{}", { status: 500 });
  };

  const result = await listAllStudents("token-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, false);
});

test("una página del padrón incluye los filtros en la consulta", async () => {
  const { fetchImpl, calls } = makeFetch({
    2: pageBody(2, 2, 0, []),
  });

  const result = await listStudentsPage(
    "token-1",
    {
      ...clearStudentFilters(),
      studentDni: "50123456",
      firstName: "Lucas",
    },
    2,
    { ...OPTIONS, fetchImpl },
  );

  assert.equal(result.ok, true);

  const params = new URL(calls[0]?.url ?? "").searchParams;
  assert.equal(params.get("per_page"), "100");
  assert.equal(params.get("page"), "2");
  assert.equal(params.get("studentDni"), "50123456");
  assert.equal(params.get("firstName"), "Lucas");
});

test("el padrón vacío devuelve una página válida", async () => {
  const { fetchImpl } = makeFetch({
    1: pageBody(1, 1, 0, []),
  });

  const result = await listAllStudents("token-1", {
    ...OPTIONS,
    fetchImpl,
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.deepEqual(result.students, []);
    assert.equal(result.meta.total, 0);
    assert.equal(result.meta.lastPage, 1);
  }
});
