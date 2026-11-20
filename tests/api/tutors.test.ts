import assert from "node:assert/strict";
import { test } from "node:test";

import { listAllTutors } from "../../app/lib/api/users.ts";

const tutor = {
  id: 123,
  role: "TUTOR",
  name: "Ana",
  lastname: "Pérez",
  dni: "30111222",
  cuil: "20301112223",
  email: "ana@example.com",
};

test("listAllTutors recorre páginas, filtra TUTOR y recalcula totales", async () => {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(input.toString());
    calls.push(url.toString());
    const page = url.searchParams.get("page") ?? "1";
    const data =
      page === "1"
        ? [tutor, { ...tutor, id: 9, role: "ADMINISTRATIVO" }]
        : [{ ...tutor, id: 10 }];

    return new Response(
      JSON.stringify({
        data,
        meta: { current_page: Number(page), last_page: 2, per_page: 10, total: 13 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await listAllTutors(
    "jwt-token",
    { dni: "", cuil: "", name: "Ana", lastname: "", email: "" },
    { baseUrl: "http://api.test", fetchImpl },
  );

  assert.equal(calls.length, 2);
  assert.equal(result.ok, true);

  if (result.ok) {
    assert.deepEqual(
      result.users.map((user) => user.id),
      ["123", "10"],
    );
    assert.equal(result.meta.total, 2);
    assert.equal(result.meta.lastPage, 1);
    assert.equal(new URL(calls[0] ?? "").searchParams.get("first_name"), "Ana");
  }
});

test("listAllTutors no devuelve parciales si falla una página", async () => {
  const fetchImpl: typeof fetch = async (input) => {
    const page = new URL(input.toString()).searchParams.get("page");

    if (page === "1") {
      return new Response(
        JSON.stringify({
          data: [tutor],
          meta: { current_page: 1, last_page: 2, per_page: 10, total: 2 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response("{}", { status: 500 });
  };

  const result = await listAllTutors(
    "jwt-token",
    { dni: "", cuil: "", name: "Ana", lastname: "", email: "" },
    { baseUrl: "http://api.test", fetchImpl },
  );

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.kind, "failed");
  }
});

test("listAllTutors usa last_name y filtra DNI/CUIL en el cliente", async () => {
  let requestedUrl = "";
  const fetchImpl: typeof fetch = async (input) => {
    requestedUrl = input.toString();

    return new Response(
      JSON.stringify({
        data: [
          { ...tutor, id: 1, lastname: "Prueba", dni: "45896864", cuil: "75855273263" },
          { ...tutor, id: 2, lastname: "Prueba", dni: "11111111", cuil: "20111111112" },
          {
            ...tutor,
            id: 3,
            role: "ADMINISTRATIVO",
            lastname: "Prueba",
            dni: "45896864",
          },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 3 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await listAllTutors(
    "jwt-token",
    { dni: "4589", cuil: "7585", name: "", lastname: "Prueba", email: "" },
    { baseUrl: "http://api.test", fetchImpl },
  );

  const params = new URL(requestedUrl).searchParams;

  assert.equal(params.get("last_name"), "Prueba");
  assert.equal(params.has("lastname"), false);
  assert.equal(params.has("dni"), false);
  assert.equal(params.has("cuil"), false);
  assert.equal(result.ok, true);

  if (result.ok) {
    assert.deepEqual(
      result.users.map((user) => user.id),
      ["1"],
    );
  }
});
