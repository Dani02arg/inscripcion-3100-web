import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatFullName,
  formatInitials,
  getAccountAccessibleName,
  toSidebarAccount,
} from "../../app/lib/sidebar/account.ts";

test("las iniciales usan el primer nombre y el último apellido", () => {
  assert.equal(formatInitials("Pedro", "Pérez"), "PP");
  assert.equal(formatInitials("María José", "Pérez Gómez"), "MG");
  assert.equal(formatInitials("  pedro ", " pérez  "), "PP");
});

test("las iniciales conservan acentos y mayúsculas", () => {
  assert.equal(formatInitials("ángel", "núñez"), "ÁN");
});

test("una sola palabra usa sus dos primeras letras", () => {
  assert.equal(formatInitials("Ana", ""), "AN");
  assert.equal(formatInitials("A", ""), "A");
});

test("un nombre compuesto sin apellido usa la primera y la última palabra", () => {
  assert.equal(formatInitials("Ana María", ""), "AM");
});

test("sin nombre no hay iniciales", () => {
  assert.equal(formatInitials("", ""), null);
  assert.equal(formatInitials("   ", "  "), null);
  assert.equal(formatInitials("", "Pérez"), null);
});

test("el nombre completo une las partes no vacías", () => {
  assert.equal(formatFullName("Pedro", "Pérez"), "Pedro Pérez");
  assert.equal(formatFullName("Pedro", ""), "Pedro");
  assert.equal(formatFullName("", "Pérez"), "Pérez");
  assert.equal(formatFullName("  Pedro  ", "  Pérez  "), "Pedro Pérez");
  assert.equal(formatFullName("", ""), "");
});

test("el nombre accesible de la cuenta tiene respaldo", () => {
  assert.equal(getAccountAccessibleName("Pedro Pérez"), "Cuenta de Pedro Pérez");
  assert.equal(getAccountAccessibleName(""), "Cuenta");
  assert.equal(getAccountAccessibleName("   "), "Cuenta");
  assert.equal(getAccountAccessibleName(undefined), "Cuenta");
});

test("una cuenta completa queda lista con iniciales y nombre", () => {
  const state = toSidebarAccount({
    status: "ok",
    user: {
      name: "Pedro",
      lastname: "Pérez",
      email: "pedro@example.com",
      role: "ADMINISTRADOR",
    },
  });

  assert.deepEqual(state, {
    status: "ready",
    data: {
      name: "Pedro",
      lastname: "Pérez",
      email: "pedro@example.com",
      roleLabel: "Administrador",
      initials: "PP",
      displayName: "Pedro Pérez",
    },
  });
});

test("una cuenta sin nombre conserva el correo y no inventa iniciales", () => {
  const state = toSidebarAccount({
    status: "ok",
    user: {
      name: "",
      lastname: "",
      email: "pedro@example.com",
      role: "TUTOR",
    },
  });

  assert.deepEqual(state, {
    status: "ready",
    data: {
      name: "",
      lastname: "",
      email: "pedro@example.com",
      roleLabel: "Tutor",
      initials: null,
      displayName: "",
    },
  });
});

test("una cuenta sin correo conserva el nombre", () => {
  const state = toSidebarAccount({
    status: "ok",
    user: {
      name: "Pedro",
      lastname: "Pérez",
      email: "",
      role: "ADMINISTRATIVO",
    },
  });

  assert.equal(state.status, "ready");

  if (state.status === "ready") {
    assert.equal(state.data.displayName, "Pedro Pérez");
    assert.equal(state.data.email, "");
    assert.equal(state.data.initials, "PP");
    assert.equal(state.data.roleLabel, "Administrativo");
  }
});

test("una cuenta sin datos queda no disponible", () => {
  assert.deepEqual(
    toSidebarAccount({
      status: "ok",
      user: { name: "", lastname: "", email: "", role: "TUTOR" },
    }),
    { status: "unavailable" },
  );
});

test("el rol del pie se etiqueta en español", () => {
  const cases = [
    { role: "TUTOR", label: "Tutor" },
    { role: "ADMINISTRATIVO", label: "Administrativo" },
    { role: "ADMINISTRADOR", label: "Administrador" },
  ] as const;

  for (const { role, label } of cases) {
    const state = toSidebarAccount({
      status: "ok",
      user: {
        name: "Ana",
        lastname: "Pérez",
        email: "ana@example.com",
        role,
      },
    });

    assert.equal(state.status, "ready");

    if (state.status === "ready") {
      assert.equal(state.data.roleLabel, label);
    }
  }
});

test("los estados forbidden y error quedan no disponibles", () => {
  assert.deepEqual(toSidebarAccount({ status: "forbidden" }), {
    status: "unavailable",
  });
  assert.deepEqual(toSidebarAccount({ status: "error" }), {
    status: "unavailable",
  });
});
