import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildNotificationMenuLabel,
  buildNotificationRowLabel,
  buildTutorOptionLabel,
  formatNotificationDate,
  formatNotificationFileSize,
  formatUnreadBadge,
  parseContentDispositionFilename,
  sanitizeAttachmentFilename,
  summarizeNotificationContent,
  truncateVisualFilename,
} from "../../app/lib/notifications/labels.ts";

test("presenta la hora de pared del offset sin convertir de zona", () => {
  assert.equal(
    formatNotificationDate("2026-11-02T14:30:00+00:00"),
    "02/11/2026 14:30",
  );
  assert.equal(
    formatNotificationDate("2026-11-02T14:30:00-03:00"),
    "02/11/2026 14:30",
  );
  assert.equal(
    formatNotificationDate("2026-11-02T14:30:59.123Z"),
    "02/11/2026 14:30",
  );
});

test("una fecha inválida muestra «No disponible»", () => {
  for (const value of [
    null,
    undefined,
    "",
    "2026-13-02T14:30:00+00:00",
    "2026-02-30T14:30:00+00:00",
    "2026-11-02T25:30:00+00:00",
    "2026-11-02",
  ]) {
    assert.equal(formatNotificationDate(value), "No disponible");
  }
});

test("resume a 140 puntos de código y solo agrega puntos suspensivos al recortar", () => {
  const exact = "a".repeat(140);
  const longer = "a".repeat(141);

  assert.equal(summarizeNotificationContent(exact), exact);
  assert.equal(summarizeNotificationContent(longer), `${"a".repeat(140)}…`);
  assert.equal(
    summarizeNotificationContent("  Hola\n\nmundo\tcruel  "),
    "Hola mundo cruel",
  );
});

test("el nombre accesible del badge refleja el conteo", () => {
  assert.equal(buildNotificationMenuLabel(4), "Notificaciones, 4 sin leer");
  assert.equal(
    buildNotificationMenuLabel(0),
    "Notificaciones, no hay notificaciones sin leer",
  );
  assert.equal(buildNotificationMenuLabel(null), "Notificaciones");
  assert.equal(
    buildNotificationMenuLabel(Number.NaN),
    "Notificaciones",
  );
});

test("el badge muestra 99+ desde 100 y se oculta en cero", () => {
  assert.equal(formatUnreadBadge(0), null);
  assert.equal(formatUnreadBadge(null), null);
  assert.equal(formatUnreadBadge(1), "1");
  assert.equal(formatUnreadBadge(99), "99");
  assert.equal(formatUnreadBadge(100), "99+");
  assert.equal(formatUnreadBadge(9999), "99+");
});

test("la fila accesible incluye título, estado, fecha y adjunto", () => {
  const label = buildNotificationRowLabel({
    title: "Aviso",
    isRead: false,
    hasAttachment: true,
    sentAt: "2026-11-02T14:30:00+00:00",
  });

  assert.equal(
    label,
    "Aviso. No leída. Enviada el 02/11/2026 14:30. Con adjunto.",
  );
});

test("la etiqueta del tutor prioriza DNI y cae a correo o sin datos", () => {
  const base = {
    id: "u1",
    role: "TUTOR",
    name: "Ana",
    lastname: "Pérez",
    cuil: null,
  };

  assert.equal(
    buildTutorOptionLabel({ ...base, dni: "12345678", email: "a@b.com" }),
    "Pérez, Ana — 12345678",
  );
  assert.equal(
    buildTutorOptionLabel({ ...base, dni: null, email: "a@b.com" }),
    "Pérez, Ana — a@b.com",
  );
  assert.equal(
    buildTutorOptionLabel({ ...base, dni: null, email: null }),
    "Pérez, Ana — Sin datos de contacto",
  );
});

test("lee el nombre del adjunto desde Content-Disposition", () => {
  assert.equal(
    parseContentDispositionFilename('attachment; filename="circular.pdf"'),
    "circular.pdf",
  );
  assert.equal(
    parseContentDispositionFilename(
      "attachment; filename*=UTF-8''circular%20de%20octubre.pdf",
    ),
    "circular de octubre.pdf",
  );
  assert.equal(parseContentDispositionFilename(null), "");
  assert.equal(parseContentDispositionFilename("attachment"), "adjunto");
});

test("sanea nombres de ruta y trunca visualmente", () => {
  assert.equal(sanitizeAttachmentFilename("C:\\temp\\..\\circular.pdf"), "circular.pdf");
  assert.equal(sanitizeAttachmentFilename("../../etc/passwd"), "passwd");
  assert.equal(sanitizeAttachmentFilename(" "), "adjunto");
  assert.equal(truncateVisualFilename("a".repeat(60)), "a".repeat(60));
  assert.equal(truncateVisualFilename("a".repeat(61)), `${"a".repeat(60)}…`);
});

test("muestra el tamaño en MB con un decimal", () => {
  assert.equal(formatNotificationFileSize(0), "0,0 MB");
  assert.equal(formatNotificationFileSize(5_000_000), "5,0 MB");
  assert.equal(formatNotificationFileSize(1_234_567), "1,2 MB");
});
