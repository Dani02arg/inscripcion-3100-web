import assert from "node:assert/strict";
import { test } from "node:test";

import type { RegisterInput } from "../../app/lib/validation/register.ts";
import {
  MIN_REGISTER_AGE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  REGISTER_FORM_FIELDS,
  REGISTER_PAYLOAD_FIELDS,
  buildRegisterPayload,
  calculateAge,
  containsEmoji,
  formatDateInput,
  formatDisplayDate,
  fromIsoDate,
  getBirthdateError,
  getCalendarDisabledMatcher,
  getMaxBirthdate,
  isValidCuil,
  isValidDni,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidPhone,
  normalizeCuil,
  normalizeDigits,
  parseDisplayDate,
  passwordsMatch,
  toIsoDate,
  trimText,
  validateRegisterInput,
} from "../../app/lib/validation/register.ts";

function makeInput(overrides: Partial<RegisterInput> = {}): RegisterInput {
  return {
    dni: "12345678",
    cuil: "20-12345678-9",
    name: "Ana",
    lastname: "Pérez",
    email: "ana@example.com",
    password: "Abcdef1!",
    confirmPassword: "Abcdef1!",
    user_phone: "11 2345-6789",
    birthdate: "2000-01-01",
    ...overrides,
  };
}

test("normaliza texto, dígitos, CUIL y fechas ISO", () => {
  assert.equal(trimText("  Ana  "), "Ana");
  assert.equal(trimText("   "), "");
  assert.equal(normalizeDigits("11 2345-6789"), "1123456789");
  assert.equal(normalizeCuil("20-12345678-9"), "20123456789");

  const date = new Date(2026, 9, 20);
  assert.equal(toIsoDate(date), "2026-10-20");
  assert.equal(fromIsoDate("2023-02-29"), null);
  assert.equal(fromIsoDate("2026-10-20")?.getDate(), 20);
  assert.equal(formatDisplayDate("2026-10-20"), "20/10/2026");
  assert.equal(formatDisplayDate(date), "20/10/2026");
  assert.equal(formatDisplayDate("2023-02-29"), "");
});

test("aplica la máscara DD/MM/YYYY al editar la fecha", () => {
  assert.equal(formatDateInput(""), "");
  assert.equal(formatDateInput("1"), "1");
  assert.equal(formatDateInput("12"), "12");
  assert.equal(formatDateInput("123"), "12/3");
  assert.equal(formatDateInput("1234"), "12/34");
  assert.equal(formatDateInput("12345"), "12/34/5");
  assert.equal(formatDateInput("12345678"), "12/34/5678");
  assert.equal(formatDateInput("12/34/5678"), "12/34/5678");
  assert.equal(formatDateInput("12a34b5678"), "12/34/5678");
  assert.equal(formatDateInput("123456789"), "12/34/5678");
  assert.equal(formatDateInput("12/34/567"), "12/34/567");
  assert.equal(formatDateInput("12/34/56"), "12/34/56");
  assert.equal(formatDateInput("12/34"), "12/34");
  assert.equal(formatDateInput("12/"), "12");
});

test("convierte la fecha visible a ISO solo cuando está completa y es válida", () => {
  assert.equal(parseDisplayDate("01/01/2000"), "2000-01-01");
  assert.equal(parseDisplayDate("29/02/2024"), "2024-02-29");
  assert.equal(parseDisplayDate("29/02/2023"), "");
  assert.equal(parseDisplayDate("31/04/2000"), "");
  assert.equal(parseDisplayDate("12/3"), "");
  assert.equal(parseDisplayDate("1/1/2000"), "");
  assert.equal(parseDisplayDate("01/01/00"), "");
  assert.equal(parseDisplayDate(""), "");
});

