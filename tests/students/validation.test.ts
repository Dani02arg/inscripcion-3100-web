import assert from "node:assert/strict";
import { test } from "node:test";

import {
  STUDENT_FILTER_MESSAGES,
  STUDENT_FORM_FIELDS,
  STUDENT_VALIDATION_MESSAGES,
  getEmptyStudentForm,
  readStudentFormData,
  studentToFormInput,
  validateStudentFilters,
  validateStudentInput,
  type StudentFormInput,
} from "../../app/lib/validation/students.ts";
import type { Student } from "../../app/lib/students/types.ts";

const NOW = new Date(2026, 10, 11);

function validForm(
  overrides: Partial<StudentFormInput> = {},
): StudentFormInput {
  return {
    studentDni: "50123456",
    studentCuil: "20501234567",
    firstName: "Lucas",
    lastName: "Pérez",
    studentEmail: "lucas@example.com",
    studentPhone: "3874112233",
    birthdate: "2010-08-20",
    gender: "Masculino",
    birthplace: "Salta Capital",
    address: "Av. San Martin 123",
    ...overrides,
  };
}

function makeStudent(): Student {
  return {
    id: "s-1",
    studentDni: "50123456",
    studentCuil: "20501234567",
    firstName: "Lucas",
    lastName: "Pérez",
    studentEmail: null,
    studentPhone: null,
    birthdate: "2010-08-20",
    gender: "Masculino",
    birthplace: null,
    address: null,
  };
}

const EMPTY_FILTERS = {
  studentDni: "",
  studentCuil: "",
  firstName: "",
  lastName: "",
};

test("los campos del formulario son los diez de la spec, en orden", () => {
  assert.deepEqual([...STUDENT_FORM_FIELDS], [
    "studentDni",
    "studentCuil",
    "firstName",
    "lastName",
    "studentEmail",
    "studentPhone",
    "birthdate",
    "gender",
    "birthplace",
    "address",
  ]);
});

test("el formulario vacío y la conversión desde el servicio usan cadenas", () => {
  assert.deepEqual(getEmptyStudentForm(), {
    studentDni: "",
    studentCuil: "",
    firstName: "",
    lastName: "",
    studentEmail: "",
    studentPhone: "",
    birthdate: "",
    gender: "",
    birthplace: "",
    address: "",
  });

  assert.deepEqual(studentToFormInput(makeStudent()), {
    studentDni: "50123456",
    studentCuil: "20501234567",
    firstName: "Lucas",
    lastName: "Pérez",
    studentEmail: "",
    studentPhone: "",
    birthdate: "2010-08-20",
    gender: "Masculino",
    birthplace: "",
    address: "",
  });
});

test("el alta válida arma el payload de diez claves", () => {
  const result = validateStudentInput(validForm(), false, NOW);

  assert.equal(result.valid, true);
  assert.ok(result.payload !== null);
  assert.ok("studentDni" in result.payload);
  assert.deepEqual(Object.keys(result.payload), [
    "studentDni",
    "studentCuil",
    "firstName",
    "lastName",
    "studentEmail",
    "studentPhone",
    "birthdate",
    "gender",
    "birthplace",
    "address",
  ]);
  assert.equal(result.payload.studentDni, "50123456");
  assert.equal(result.payload.studentCuil, "20501234567");
  assert.equal(result.payload.firstName, "Lucas");
  assert.equal(result.payload.studentEmail, "lucas@example.com");
  assert.equal(result.payload.gender, "Masculino");
});

test("el DNI exige siete u ocho dígitos", () => {
  const result = validateStudentInput(
    validForm({ studentDni: "", firstName: "Lucas" }),
    false,
    NOW,
  );
  assert.equal(
    result.errors.studentDni,
    STUDENT_VALIDATION_MESSAGES.studentDniRequired,
  );

  for (const dni of ["123456", "123456789", "50.123.456", "5012345a"]) {
    const invalid = validateStudentInput(
      validForm({ studentDni: dni }),
      false,
      NOW,
    );
    assert.equal(
      invalid.errors.studentDni,
      STUDENT_VALIDATION_MESSAGES.studentDniFormat,
    );
  }

  for (const dni of ["1234567", "12345678", " 50123456 "]) {
    assert.equal(
      validateStudentInput(validForm({ studentDni: dni }), false, NOW)
        .errors.studentDni,
      undefined,
    );
  }
});

test("el CUIL exige once dígitos sin separadores", () => {
  const result = validateStudentInput(
    validForm({ studentCuil: "" }),
    false,
    NOW,
  );
  assert.equal(
    result.errors.studentCuil,
    STUDENT_VALIDATION_MESSAGES.studentCuilRequired,
  );

  for (const cuil of [
    "2050123456",
    "205012345678",
    "20-50123456-7",
    "2050123456a",
  ]) {
    const invalid = validateStudentInput(
      validForm({ studentCuil: cuil }),
      false,
      NOW,
    );
    assert.equal(
      invalid.errors.studentCuil,
      STUDENT_VALIDATION_MESSAGES.studentCuilFormat,
    );
  }

  assert.equal(
    validateStudentInput(
      validForm({ studentCuil: " 20501234567 " }),
      false,
      NOW,
    ).errors.studentCuil,
    undefined,
  );
});

