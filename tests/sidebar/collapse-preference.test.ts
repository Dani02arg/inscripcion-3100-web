import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COLLAPSE_COOKIE_MAX_AGE_SECONDS,
  SIDEBAR_COLLAPSE_COOKIE_NAME,
  parseCollapsePreference,
  serializeCollapsePreference,
} from "../../app/lib/sidebar/collapse-preference.ts";

test("la cookie de colapso tiene un nombre estable y vigencia de un año", () => {
  assert.equal(SIDEBAR_COLLAPSE_COOKIE_NAME, "sidebar_collapsed");
  assert.equal(COLLAPSE_COOKIE_MAX_AGE_SECONDS, 31_536_000);
});

test("solo el valor 1 significa colapsado", () => {
  assert.equal(parseCollapsePreference("1"), true);
  assert.equal(parseCollapsePreference("0"), false);
});

test("valores ausentes o inválidos significan expandido", () => {
  assert.equal(parseCollapsePreference(undefined), false);
  assert.equal(parseCollapsePreference(null), false);
  assert.equal(parseCollapsePreference(""), false);
  assert.equal(parseCollapsePreference("true"), false);
  assert.equal(parseCollapsePreference("collapsed"), false);
  assert.equal(parseCollapsePreference(" 1 "), false);
});

test("la serialización devuelve solo 1 o 0", () => {
  assert.equal(serializeCollapsePreference(true), "1");
  assert.equal(serializeCollapsePreference(false), "0");
});

test("la preferencia sobrevive a un ciclo de serialización", () => {
  for (const collapsed of [true, false]) {
    assert.equal(
      parseCollapsePreference(serializeCollapsePreference(collapsed)),
      collapsed,
    );
  }
});

test("la preferencia no contiene datos de cuenta", () => {
  for (const collapsed of [true, false]) {
    assert.match(serializeCollapsePreference(collapsed), /^[01]$/);
  }
});
