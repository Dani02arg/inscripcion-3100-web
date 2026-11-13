import assert from "node:assert/strict";
import { test } from "node:test";

import {
  STUDENT_GENERAL_ERROR_MESSAGE,
  STUDENT_VALIDATION_MESSAGES,
  mapStudentFieldErrors,
  translateStudentApiErrors,
  translateStudentFieldErrors,
} from "../../app/lib/validation/students.ts";

test("los errores del sobre se mapean a los campos conocidos", () => {
  const mapped = mapStudentFieldErrors({
    errors: {
      studentDni: ["The student dni field is required."],
      studentCuil: "The student cuil must be 11 digits.",
      hack: ["No corresponde."],
    },
  });

  assert.deepEqual(mapped, {
    studentDni: "The student dni field is required.",
    studentCuil: "The student cuil must be 11 digits.",
  });
});

test("se toma el primer mensaje no vacío y se ignoran los campos ajenos", () => {
  const mapped = mapStudentFieldErrors({
    firstName: ["", "  ", "The first name field is required."],
    lastName: [],
    gender: "",
    address: ["The address is invalid."],
    otro: ["x"],
  });

  assert.deepEqual(mapped, {
    firstName: "The first name field is required.",
    address: "The address is invalid.",
  });
});

test("un sobre inválido no produce errores", () => {
  for (const value of [null, undefined, "texto", 42, [], {}]) {
    assert.deepEqual(mapStudentFieldErrors(value), {});
  }
});

test("los mensajes conocidos se traducen al español", () => {
  const translated = translateStudentFieldErrors({
    studentDni: "The student dni field is required.",
    studentCuil: "The student cuil has already been taken.",
    firstName: "The first name may not be greater than 100 characters.",
    lastName: "The last name field is required.",
    studentEmail: "The student email must be a valid email address.",
    studentPhone: "The student phone must only contain digits.",
    birthdate: "The birthdate field is required.",
    gender: "The selected gender is invalid.",
    birthplace: "The birthplace may not be greater than 150 characters.",
  });

  assert.deepEqual(translated.errors, {
    studentDni: STUDENT_VALIDATION_MESSAGES.studentDniRequired,
    studentCuil: STUDENT_VALIDATION_MESSAGES.studentCuilExists,
    firstName: STUDENT_VALIDATION_MESSAGES.maxName,
    lastName: STUDENT_VALIDATION_MESSAGES.lastNameRequired,
    studentEmail: STUDENT_VALIDATION_MESSAGES.emailInvalid,
    studentPhone: STUDENT_VALIDATION_MESSAGES.phoneInvalid,
    birthdate: STUDENT_VALIDATION_MESSAGES.birthdateRequired,
    gender: STUDENT_VALIDATION_MESSAGES.genderInvalid,
    birthplace: STUDENT_VALIDATION_MESSAGES.birthplaceTooLong,
  });
  assert.equal(translated.generalMessage, null);
});

test("los duplicados y los largos máximos se traducen", () => {
  const translated = translateStudentFieldErrors({
    studentDni: "The student dni has already been taken.",
    studentEmail: "The student email may not be greater than 255 characters.",
    studentCuil: "The student cuil must be 11 digits.",
  });

  assert.deepEqual(translated.errors, {
    studentDni: STUDENT_VALIDATION_MESSAGES.studentDniExists,
    studentEmail: STUDENT_VALIDATION_MESSAGES.emailTooLong,
    studentCuil: STUDENT_VALIDATION_MESSAGES.studentCuilFormat,
  });
  assert.equal(translated.generalMessage, null);
});

test("una fecha futura o inválida se traduce al mismo mensaje", () => {
  for (const message of [
    "The birthdate must be a date before or equal to today.",
    "The birthdate is not a valid date.",
  ]) {
    assert.deepEqual(
      translateStudentFieldErrors({ birthdate: message }),
      {
        errors: {
          birthdate: STUDENT_VALIDATION_MESSAGES.birthdateInvalid,
        },
        generalMessage: null,
      },
    );
  }
});

test("un mensaje desconocido en un campo conocido produce aviso general", () => {
  const translated = translateStudentFieldErrors({
    studentDni: "Something went wrong.",
  });

  assert.deepEqual(translated.errors, {});
  assert.equal(translated.generalMessage, STUDENT_GENERAL_ERROR_MESSAGE);
});

test("se conservan los campos conocidos y se avisa por el desconocido", () => {
  const translated = translateStudentFieldErrors({
    studentDni: "The student dni field is required.",
    address: "The address is invalid.",
  });

  assert.deepEqual(translated.errors, {
    studentDni: STUDENT_VALIDATION_MESSAGES.studentDniRequired,
  });
  assert.equal(translated.generalMessage, STUDENT_GENERAL_ERROR_MESSAGE);
});

test("el sobre con claves ajenas deriva a un aviso general", () => {
  const translated = translateStudentApiErrors({
    errors: {
      studentDni: ["The student dni field is required."],
      hack: ["No corresponde."],
    },
  });

  assert.deepEqual(translated.errors, {
    studentDni: STUDENT_VALIDATION_MESSAGES.studentDniRequired,
  });
  assert.equal(translated.generalMessage, STUDENT_GENERAL_ERROR_MESSAGE);
});

test("un sobre sin errores no produce aviso general", () => {
  for (const value of [null, {}, { errors: {} }]) {
    assert.deepEqual(translateStudentApiErrors(value), {
      errors: {},
      generalMessage: null,
    });
  }
});

test("un error de dirección sin traducción produce aviso general", () => {
  const translated = translateStudentApiErrors({
    errors: {
      address: ["The address is invalid."],
    },
  });

  assert.deepEqual(translated.errors, {});
  assert.equal(translated.generalMessage, STUDENT_GENERAL_ERROR_MESSAGE);
});