test("calcula edad, fecha máxima y matcher del calendario", () => {
  const now = new Date(2026, 9, 20);

  assert.equal(calculateAge(new Date(2008, 9, 20), now), 18);
  assert.equal(calculateAge(new Date(2008, 9, 21), now), 17);
  assert.equal(calculateAge(new Date(2010, 0, 1), now), 16);
  assert.equal(toIsoDate(getMaxBirthdate(now)), "2008-10-20");

  assert.equal(
    calculateAge(new Date(2008, 1, 29), new Date(2026, 1, 28)),
    18,
  );
  assert.equal(
    calculateAge(new Date(2008, 1, 29), new Date(2026, 1, 27)),
    17,
  );
  assert.equal(
    toIsoDate(getMaxBirthdate(new Date(2026, 1, 28))),
    "2008-02-29",
  );

  assert.equal(getBirthdateError("", now), "required");
  assert.equal(getBirthdateError("2023-02-29", now), "invalid");
  assert.equal(getBirthdateError("2026-10-20", now), "future");
  assert.equal(getBirthdateError("2026-10-21", now), "future");
  assert.equal(getBirthdateError("2010-10-20", now), "underage");
  assert.equal(getBirthdateError("2008-10-20", now), null);

  const matcher = getCalendarDisabledMatcher(now);
  assert.equal(matcher(new Date(2026, 9, 19)), false);
  assert.equal(matcher(new Date(2026, 9, 20)), true);
  assert.equal(matcher(new Date(2026, 9, 21)), true);
  assert.equal(matcher(new Date(2010, 0, 1)), false);
});

test("valida DNI, CUIL, teléfono, correo y nombres", () => {
  assert.equal(isValidDni("1234567"), true);
  assert.equal(isValidDni("12345678"), true);
  assert.equal(isValidDni("01234567"), true);
  assert.equal(isValidDni("123456"), false);
  assert.equal(isValidDni("123456789"), false);
  assert.equal(isValidDni("12.345.678"), false);

  assert.equal(isValidCuil("20123456789"), true);
  assert.equal(isValidCuil("20-12345678-9"), true);
  assert.equal(isValidCuil("20-1234567-9"), false);
  assert.equal(isValidCuil("2012345678a"), false);

  assert.equal(isValidPhone("1123456789"), true);
  assert.equal(isValidPhone("11 2345-6789"), true);
  assert.equal(isValidPhone("(11) 2345-6789"), true);
  assert.equal(isValidPhone("+54 11 2345-6789"), false);
  assert.equal(isValidPhone("112345678"), false);

  assert.equal(isValidEmail("ana@example.com"), true);
  assert.equal(isValidEmail(" ana@example.com "), true);
  assert.equal(isValidEmail("ana@example"), false);
  assert.equal(isValidEmail("ana example.com"), false);

  assert.equal(isValidName("Ana"), true);
  assert.equal(isValidName("  Ana  "), true);
  assert.equal(isValidName(" A "), false);
  assert.equal(isValidName("   "), false);
});

test("valida contraseña y confirmación", () => {
  assert.equal(PASSWORD_MIN_LENGTH, 8);
  assert.equal(PASSWORD_MAX_LENGTH, 16);
  assert.equal(isValidPassword("Abcdef1!"), true);
  assert.equal(isValidPassword("Abcdefg1"), true);
  assert.equal(isValidPassword("Abcdef1"), false);
  assert.equal(isValidPassword("Abcdefghijklmnop1"), false);
  assert.equal(isValidPassword("abcdefg1!"), false);
  assert.equal(isValidPassword("ABCDEFG1!"), false);
  assert.equal(isValidPassword("Abcdefgh"), false);
  assert.equal(isValidPassword("        "), false);
  assert.equal(isValidPassword("Abcdef1😀"), false);
  assert.equal(containsEmoji("Abcdef1😀"), true);

  assert.equal(passwordsMatch("Abcdef1!", "Abcdef1!"), true);
  assert.equal(passwordsMatch("Abcdef1!", "abcdef1!"), false);
  assert.equal(passwordsMatch("Abcdef1!", ""), false);
  assert.equal(passwordsMatch("Abcdef1!", "   "), false);
});

