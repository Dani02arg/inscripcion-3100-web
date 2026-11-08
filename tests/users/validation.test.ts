import assert from "node:assert/strict";
import { test } from "node:test";

import {
  USER_FILTER_VALIDATION_MESSAGES,
  USER_GENERAL_ERROR_MESSAGE,
  USER_PROFILE_VALIDATION_MESSAGES,
  USER_ROLE_REQUEST_VALIDATION_MESSAGES,
  buildRoleRequestPayload,
  buildTutorProfilePayload,
  mapUserFieldErrors,
  readRoleRequestFormData,
  readTutorProfileFormData,
  translateUserFieldErrors,
  validateRoleRequest,
  validateTutorProfile,
  validateUserFilters,
} from "../../app/lib/validation/users.ts";

test("valida un perfil de tutor completo y devuelve el payload exacto", () => {
  const result = validateTutorProfile({
    occupation: "  Docente  ",
    educationLevel: "UNIVERSITARIO",
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.payload, {
    occupation: "Docente",
    education_level: "UNIVERSITARIO",
  });
});

test("exige la ocupación y recorta espacios", () => {
  const empty = validateTutorProfile({
    occupation: "   ",
    educationLevel: "UNIVERSITARIO",
  });

  assert.equal(empty.valid, false);
  assert.equal(
    empty.errors.occupation,
    USER_PROFILE_VALIDATION_MESSAGES.occupationRequired,
  );
  assert.equal(empty.payload, null);
});

test("acepta 100 caracteres y rechaza más de 100", () => {
  const atLimit = validateTutorProfile({
    occupation: "a".repeat(100),
    educationLevel: "SECUNDARIO",
  });
  const overLimit = validateTutorProfile({
    occupation: "a".repeat(101),
    educationLevel: "SECUNDARIO",
  });

  assert.equal(atLimit.valid, true);
  assert.equal(overLimit.valid, false);
  assert.equal(
    overLimit.errors.occupation,
    USER_PROFILE_VALIDATION_MESSAGES.occupationTooLong,
  );
});

test("exige un nivel educativo del contrato", () => {
  for (const educationLevel of ["", "   ", "universitario", "OTRO"]) {
    const result = validateTutorProfile({
      occupation: "Docente",
      educationLevel,
    });

    assert.equal(result.valid, false);
    assert.equal(
      result.errors.education_level,
      USER_PROFILE_VALIDATION_MESSAGES.educationRequired,
    );
    assert.equal(result.payload, null);
  }
});

test("acumula los errores de ambos campos", () => {
  const result = validateTutorProfile({
    occupation: "",
    educationLevel: "OTRO",
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.occupation, USER_PROFILE_VALIDATION_MESSAGES.occupationRequired);
  assert.equal(
    result.errors.education_level,
    USER_PROFILE_VALIDATION_MESSAGES.educationRequired,
  );
});

test("buildTutorProfilePayload devuelve null con datos inválidos", () => {
  assert.deepEqual(
    buildTutorProfilePayload({
      occupation: "Docente",
      educationLevel: "POSTGRADO",
    }),
    { occupation: "Docente", education_level: "POSTGRADO" },
  );
  assert.equal(
    buildTutorProfilePayload({
      occupation: "",
      educationLevel: "POSTGRADO",
    }),
    null,
  );
});

test("lee los campos del formulario y normaliza ausentes", () => {
  const formData = new FormData();
  formData.set("occupation", "  Docente  ");
  formData.set("educationLevel", "TERCIARIO");

  assert.deepEqual(readTutorProfileFormData(formData), {
    occupation: "  Docente  ",
    educationLevel: "TERCIARIO",
  });

  const empty = readTutorProfileFormData(new FormData());

  assert.deepEqual(empty, {
    occupation: "",
    educationLevel: "",
  });
});

test("valida una solicitud de rol completa y devuelve el payload exacto", () => {
  const result = validateRoleRequest(
    {
      requestedRole: "ADMINISTRATIVO",
      reason: "  Necesito gestionar inscripciones.  ",
    },
    "TUTOR",
  );

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.payload, {
    requested_role: "ADMINISTRATIVO",
    reason: "Necesito gestionar inscripciones.",
  });
});

test("exige un rol solicitado válido", () => {
  for (const requestedRole of ["", "   ", "administrativo", "OTRO"]) {
    const result = validateRoleRequest(
      { requestedRole, reason: "Motivo válido" },
      "TUTOR",
    );

    assert.equal(result.valid, false);
    assert.equal(
      result.errors.requested_role,
      USER_ROLE_REQUEST_VALIDATION_MESSAGES.requestedRoleRequired,
    );
    assert.equal(result.payload, null);
  }
});

test("rechaza solicitar el mismo rol actual", () => {
  const result = validateRoleRequest(
    { requestedRole: "TUTOR", reason: "Motivo válido" },
    "TUTOR",
  );

  assert.equal(result.valid, false);
  assert.equal(
    result.errors.requested_role,
    USER_ROLE_REQUEST_VALIDATION_MESSAGES.requestedRoleSame,
  );
});

test("exige el motivo y lo limita a 500 caracteres", () => {
  const empty = validateRoleRequest(
    { requestedRole: "ADMINISTRADOR", reason: "   " },
    "TUTOR",
  );
  const atLimit = validateRoleRequest(
    { requestedRole: "ADMINISTRADOR", reason: "a".repeat(500) },
    "TUTOR",
  );
  const atCodePointLimit = validateRoleRequest(
    { requestedRole: "ADMINISTRADOR", reason: `${"a".repeat(499)}😀` },
    "TUTOR",
  );
  const overCodePointLimit = validateRoleRequest(
    { requestedRole: "ADMINISTRADOR", reason: `${"a".repeat(500)}😀` },
    "TUTOR",
  );
  const overLimit = validateRoleRequest(
    { requestedRole: "ADMINISTRADOR", reason: "a".repeat(501) },
    "TUTOR",
  );

  assert.equal(
    empty.errors.reason,
    USER_ROLE_REQUEST_VALIDATION_MESSAGES.reasonRequired,
  );
  assert.equal(atLimit.valid, true);
  assert.equal(atCodePointLimit.valid, true);
  assert.equal(overCodePointLimit.valid, false);
  assert.equal(overLimit.valid, false);
  assert.equal(
    overLimit.errors.reason,
    USER_ROLE_REQUEST_VALIDATION_MESSAGES.reasonTooLong,
  );
});

test("acumula los errores de rol y motivo", () => {
  const result = validateRoleRequest(
    { requestedRole: "OTRO", reason: "" },
    "TUTOR",
  );

  assert.equal(result.valid, false);
  assert.equal(
    result.errors.requested_role,
    USER_ROLE_REQUEST_VALIDATION_MESSAGES.requestedRoleRequired,
  );
  assert.equal(
    result.errors.reason,
    USER_ROLE_REQUEST_VALIDATION_MESSAGES.reasonRequired,
  );
});

test("buildRoleRequestPayload devuelve null con datos inválidos", () => {
  assert.deepEqual(
    buildRoleRequestPayload(
      { requestedRole: "ADMINISTRADOR", reason: "Motivo" },
      "TUTOR",
    ),
    { requested_role: "ADMINISTRADOR", reason: "Motivo" },
  );
  assert.equal(
    buildRoleRequestPayload(
      { requestedRole: "TUTOR", reason: "Motivo" },
      "TUTOR",
    ),
    null,
  );
});

test("lee los campos de la solicitud de rol", () => {
  const formData = new FormData();
  formData.set("requestedRole", "ADMINISTRATIVO");
  formData.set("reason", "Motivo");

  assert.deepEqual(readRoleRequestFormData(formData), {
    requestedRole: "ADMINISTRATIVO",
    reason: "Motivo",
  });

  assert.deepEqual(readRoleRequestFormData(new FormData()), {
    requestedRole: "",
    reason: "",
  });
});

test("mapea solo los campos conocidos y toma el primer mensaje", () => {
  assert.deepEqual(
    mapUserFieldErrors({
      errors: {
        occupation: ["Requerido", "Otro mensaje"],
        requested_role: "Inválido",
        desconocido: ["No se mapea"],
      },
    }),
    {
      occupation: "Requerido",
      requested_role: "Inválido",
    },
  );

  assert.deepEqual(
    mapUserFieldErrors({
      education_level: ["  "],
      reason: [],
    }),
    {},
  );
  assert.deepEqual(mapUserFieldErrors(null), {});
});

test("traduce mensajes conocidos del servicio", () => {
  const translated = translateUserFieldErrors({
    dni: "The dni must be numeric.",
    cuil: "The cuil field is required.",
    email: "The email must be a valid email address.",
    occupation: "The occupation may not be greater than 100 characters.",
    education_level: "The selected education level is invalid.",
    requested_role: "The requested role must be different from the current role.",
    reason: "The reason may not be greater than 500 characters.",
  });

  assert.deepEqual(translated.errors, {
    dni: "Ingresá un DNI válido.",
    cuil: "Ingresá un CUIL válido.",
    email: "Ingresá un correo electrónico válido.",
    occupation: USER_PROFILE_VALIDATION_MESSAGES.occupationTooLong,
    education_level: USER_PROFILE_VALIDATION_MESSAGES.educationRequired,
    requested_role:
      USER_ROLE_REQUEST_VALIDATION_MESSAGES.requestedRoleSame,
    reason: USER_ROLE_REQUEST_VALIDATION_MESSAGES.reasonTooLong,
  });
  assert.equal(translated.generalMessage, null);
});

test("deriva los mensajes desconocidos a un aviso general", () => {
  const translated = translateUserFieldErrors({
    reason: "Un mensaje que no reconocemos",
  });

  assert.deepEqual(translated.errors, {});
  assert.equal(translated.generalMessage, USER_GENERAL_ERROR_MESSAGE);
});

test("traducir un mapa vacío no genera aviso general", () => {
  assert.deepEqual(translateUserFieldErrors({}), {
    errors: {},
    generalMessage: null,
  });
});

test("valida los cinco filtros del padrón y recorta los espacios exteriores", () => {
  const result = validateUserFilters({
    dni: "  30111222  ",
    cuil: " 20301112223 ",
    name: "  Ana  ",
    lastname: "  Pérez ",
    email: " ana@example.com ",
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.filters, {
    dni: "30111222",
    cuil: "20301112223",
    name: "Ana",
    lastname: "Pérez",
    email: "ana@example.com",
  });
});

test("rechaza localmente DNI o CUIL con puntos, espacios internos, guiones o letras", () => {
  for (const invalid of ["30.111.222", "30 111 222", "30-111-222", "30_111_222", "3011122a"]) {
    const dniResult = validateUserFilters({
      dni: invalid,
      cuil: "",
      name: "",
      lastname: "",
      email: "",
    });

    assert.equal(dniResult.valid, false);
    assert.equal(
      dniResult.errors.dni,
      USER_FILTER_VALIDATION_MESSAGES.dniDigitsOnly,
    );
    assert.equal(dniResult.errors.cuil, undefined);
  }

  for (const invalid of [
    "20-30111222-3",
    "20.30111222.3",
    "20 30111222 3",
    "20_30111222_3",
    "2030111222a",
  ]) {
    const cuilResult = validateUserFilters({
      dni: "",
      cuil: invalid,
      name: "",
      lastname: "",
      email: "",
    });

    assert.equal(cuilResult.valid, false);
    assert.equal(
      cuilResult.errors.cuil,
      USER_FILTER_VALIDATION_MESSAGES.cuilDigitsOnly,
    );
    assert.equal(cuilResult.errors.dni, undefined);
  }
});

test("acumula errores locales cuando DNI y CUIL contienen caracteres no numéricos", () => {
  const result = validateUserFilters({
    dni: "30.111.222",
    cuil: "20-30111222-3",
    name: "Ana",
    lastname: "Pérez",
    email: "ana@example.com",
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, {
    dni: USER_FILTER_VALIDATION_MESSAGES.dniDigitsOnly,
    cuil: USER_FILTER_VALIDATION_MESSAGES.cuilDigitsOnly,
  });
});
