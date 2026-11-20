import assert from "node:assert/strict";
import { test } from "node:test";

import {
  downloadNotificationAttachment,
  listNotifications,
  markNotificationRead,
  NOTIFICATIONS_ENDPOINT_PATH,
  parseNotification,
  parseNotificationListResponse,
  parseNotificationReadResponse,
  parseNotificationSendResponse,
  sendNotification,
} from "../../app/lib/api/notifications.ts";
import type {
  NotificationListResult,
  NotificationReadResult,
  NotificationSendResult,
} from "../../app/lib/notifications/types.ts";

function listKind(result: NotificationListResult): string {
  return result.ok ? "ok" : result.kind;
}

function readKind(result: NotificationReadResult): string {
  return result.ok ? "ok" : result.kind;
}

function sendKind(result: NotificationSendResult): string {
  return result.ok ? "ok" : result.kind;
}

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const rawItem = {
  id: "n1",
  title: "Aviso",
  content: "Contenido",
  isRead: false,
  readAt: null,
  hasAttachment: false,
  sentAt: "2026-11-02T14:30:00+00:00",
};

test("parsea una notificación válida y acepta url solo con adjunto", () => {
  const simple = parseNotification(rawItem);

  assert.ok(simple);
  assert.equal(simple.id, "n1");
  assert.equal(simple.attachmentUrl, null);

  const withAttachment = parseNotification({
    ...rawItem,
    hasAttachment: true,
    attachmentUrl: "http://localhost/api/notifications/n1/attachment",
  });

  assert.ok(withAttachment);
  assert.equal(withAttachment.hasAttachment, true);
});

test("rechaza estructura inválida, fechas inválidas y url incoherente", () => {
  assert.equal(parseNotification({ ...rawItem, sentAt: "ayer" }), null);
  assert.equal(
    parseNotification({ ...rawItem, isRead: true, readAt: null }),
    null,
  );
  assert.equal(
    parseNotification({ ...rawItem, readAt: "2026-11-02T14:30:00+00:00" }),
    null,
  );
  assert.equal(
    parseNotification({ ...rawItem, hasAttachment: true, attachmentUrl: null }),
    null,
  );
  assert.equal(
    parseNotification({ ...rawItem, attachmentUrl: "http://x" }),
    null,
  );
});

test("parsea el listado y rechaza ids duplicados sin datos parciales", () => {
  const ok = parseNotificationListResponse(200, {
    data: [rawItem],
    message: "",
    errors: [],
  });

  assert.equal(ok.ok, true);

  if (ok.ok) {
    assert.equal(ok.notifications.length, 1);
  }

  const duplicated = parseNotificationListResponse(200, {
    data: [rawItem, rawItem],
    message: "",
    errors: [],
  });

  assert.equal(duplicated.ok, false);
});

test("mapea 401, 403 y estructura inválida del listado", () => {
  assert.equal(listKind(parseNotificationListResponse(401, {})), "unauthorized");
  assert.equal(listKind(parseNotificationListResponse(403, {})), "forbidden");
  assert.equal(listKind(parseNotificationListResponse(500, {})), "server");
  assert.equal(parseNotificationListResponse(200, { data: "x" }).ok, false);
});

