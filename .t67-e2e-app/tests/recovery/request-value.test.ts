import assert from "node:assert/strict";
import { test } from "node:test";

import {
  RECOVERY_TTL_MS,
  isRecoveryExpired,
  maskRecoveryEmail,
  parseRecoveryRequest,
  shouldRestoreSavedRecoveryRequest,
  serializeRecoveryRequest,
  type RecoveryRequest,
} from "../../app/lib/recovery/request-value.ts";

const request: RecoveryRequest = {
  email: "ana@example.com",
  requestedAt: 1_700_000_000_000,
};

test("la recuperación desde cuenta no restaura un correo guardado", () => {
  assert.equal(shouldRestoreSavedRecoveryRequest("account"), false);
  assert.equal(shouldRestoreSavedRecoveryRequest(["account"]), true);
  assert.equal(shouldRestoreSavedRecoveryRequest(undefined), true);
});

test("serializa e interpreta la solicitud sin perder datos", () => {
  const raw = serializeRecoveryRequest(request);
  const parsed = parseRecoveryRequest(raw);

  assert.deepEqual(parsed, request);
});

test("serializa exactamente el correo y el instante", () => {
  const raw = serializeRecoveryRequest({
    email: "  ana@example.com  ",
    requestedAt: 0,
  });
  const parsed: unknown = JSON.parse(raw);

  assert.deepEqual(parsed, {
    email: "ana@example.com",
    requestedAt: 0,
  });

  if (typeof parsed === "object" && parsed !== null) {
    assert.deepEqual(Object.keys(parsed).sort(), ["email", "requestedAt"]);
    assert.equal(JSON.stringify(parsed).includes("code"), false);
    assert.equal(JSON.stringify(parsed).includes("password"), false);
  }
});

test("trata como ausencia un JSON inválido", () => {
  for (const raw of ["", "{", "no-es-json", "undefined"]) {
    assert.equal(parseRecoveryRequest(raw), null, `debería rechazar ${raw}`);
  }
});

test("trata como ausencia los valores que no son un objeto plano", () => {
  for (const raw of ["null", "[]", '"texto"', "42", "true"]) {
    assert.equal(parseRecoveryRequest(raw), null, `debería rechazar ${raw}`);
  }
});

test("rechaza una solicitud sin los campos esperados", () => {
  const cases = [
    {},
    { email: "ana@example.com" },
    { requestedAt: 1_700_000_000_000 },
    { email: null, requestedAt: 1_700_000_000_000 },
  ];

  for (const value of cases) {
    assert.equal(parseRecoveryRequest(JSON.stringify(value)), null);
  }
});

test("rechaza correos vacíos o con formato inválido", () => {
  const emails = ["", "   ", "ana", "ana@", "ana@example", "@example.com"];

  for (const email of emails) {
    assert.equal(
      parseRecoveryRequest(
        JSON.stringify({ email, requestedAt: 1_700_000_000_000 }),
      ),
      null,
      `debería rechazar "${email}"`,
    );
  }
});

test("recorta los espacios exteriores del correo al interpretar", () => {
  const parsed = parseRecoveryRequest(
    JSON.stringify({
      email: "  ana@example.com  ",
      requestedAt: 1_700_000_000_000,
    }),
  );

  assert.deepEqual(parsed, {
    email: "ana@example.com",
    requestedAt: 1_700_000_000_000,
  });
});

test("rechaza un correo demasiado largo", () => {
  const email = `${"a".repeat(250)}@example.com`;

  assert.equal(
    parseRecoveryRequest(
      JSON.stringify({ email, requestedAt: 1_700_000_000_000 }),
    ),
    null,
  );
});

test("rechaza instantes con tipo incorrecto, no finitos o negativos", () => {
  const raws = [
    JSON.stringify({ email: "ana@example.com", requestedAt: "1700000000000" }),
    JSON.stringify({ email: "ana@example.com", requestedAt: null }),
    JSON.stringify({ email: "ana@example.com", requestedAt: -1 }),
    '{"email":"ana@example.com","requestedAt":1e999}',
  ];

  for (const raw of raws) {
    assert.equal(parseRecoveryRequest(raw), null, `debería rechazar ${raw}`);
  }
});

test("acepta el instante cero", () => {
  const parsed = parseRecoveryRequest(
    JSON.stringify({ email: "ana@example.com", requestedAt: 0 }),
  );

  assert.deepEqual(parsed, {
    email: "ana@example.com",
    requestedAt: 0,
  });
});

test("una solicitud no vence a los 14 minutos y 59 segundos", () => {
  const now = request.requestedAt + RECOVERY_TTL_MS - 1_000;

  assert.equal(isRecoveryExpired(request, now), false);
});

test("una solicitud vence a los 15 minutos exactos", () => {
  const now = request.requestedAt + RECOVERY_TTL_MS;

  assert.equal(isRecoveryExpired(request, now), true);
});

test("una solicitud con instante futuro no se considera vencida", () => {
  const now = request.requestedAt - 5_000;

  assert.equal(isRecoveryExpired(request, now), false);
});

test("una solicitud con instante no finito se considera vencida", () => {
  assert.equal(
    isRecoveryExpired(
      { email: "ana@example.com", requestedAt: Number.POSITIVE_INFINITY },
      1_700_000_000_000,
    ),
    true,
  );
});

test("enmascara el correo con el formato existente", () => {
  assert.equal(maskRecoveryEmail("andres@gmail.com"), "a***@g***.com");
  assert.equal(maskRecoveryEmail("  andres@gmail.com  "), "a***@g***.com");
  assert.equal(maskRecoveryEmail("no-es-un-correo"), "***");
});
