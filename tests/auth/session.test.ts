import assert from "node:assert/strict";
import { test } from "node:test";

import type { SessionClaims } from "../../app/lib/auth/types.ts";
import {
  decodeSessionToken,
  isKnownRole,
  isSessionExpired,
  parseJwtPayload,
} from "../../app/lib/auth/session.ts";

function encodePayload(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function makeToken(payload: unknown): string {
  return `e30.${encodePayload(payload)}.firma`;
}

function makeClaims(
  overrides: Partial<SessionClaims> = {},
): SessionClaims {
  return {
    sub: "01a1544c-b52b-719e-bd6c-04a1d075ef88",
    email: "ana@example.com",
    role: "TUTOR",
    exp: 1_792_502_671,
    ...overrides,
  };
}

test("parseJwtPayload decodifica un token válido", () => {
  const payload = parseJwtPayload(makeToken({ sub: "x", exp: 1 }));

  assert.deepEqual(payload, { sub: "x", exp: 1 });
});

test("parseJwtPayload rechaza un token sin tres partes", () => {
  assert.equal(parseJwtPayload("abc.def"), null);
});

test("parseJwtPayload rechaza un payload no base64url", () => {
  assert.equal(parseJwtPayload("a.$$$.c"), null);
});

test("decodeSessionToken devuelve los claims de un token utilizable", () => {
  const claims = makeClaims();
  const result = decodeSessionToken(makeToken(claims));

  assert.deepEqual(result, claims);
});

test("decodeSessionToken rechaza sub vacío", () => {
  assert.equal(
    decodeSessionToken(makeToken(makeClaims({ sub: "   " }))),
    null,
  );
});

test("decodeSessionToken rechaza email ausente", () => {
  const payload = { ...makeClaims(), email: undefined };
  assert.equal(decodeSessionToken(makeToken(payload)), null);
});

test("decodeSessionToken rechaza un role desconocido", () => {
  const payload = { ...makeClaims(), role: "PRECEPTOR" };
  assert.equal(decodeSessionToken(makeToken(payload)), null);
});

test("decodeSessionToken rechaza exp ausente, no finito o no positivo", () => {
  assert.equal(
    decodeSessionToken(makeToken({ ...makeClaims(), exp: undefined })),
    null,
  );
  assert.equal(
    decodeSessionToken(makeToken({ ...makeClaims(), exp: Number.NaN })),
    null,
  );
  assert.equal(
    decodeSessionToken(makeToken({ ...makeClaims(), exp: 0 })),
    null,
  );
});

test("isSessionExpired vence en el límite exacto", () => {
  const claims = makeClaims({ exp: 1000 });

  assert.equal(isSessionExpired(claims, 999_999), false);
  assert.equal(isSessionExpired(claims, 1_000_000), true);
});

test("isKnownRole reconoce los tres roles y rechaza un desconocido", () => {
  assert.equal(isKnownRole("ADMINISTRADOR"), true);
  assert.equal(isKnownRole("ADMINISTRATIVO"), true);
  assert.equal(isKnownRole("TUTOR"), true);
  assert.equal(isKnownRole("DOCENTE"), false);
  assert.equal(isKnownRole(42), false);
});