test("construye el payload exacto y valida el formulario completo", () => {
  const now = new Date(2026, 9, 20);
  const input = makeInput({
    name: "  Ana  ",
    lastname: "  Pérez  ",
    email: " ana@example.com ",
  });

  assert.equal(REGISTER_FORM_FIELDS.length, 9);
  assert.equal(REGISTER_PAYLOAD_FIELDS.length, 8);
  assert.equal(MIN_REGISTER_AGE, 18);

  const result = validateRegisterInput(input, now);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
  assert.ok(result.payload);

  assert.deepEqual(
    Object.keys(result.payload).sort(),
    [...REGISTER_PAYLOAD_FIELDS].sort(),
  );
  assert.equal(result.payload.dni, "12345678");
  assert.equal(result.payload.cuil, "20123456789");
  assert.equal(result.payload.name, "Ana");
  assert.equal(result.payload.lastname, "Pérez");
  assert.equal(result.payload.email, "ana@example.com");
  assert.equal(result.payload.password, "Abcdef1!");
  assert.equal(result.payload.user_phone, "1123456789");
  assert.equal(result.payload.birthdate, "2000-01-01");
  assert.equal("confirmPassword" in result.payload, false);

  const built = buildRegisterPayload(input);
  assert.deepEqual(built, result.payload);

  const passwordWithSpaces = makeInput({
    password: " Abcdef1! ",
    confirmPassword: " Abcdef1! ",
  });
  const spacedResult = validateRegisterInput(passwordWithSpaces, now);
  assert.equal(spacedResult.valid, true);
  assert.equal(spacedResult.payload?.password, " Abcdef1! ");
});

test("rechaza el formulario incompleto y los casos inválidos", () => {
  const now = new Date(2026, 9, 20);
  const empty = makeInput({
    dni: "",
    cuil: "",
    name: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    user_phone: "",
    birthdate: "",
  });

  const emptyResult = validateRegisterInput(empty, now);
  assert.equal(emptyResult.valid, false);
  assert.equal(emptyResult.payload, null);
  for (const field of REGISTER_FORM_FIELDS) {
    assert.ok(emptyResult.errors[field], `Falta el error de ${field}`);
  }

  const underage = validateRegisterInput(
    makeInput({ birthdate: "2010-10-20" }),
    now,
  );
  assert.equal(underage.valid, false);
  assert.ok(underage.errors.birthdate);

  const future = validateRegisterInput(
    makeInput({ birthdate: "2026-10-21" }),
    now,
  );
  assert.equal(future.valid, false);
  assert.ok(future.errors.birthdate);

  const invalidDate = validateRegisterInput(
    makeInput({ birthdate: "2023-02-29" }),
    now,
  );
  assert.equal(invalidDate.valid, false);
  assert.ok(invalidDate.errors.birthdate);

  const phoneWithPrefix = validateRegisterInput(
    makeInput({ user_phone: "+54 11 2345-6789" }),
    now,
  );
  assert.equal(phoneWithPrefix.valid, false);
  assert.ok(phoneWithPrefix.errors.user_phone);

  const emptyConfirmation = validateRegisterInput(
    makeInput({ confirmPassword: "" }),
    now,
  );
  assert.equal(emptyConfirmation.valid, false);
  assert.ok(emptyConfirmation.errors.confirmPassword);

  const spacesConfirmation = validateRegisterInput(
    makeInput({ confirmPassword: "   " }),
    now,
  );
  assert.equal(spacesConfirmation.valid, false);
  assert.ok(spacesConfirmation.errors.confirmPassword);

  const caseMismatch = validateRegisterInput(
    makeInput({ confirmPassword: "abcdef1!" }),
    now,
  );
  assert.equal(caseMismatch.valid, false);
  assert.ok(caseMismatch.errors.confirmPassword);
});

test("acepta una fecha de nacimiento de 29 de febrero según la regla", () => {
  const now = new Date(2026, 1, 28);
  const result = validateRegisterInput(
    makeInput({ birthdate: "2008-02-29" }),
    now,
  );

  assert.equal(result.valid, true);
  assert.equal(result.payload?.birthdate, "2008-02-29");
  assert.equal(formatDisplayDate("2008-02-29"), "29/02/2008");
});