test("lee la bandeja con Bearer y sin caché", async () => {
  const calls: FetchCall[] = [];
  const result = await listNotifications("token-1", {
    baseUrl: "http://api.test",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return jsonResponse(200, { data: [rawItem], message: "", errors: [] });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(String(calls[0]?.input), `http://api.test${NOTIFICATIONS_ENDPOINT_PATH}`);

  const headers = new Headers(calls[0]?.init?.headers);

  assert.equal(headers.get("Authorization"), "Bearer token-1");
  assert.equal(calls[0]?.init?.cache, "no-store");
});

test("marca leída y trata 403/404 como no disponible", async () => {
  const success = parseNotificationReadResponse(200, {
    data: {
      ...rawItem,
      isRead: true,
      readAt: "2026-11-02T15:00:00+00:00",
    },
    message: "",
    errors: [],
  });

  assert.equal(success.ok, true);

  if (success.ok) {
    assert.equal(success.notification.isRead, true);
  }

  assert.equal(readKind(parseNotificationReadResponse(403, {})), "not_found");
  assert.equal(readKind(parseNotificationReadResponse(404, {})), "not_found");
  assert.equal(readKind(parseNotificationReadResponse(401, {})), "unauthorized");
  assert.equal(readKind(parseNotificationReadResponse(500, {})), "server");

  const calls: FetchCall[] = [];
  await markNotificationRead("token", "n1", {
    baseUrl: "http://api.test",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return jsonResponse(404, {});
    },
  });

  assert.equal(calls[0]?.init?.method, "PATCH");
  assert.match(
    String(calls[0]?.input),
    /\/api\/notifications\/n1\/read$/,
  );
});

test("envía JSON sin adjunto con un único destinatario", async () => {
  const calls: FetchCall[] = [];
  const result = await sendNotification(
    "token",
    {
      audience: "individual",
      title: "  Aviso  ",
      content: "Texto",
      recipientId: "tutor-1",
      courseId: "curso-1",
    },
    {
      baseUrl: "http://api.test",
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return jsonResponse(201, {
          data: { id: "n1" },
          message: "Notificación enviada correctamente.",
          errors: [],
        });
      },
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.ok ? result.id : null, "n1");

  const headers = new Headers(calls[0]?.init?.headers);

  assert.equal(headers.get("Content-Type"), "application/json");

  const body = JSON.parse(String(calls[0]?.init?.body)) as Record<string, string>;

  assert.equal(body.audience, "individual");
  assert.equal(body.recipientId, "tutor-1");
  assert.equal("courseId" in body, false);
});

test("envía multipart con adjunto y no fija Content-Type", async () => {
  const calls: FetchCall[] = [];
  const file = new File([new Uint8Array([1, 2, 3])], "circular.pdf", {
    type: "application/pdf",
  });

  const result = await sendNotification(
    "token",
    {
      audience: "course",
      title: "Aviso",
      content: "Texto",
      courseId: "curso-1",
      attachment: file,
    },
    {
      baseUrl: "http://api.test",
      fetchImpl: async (input, init) => {
        calls.push({ input, init });
        return new Response(null, { status: 204 });
      },
    },
  );

  assert.equal(result.ok, true);
  assert.equal(new Headers(calls[0]?.init?.headers).has("Content-Type"), false);

  const body = calls[0]?.init?.body;

  assert.ok(body instanceof FormData);
  assert.equal(body.get("courseId"), "curso-1");
  assert.equal(body.get("recipientId"), null);
  assert.ok(body.get("attachment") instanceof File);
});

test("acepta cualquier 2xx aunque no incluya id", () => {
  const result = parseNotificationSendResponse(200, {
    message: "Enviada",
    errors: [],
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok ? result.id : null, null);
});

test("mapea 403, 404, 413, 422 y 500 del envío", () => {
  assert.equal(sendKind(parseNotificationSendResponse(403, {})), "forbidden");
  assert.equal(sendKind(parseNotificationSendResponse(404, {})), "not_found");
  assert.equal(sendKind(parseNotificationSendResponse(413, {})), "too_large");

  const validation = parseNotificationSendResponse(422, {
    message: "Errores",
    errors: {
      title: ["El título es obligatorio."],
      recipients: ["Sin destinatarios."],
    },
  });

  assert.equal(validation.ok, false);

  if (!validation.ok) {
    assert.equal(validation.kind, "validation");
    assert.equal(validation.fieldErrors?.title, "El título es obligatorio.");
    assert.equal(validation.fieldErrors?.recipients, "Sin destinatarios.");
  }

  assert.equal(sendKind(parseNotificationSendResponse(500, {})), "server");
});

test("un fallo de red en el envío es incierto", async () => {
  const result = await sendNotification(
    "token",
    {
      audience: "allTutors",
      title: "Aviso",
      content: "Texto",
    },
    {
      baseUrl: "http://api.test",
      fetchImpl: async () => {
        const error = new Error("timeout");
        error.name = "TimeoutError";
        throw error;
      },
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok ? "" : result.kind, "uncertain");
});

test("descarga el adjunto y recupera el nombre de Content-Disposition", async () => {
  const result = await downloadNotificationAttachment("token", "n1", {
    baseUrl: "http://api.test",
    fetchImpl: async () =>
      new Response(new Blob(["hola"]), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="circular.pdf"',
        },
      }),
  });

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.filename, "circular.pdf");
    assert.equal(result.contentType, "application/pdf");
  }
});

test("la descarga maneja 403/404/5xx y nombre ausente", async () => {
  const notFound = await downloadNotificationAttachment("token", "n1", {
    baseUrl: "http://api.test",
    fetchImpl: async () => jsonResponse(404, {}),
  });

  assert.equal(notFound.ok, false);
  assert.equal(notFound.ok ? "" : notFound.kind, "not_found");

  const server = await downloadNotificationAttachment("token", "n1", {
    baseUrl: "http://api.test",
    fetchImpl: async () => jsonResponse(500, {}),
  });

  assert.equal(server.ok, false);
  assert.equal(server.ok ? "" : server.kind, "server");

  const noName = await downloadNotificationAttachment("token", "n1", {
    baseUrl: "http://api.test",
    fetchImpl: async () =>
      new Response(new Blob(["x"]), {
        status: 200,
        headers: { "Content-Type": "application/octet-stream" },
      }),
  });

  assert.equal(noName.ok, true);

  if (noName.ok) {
    assert.equal(noName.filename, "adjunto");
  }
});

test("un listado con fecha inválida falla completo", () => {
  const result = parseNotificationListResponse(200, {
    data: [{ ...rawItem, sentAt: "2026-02-30T10:00:00+00:00" }],
    message: "",
    errors: [],
  });

  assert.equal(result.ok, false);
});
