import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getBirthdateError,
  getCalendarDisabledMatcher,
  getMaxBirthdate,
  toIsoDate,
} from "../../app/lib/validation/register.ts";

const NOW = new Date(2026, 9, 20);

test("con edad mínima 0 se aceptan menores y el día de hoy", () => {
  assert.equal(getBirthdateError("", NOW, 0), "required");
  assert.equal(getBirthdateError("2023-02-29", NOW, 0), "invalid");
  assert.equal(getBirthdateError("2026-10-21", NOW, 0), "future");
  assert.equal(getBirthdateError("2026-10-20", NOW, 0), null);
  assert.equal(getBirthdateError("2010-10-20", NOW, 0), null);
  assert.equal(getBirthdateError("1950-01-01", NOW, 0), null);
});

test("la regla de 18 años del registro no cambia", () => {
  assert.equal(getBirthdateError("2026-10-20", NOW), "future");
  assert.equal(getBirthdateError("2010-10-20", NOW), "underage");
  assert.equal(getBirthdateError("2008-10-20", NOW), null);
});

test("una edad mínima distinta de 18 se evalúa", () => {
  assert.equal(getBirthdateError("2021-10-20", NOW, 4), null);
  assert.equal(getBirthdateError("2023-10-20", NOW, 4), "underage");
});

test("la fecha máxima depende de la edad mínima", () => {
  assert.equal(toIsoDate(getMaxBirthdate(NOW, 0)), "2026-10-20");
  assert.equal(toIsoDate(getMaxBirthdate(NOW)), "2008-10-20");
  assert.equal(toIsoDate(getMaxBirthdate(NOW, 4)), "2022-10-20");
});

test("con edad mínima 0 el calendario permite hoy y bloquea el futuro", () => {
  const matcher = getCalendarDisabledMatcher(NOW, 0);

  assert.equal(matcher(new Date(2026, 9, 19)), false);
  assert.equal(matcher(new Date(2026, 9, 20)), false);
  assert.equal(matcher(new Date(2026, 9, 21)), true);
});

test("el calendario del registro sigue bloqueando hoy y el futuro", () => {
  const matcher = getCalendarDisabledMatcher(NOW);

  assert.equal(matcher(new Date(2026, 9, 19)), false);
  assert.equal(matcher(new Date(2026, 9, 20)), true);
  assert.equal(matcher(new Date(2026, 9, 21)), true);
});
