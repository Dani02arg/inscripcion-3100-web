import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildNotificationPayload,
  countTitleCharacters,
  isAttachmentCompatible,
  mapNotificationFieldErrors,
  normalizeNotificationTitle,
  NOTIFICATION_ATTACHMENT_FORMAT_MESSAGE,
  NOTIFICATION_ATTACHMENT_REQUIRED_MESSAGE,
  NOTIFICATION_ATTACHMENT_TOO_LARGE_MESSAGE,
  NOTIFICATION_CONTENT_REQUIRED_MESSAGE,
  NOTIFICATION_COURSE_REQUIRED_MESSAGE,
  NOTIFICATION_RECIPIENT_REQUIRED_MESSAGE,
  NOTIFICATION_TITLE_TOO_LONG_MESSAGE,
  validateNotificationAttachment,
  validateNotificationContent,
  validateNotificationTitle,
} from "../../app/lib/validation/notifications.ts";

test("recorta espacios, tabs y saltos del título", () => {
  assert.equal(normalizeNotificationTitle("  Hola\tmundo\n"), "Hola\tmundo");
  assert.equal(normalizeNotificationTitle("\n\t  "), "");
});

test("cuenta puntos de código Unicode", () => {
  assert.equal(countTitleCharacters("😀😀"), 2);
  assert.equal(countTitleCharacters("a😀"), 2);
});

test("acepta 80 caracteres y rechaza 81 tras recortar", () => {
  const eighty = "a".repeat(80);
  const eightyOne = "a".repeat(81);

  assert.equal(validateNotificationTitle(eighty).ok, true);
  assert.equal(
    validateNotificationTitle(`  ${eighty}  `).ok,
    true,
  );
  assert.equal(validateNotificationTitle(eightyOne).ok, false);
  assert.equal(
    validateNotificationTitle(eightyOne).message,
    NOTIFICATION_TITLE_TOO_LONG_MESSAGE,
  );
});

test("rechaza títulos vacíos o solo con blancos", () => {
  for (const value of ["", "   ", "\t\n  "]) {
    const result = validateNotificationTitle(value);
    assert.equal(result.ok, false);
    assert.ok(result.message);
  }
});

test("exige contenido con al menos un carácter no blanco", () => {
  assert.equal(validateNotificationContent("Hola"), null);
  assert.equal(
    validateNotificationContent(" \t\n "),
    NOTIFICATION_CONTENT_REQUIRED_MESSAGE,
  );
});

test("valida extensión, MIME, tamaño y vacío del adjunto", () => {
  assert.equal(
    validateNotificationAttachment({
      name: "circular.PDF",
      size: 1000,
      type: "application/pdf",
    }).ok,
    true,
  );

  assert.equal(
    validateNotificationAttachment({
      name: "foto.JpG",
      size: 1000,
      type: "",
    }).ok,
    true,
  );

  assert.equal(
    validateNotificationAttachment({
      name: "foto.png",
      size: 1000,
      type: "application/pdf",
    }).message,
    NOTIFICATION_ATTACHMENT_FORMAT_MESSAGE,
  );

  assert.equal(
    validateNotificationAttachment({
      name: "foto.exe",
      size: 1000,
      type: "application/octet-stream",
    }).ok,
    false,
  );

  assert.equal(
    validateNotificationAttachment({
      name: "foto.png",
      size: 0,
      type: "image/png",
    }).message,
    NOTIFICATION_ATTACHMENT_REQUIRED_MESSAGE,
  );

  assert.equal(
    validateNotificationAttachment({
      name: "foto.png",
      size: 5_000_000,
      type: "image/png",
    }).ok,
    true,
  );

  assert.equal(
    validateNotificationAttachment({
      name: "foto.png",
      size: 5_000_001,
      type: "image/png",
    }).message,
    NOTIFICATION_ATTACHMENT_TOO_LARGE_MESSAGE,
  );
});

test("MIME vacío se acepta solo con extensión válida", () => {
  assert.equal(isAttachmentCompatible("archivo.webp", ""), true);
  assert.equal(isAttachmentCompatible("archivo.txt", ""), false);
  assert.equal(isAttachmentCompatible("archivo.jpeg", "image/jpeg"), true);
});

test("el payload envía un único identificador según la audiencia", () => {
  const individual = buildNotificationPayload({
    audience: "individual",
    title: "Aviso",
    content: "Texto",
    recipientId: " tutor-1 ",
    courseId: "curso-1",
  });

  assert.equal(individual.ok, true);

  if (individual.ok) {
    assert.equal(individual.payload.recipientId, "tutor-1");
    assert.equal("courseId" in individual.payload, false);
  }

  const course = buildNotificationPayload({
    audience: "course",
    title: "Aviso",
    content: "Texto",
    recipientId: "tutor-1",
    courseId: " curso-1 ",
  });

  assert.equal(course.ok, true);

  if (course.ok) {
    assert.equal(course.payload.courseId, "curso-1");
    assert.equal("recipientId" in course.payload, false);
  }

  const all = buildNotificationPayload({
    audience: "allTutors",
    title: "Aviso",
    content: "Texto",
    recipientId: "tutor-1",
    courseId: "curso-1",
  });

  assert.equal(all.ok, true);

  if (all.ok) {
    assert.equal("recipientId" in all.payload, false);
    assert.equal("courseId" in all.payload, false);
  }
});

test("el payload señala destinatario o curso faltante", () => {
  const individual = buildNotificationPayload({
    audience: "individual",
    title: "Aviso",
    content: "Texto",
  });

  assert.equal(individual.ok, false);

  if (!individual.ok) {
    assert.equal(
      individual.fieldErrors.recipientId,
      NOTIFICATION_RECIPIENT_REQUIRED_MESSAGE,
    );
  }

  const course = buildNotificationPayload({
    audience: "course",
    title: "Aviso",
    content: "Texto",
  });

  assert.equal(course.ok, false);

  if (!course.ok) {
    assert.equal(
      course.fieldErrors.courseId,
      NOTIFICATION_COURSE_REQUIRED_MESSAGE,
    );
  }
});

test("mapea solo campos conocidos y conserva el primer mensaje", () => {
  const errors = mapNotificationFieldErrors({
    errors: {
      title: ["El título es obligatorio."],
      content: "El contenido es obligatorio.",
      recipients: ["Sin destinatarios."],
      desconocido: ["No importa."],
    },
  });

  assert.deepEqual(errors, {
    title: "El título es obligatorio.",
    content: "El contenido es obligatorio.",
    recipients: "Sin destinatarios.",
  });
});