test("nombre y apellido son obligatorios y aceptan hasta 100 caracteres", () => {
  const requiredFirst = validateStudentInput(
    validForm({ firstName: "   " }),
    false,
    NOW,
  );
  const requiredLast = validateStudentInput(
    validForm({ lastName: "   " }),
    false,
    NOW,
  );

  assert.ok(requiredFirst.errors.firstName);
  assert.ok(requiredLast.errors.lastName);

  for (const overrides of [
    { firstName: "a".repeat(100) },
    { lastName: "a".repeat(100) },
  ]) {
    const max = validateStudentInput(validForm(overrides), false, NOW);
    assert.equal(max.valid, true);
  }

  for (const overrides of [
    { firstName: "a".repeat(101) },
    { lastName: "a".repeat(101) },
  ]) {
    const tooLong = validateStudentInput(validForm(overrides), false, NOW);
    const field = "firstName" in overrides ? "firstName" : "lastName";
    assert.equal(
      tooLong.errors[field],
      STUDENT_VALIDATION_MESSAGES.maxName,
    );
  }
});

test("la fecha de nacimiento es obligatoria, real y no futura", () => {
  assert.equal(
    validateStudentInput(validForm({ birthdate: "" }), false, NOW).errors
      .birthdate,
    STUDENT_VALIDATION_MESSAGES.birthdateRequired,
  );

  for (const birthdate of [
    "2011-02-29",
    "2010-13-01",
    "2026-11-12",
    "20/08/2010",
  ]) {
    assert.equal(
      validateStudentInput(validForm({ birthdate }), false, NOW).errors
        .birthdate,
      STUDENT_VALIDATION_MESSAGES.birthdateInvalid,
    );
  }

  for (const birthdate of ["2012-02-29", "2010-08-20", "2026-11-11"]) {
    assert.equal(
      validateStudentInput(validForm({ birthdate }), false, NOW).errors
        .birthdate,
      undefined,
    );
  }
});

test("el género debe ser uno de los tres valores documentados", () => {
  for (const gender of ["Masculino", "Femenino", "Otro", "  Otro  "]) {
    assert.equal(
      validateStudentInput(validForm({ gender }), false, NOW).errors.gender,
      undefined,
    );
  }

  for (const gender of ["", "masculino", "DESCONOCIDO"]) {
    assert.equal(
      validateStudentInput(validForm({ gender }), false, NOW).errors.gender,
      STUDENT_VALIDATION_MESSAGES.genderInvalid,
    );
  }
});

test("el correo es opcional, válido y de hasta 255 caracteres", () => {
  assert.equal(
    validateStudentInput(
      validForm({ studentEmail: "" }),
      false,
      NOW,
    ).errors.studentEmail,
    undefined,
  );
  assert.equal(
    validateStudentInput(
      validForm({ studentEmail: "no-es-email" }),
      false,
      NOW,
    ).errors.studentEmail,
    STUDENT_VALIDATION_MESSAGES.emailInvalid,
  );

  const validLong = `${"a".repeat(243)}@example.com`;
  assert.equal(validLong.length, 255);
  assert.equal(
    validateStudentInput(
      validForm({ studentEmail: validLong }),
      false,
      NOW,
    ).errors.studentEmail,
    undefined,
  );

  const tooLong = `${"a".repeat(244)}@example.com`;
  assert.equal(tooLong.length, 256);
  assert.equal(
    validateStudentInput(
      validForm({ studentEmail: tooLong }),
      false,
      NOW,
    ).errors.studentEmail,
    STUDENT_VALIDATION_MESSAGES.emailTooLong,
  );
});

test("el teléfono es opcional y solo admite dígitos, sin largo fijo", () => {
  for (const studentPhone of ["3874112233", "1", "12345678901234567890"]) {
    assert.equal(
      validateStudentInput(
        validForm({ studentPhone }),
        false,
        NOW,
      ).errors.studentPhone,
      undefined,
    );
  }

  for (const studentPhone of ["387-411-2233", "387 411 2233", "abc"]) {
    assert.equal(
      validateStudentInput(
        validForm({ studentPhone }),
        false,
        NOW,
      ).errors.studentPhone,
      STUDENT_VALIDATION_MESSAGES.phoneInvalid,
    );
  }

  assert.equal(
    validateStudentInput(
      validForm({ studentPhone: " 3874112233 " }),
      false,
      NOW,
    ).errors.studentPhone,
    undefined,
  );
});

