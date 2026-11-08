import assert from "node:assert/strict";
import { test } from "node:test";

import type { PendingRegistration } from "../../app/lib/verification/types.ts";
import {
  extractPendingRegistration,
  parsePendingRegistration,
  resendWaitMs,
  serializePendingRegistration,
} from "../../app/lib/verification/pending-value.ts";

const pending: PendingRegistration = {
  userId: "42",
  email: "ana@example.com",
  resendAvailableAt: 0,
};

/** Codifica un valor arbitrario como si fuera el contenido de la cookie. */
function encode(value: unknown): string {
  return encodeURIComponent(JSON.stringify(value));
}

test("serializa e interpreta el registro pendiente sin perder datos", () => {
  const raw = serializePendingRegistration(pending);

  assert.equal(decodeURIComponent(raw), JSON.stringify(pending));
  assert.deepEqual(parsePendingRegistration(raw), pending);

  const withWait = { ...pending, resendAvailableAt: 1_700_000_000_000 };
  assert.deepEqual(
    parsePendingRegistration(serializePendingRegistration(withWait)),
    withWait,
  );
});

test("rechaza valores ausentes o ilegibles", () => {
  assert.equal(parsePendingRegistration(undefined), null);
  assert.equal(parsePendingRegistration(null), null);
  assert.equal(parsePendingRegistration(""), null);
  assert.equal(parsePendingRegistration("no-es-json"), null);
  assert.equal(parsePendingRegistration("%7B%22userId%22"), null);
});

test("rechaza valores que no son un objeto plano", () => {
  assert.equal(parsePendingRegistration(encode([])), null);
  assert.equal(parsePendingRegistration(encode(null)), null);
  assert.equal(parsePendingRegistration(encode("texto")), null);
  assert.equal(parsePendingRegistration(encode(42)), null);
});

test("rechaza el pendiente con campos faltantes o vacíos", () => {
  assert.equal(parsePendingRegistration(encode({ email: pending.email })), null);
  assert.equal(parsePendingRegistration(encode({ userId: pending.userId })), null);
  assert.equal(
    parsePendingRegistration(encode({ userId: "", email: pending.email })),
    null,
  );
  assert.equal(
    parsePendingRegistration(encode({ userId: "   ", email: pending.email })),
    null,
  );
  assert.equal(
    parsePendingRegistration(encode({ userId: pending.userId, email: "" })),
    null,
  );
});

test("rechaza identificadores y correos con tipos o longitudes inválidas", () => {
  assert.equal(
    parsePendingRegistration(encode({ userId: 42, email: pending.email })),
    null,
  );
  assert.equal(
    parsePendingRegistration(encode({ userId: pending.userId, email: 42 })),
    null,
  );
  assert.equal(
    parsePendingRegistration(
      encode({ userId: "a".repeat(129), email: pending.email }),
    ),
    null,
  );
  assert.equal(
    parsePendingRegistration(
      encode({ userId: pending.userId, email: "anaexample.com" }),
    ),
    null,
  );
  assert.equal(
    parsePendingRegistration(
      encode({
        userId: pending.userId,
        email: `${"a".repeat(249)}@b.com`,
      }),
    ),
    null,
  );

  const longButValid = {
    userId: "a".repeat(128),
    email: `${"a".repeat(248)}@b.com`,
  };
  assert.deepEqual(parsePendingRegistration(encode(longButValid)), {
    ...longButValid,
    resendAvailableAt: 0,
  });
});

test("interpreta el instante de reenvío disponible", () => {
  assert.deepEqual(
    parsePendingRegistration(
      encode({ userId: pending.userId, email: pending.email }),
    ),
    { ...pending, resendAvailableAt: 0 },
  );

  assert.deepEqual(
    parsePendingRegistration(
      encode({
        userId: pending.userId,
        email: pending.email,
        resendAvailableAt: 1_700_000_000_000,
      }),
    ),
    { ...pending, resendAvailableAt: 1_700_000_000_000 },
  );

  assert.equal(
    parsePendingRegistration(
      encode({
        userId: pending.userId,
        email: pending.email,
        resendAvailableAt: "1700000000000",
      }),
    ),
    null,
  );
  assert.equal(
    parsePendingRegistration(
      encode({
        userId: pending.userId,
        email: pending.email,
        resendAvailableAt: -1,
      }),
    ),
    null,
  );
  assert.equal(
    parsePendingRegistration(
      encode({
        userId: pending.userId,
        email: pending.email,
        resendAvailableAt: null,
      }),
    ),
    null,
  );
});

test("extrae el pendiente de los datos del registro", () => {
  assert.deepEqual(
    extractPendingRegistration({ id: 42, email: "ana@example.com" }),
    { userId: "42", email: "ana@example.com", resendAvailableAt: 0 },
  );
  assert.deepEqual(
    extractPendingRegistration({ id: " 42 ", email: " ana@example.com " }),
    { userId: "42", email: "ana@example.com", resendAvailableAt: 0 },
  );
});

test("no extrae un pendiente cuando los datos no son utilizables", () => {
  assert.equal(extractPendingRegistration(null), null);
  assert.equal(extractPendingRegistration(undefined), null);
  assert.equal(extractPendingRegistration("texto"), null);
  assert.equal(extractPendingRegistration([]), null);
  assert.equal(extractPendingRegistration({ email: "ana@example.com" }), null);
  assert.equal(extractPendingRegistration({ id: 42 }), null);
  assert.equal(extractPendingRegistration({ id: 42, email: "" }), null);
  assert.equal(extractPendingRegistration({ id: 42, email: "anaexample.com" }), null);
  assert.equal(extractPendingRegistration({ id: 0, email: "ana@example.com" }), null);
  assert.equal(extractPendingRegistration({ id: -1, email: "ana@example.com" }), null);
  assert.equal(extractPendingRegistration({ id: 1.5, email: "ana@example.com" }), null);
  assert.equal(extractPendingRegistration({ id: true, email: "ana@example.com" }), null);
});

test("calcula la espera restante para reenviar", () => {
  const withWait = { ...pending, resendAvailableAt: 1_700_000_000_000 };

  assert.equal(resendWaitMs(withWait, 1_699_999_999_400), 600);
  assert.equal(resendWaitMs(withWait, 1_700_000_000_000), 0);
  assert.equal(resendWaitMs(withWait, 1_700_000_000_500), 0);
  assert.equal(resendWaitMs(pending, 1_700_000_000_000), 0);
  assert.equal(resendWaitMs(withWait, Number.NaN), 0);
  assert.equal(
    resendWaitMs({ ...pending, resendAvailableAt: Number.NaN }, 0),
    0,
  );
});