test("el lugar de nacimiento admite hasta 150 caracteres y el domicilio no tiene tope", () => {
  assert.equal(
    validateStudentInput(
      validForm({ birthplace: "a".repeat(150) }),
      false,
      NOW,
    ).errors.birthplace,
    undefined,
  );
  assert.equal(
    validateStudentInput(
      validForm({ birthplace: "a".repeat(151) }),
      false,
      NOW,
    ).errors.birthplace,
    STUDENT_VALIDATION_MESSAGES.birthplaceTooLong,
  );
  assert.equal(
    validateStudentInput(
      validForm({ address: "a".repeat(500) }),
      false,
      NOW,
    ).valid,
    true,
  );
});

test("los opcionales vacíos viajan en nulo", () => {
  const result = validateStudentInput(
    validForm({
      studentEmail: "",
      studentPhone: "   ",
      birthplace: "",
      address: "  ",
    }),
    false,
    NOW,
  );

  assert.equal(result.valid, true);
  assert.ok(result.payload !== null);

  if (result.payload && "studentDni" in result.payload) {
    assert.equal(result.payload.studentEmail, null);
    assert.equal(result.payload.studentPhone, null);
    assert.equal(result.payload.birthplace, null);
    assert.equal(result.payload.address, null);
  }
});

test("la edición no envía DNI ni CUIL y conserva los ocho campos editables", () => {
  const result = validateStudentInput(
    validForm({ studentDni: "", studentCuil: "" }),
    true,
    NOW,
  );

  assert.equal(result.valid, true);
  assert.ok(result.payload !== null);
  assert.equal("studentDni" in (result.payload ?? {}), false);
  assert.equal("studentCuil" in (result.payload ?? {}), false);
  assert.deepEqual(Object.keys(result.payload ?? {}), [
    "firstName",
    "lastName",
    "studentEmail",
    "studentPhone",
    "birthdate",
    "gender",
    "birthplace",
    "address",
  ]);
});

test("el formulario vacío informa los obligatorios y no los opcionales", () => {
  const result = validateStudentInput(getEmptyStudentForm(), false, NOW);

  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors).sort(), [
    "birthdate",
    "firstName",
    "gender",
    "lastName",
    "studentCuil",
    "studentDni",
  ]);
});

test("se leen los diez campos del FormData y los ausentes quedan vacíos", () => {
  const formData = new FormData();
  formData.set("studentDni", "50123456");
  formData.set("firstName", "Lucas");
  formData.set("gender", "Masculino");

  assert.deepEqual(readStudentFormData(formData), {
    studentDni: "50123456",
    studentCuil: "",
    firstName: "Lucas",
    lastName: "",
    studentEmail: "",
    studentPhone: "",
    birthdate: "",
    gender: "Masculino",
    birthplace: "",
    address: "",
  });
});

test("los filtros vacíos son válidos y se recortan", () => {
  const result = validateStudentFilters(EMPTY_FILTERS);

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.filters, EMPTY_FILTERS);

  const trimmed = validateStudentFilters({
    studentDni: " 50123456 ",
    studentCuil: "",
    firstName: " Ana ",
    lastName: " Pérez ",
  });

  assert.equal(trimmed.valid, true);
  assert.equal(trimmed.filters.studentDni, "50123456");
  assert.equal(trimmed.filters.firstName, "Ana");
  assert.equal(trimmed.filters.lastName, "Pérez");
});

test("el filtro de DNI solo admite dígitos y hasta ocho", () => {
  const digits = validateStudentFilters({
    ...EMPTY_FILTERS,
    studentDni: "50.123.456",
  });
  assert.equal(
    digits.errors.studentDni,
    STUDENT_FILTER_MESSAGES.studentDniDigits,
  );

  const tooLong = validateStudentFilters({
    ...EMPTY_FILTERS,
    studentDni: "123456789",
  });
  assert.equal(
    tooLong.errors.studentDni,
    STUDENT_FILTER_MESSAGES.studentDniMax,
  );

  const valid = validateStudentFilters({
    ...EMPTY_FILTERS,
    studentDni: "50123456",
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.errors.studentDni, undefined);
});

test("el filtro de CUIL solo admite dígitos y hasta once", () => {
  const digits = validateStudentFilters({
    ...EMPTY_FILTERS,
    studentCuil: "20-50123456-7",
  });
  assert.equal(
    digits.errors.studentCuil,
    STUDENT_FILTER_MESSAGES.studentCuilDigits,
  );

  const tooLong = validateStudentFilters({
    ...EMPTY_FILTERS,
    studentCuil: "205012345678",
  });
  assert.equal(
    tooLong.errors.studentCuil,
    STUDENT_FILTER_MESSAGES.studentCuilMax,
  );

  const valid = validateStudentFilters({
    ...EMPTY_FILTERS,
    studentCuil: "20501234567",
  });
  assert.equal(valid.valid, true);
});

test("los filtros combinados informan solo el campo inválido", () => {
  const result = validateStudentFilters({
    studentDni: "50123456",
    studentCuil: "20-50123456-7",
    firstName: " Ana ",
    lastName: "",
  });

  assert.equal(result.valid, false);
  assert.deepEqual(Object.keys(result.errors), ["studentCuil"]);
  assert.equal(result.filters.firstName, "Ana");
});
