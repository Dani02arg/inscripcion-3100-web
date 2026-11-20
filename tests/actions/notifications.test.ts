import assert from "node:assert/strict";
import { test } from "node:test";

import {
  badgeActionCore,
  downloadActionCore,
  readActionCore,
  sendActionCore,
} from "../../app/lib/notifications/action-core.ts";
import type {
  NotificationFieldErrors,
  NotificationItem,
  NotificationSendResult,
} from "../../app/lib/notifications/types.ts";

const item: NotificationItem = {
  id: "n1",
  title: "Aviso",
  content: "Contenido",
  isRead: false,
  readAt: null,
  hasAttachment: false,
  attachmentUrl: null,
  sentAt: "2026-11-02T14:30:00+00:00",
};

function formData(values: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

test("el badge devuelve null sin token o cuando el conteo falla", async () => {
  assert.equal(
    await badgeActionCore({
      getToken: async () => null,
      countUnread: async () => 3,
    }),
    null,
  );

  assert.equal(
    await badgeActionCore({
      getToken: async () => "token",
      countUnread: async () => null,
    }),
    null,
  );

  assert.equal(
    await badgeActionCore({
      getToken: async () => "token",
      countUnread: async () => 3,
    }),
    3,
  );
});

test("la lectura exitosa devuelve la notificación del servicio", async () => {
  const result = await readActionCore("n1", {
    getAccess: async () => ({ status: "ok", token: "token" }),
    callApi: async () => ({
      ok: true,
      notification: {
        ...item,
        isRead: true,
        readAt: "2026-11-02T15:00:00+00:00",
      },
      message: "",
    }),
    redirect: () => {
      throw new Error("no debería redirigir");
    },
  });

  assert.equal(result.status, "success");
});

test("la lectura 403/404 informa no disponible y el error conserva el detalle", async () => {
  const unavailable = await readActionCore("n1", {
    getAccess: async () => ({ status: "ok", token: "token" }),
    callApi: async () => ({
      ok: false,
      kind: "not_found",
      status: 404,
      message: "No disponible.",
    }),
    redirect: () => {
      throw new Error("no debería redirigir");
    },
  });

  assert.equal(unavailable.status, "unavailable");

  const failed = await readActionCore("n1", {
    getAccess: async () => ({ status: "ok", token: "token" }),
    callApi: async () => ({
      ok: false,
      kind: "server",
      status: 500,
      message: "Falló.",
    }),
    redirect: () => {
      throw new Error("no debería redirigir");
    },
  });

  assert.equal(failed.status, "error");
});

test("la lectura sin sesión redirige", async () => {
  const redirects: string[] = [];

  await assert.rejects(
    readActionCore("n1", {
      getAccess: async () => ({
        status: "forbidden",
        kind: "unauthorized",
        message: "Sesión vencida.",
      }),
      callApi: async () => ({
        ok: true,
        notification: item,
        message: "",
      }),
      redirect: (path) => {
        redirects.push(path);
        throw new Error(path);
      },
    }),
  );

  assert.deepEqual(redirects, ["/session-expired"]);
});

test("la descarga convierte el blob y respeta los errores", async () => {
  const blob = new Blob(["hola"]);

  const success = await downloadActionCore("n1", {
    getAccess: async () => ({ status: "ok", token: "token" }),
    callApi: async () => ({
      ok: true,
      blob,
      filename: "circular.pdf",
      contentType: "application/pdf",
    }),
    redirect: () => {
      throw new Error("no debería redirigir");
    },
    encodeAttachment: async () => "aG9sYQ==",
  });

  assert.equal(success.status, "success");

  if (success.status === "success") {
    assert.equal(success.base64, "aG9sYQ==");
  }

  const server = await downloadActionCore("n1", {
    getAccess: async () => ({ status: "ok", token: "token" }),
    callApi: async () => ({
      ok: false,
      kind: "server",
      status: 500,
      message: "Falló la descarga.",
    }),
    redirect: () => {
      throw new Error("no debería redirigir");
    },
    encodeAttachment: async () => "",
  });

  assert.equal(server.status, "error");
});

function sendDependencies(
  overrides: {
    readonly access?: "ok" | "forbidden" | "unauthorized";
    readonly result?:
      | { readonly ok: true; readonly id: string | null; readonly message: string }
      | {
          readonly ok: false;
          readonly kind:
            | "forbidden"
            | "not_found"
            | "too_large"
            | "uncertain"
            | "validation"
            | "server";
          readonly status: number | null;
          readonly message: string;
          readonly fieldErrors?: NotificationFieldErrors;
        };
    readonly redirects?: string[];
    readonly revalidated?: string[];
  } = {},
) {
  const redirects = overrides.redirects ?? [];
  const revalidated = overrides.revalidated ?? [];
  const accessStatus = overrides.access ?? "ok";

  return {
    redirects,
    revalidated,
    deps: {
      getAccess: async () => {
        if (accessStatus === "ok") {
          return { status: "ok" as const, token: "token" };
        }

        return {
          status: "forbidden" as const,
          kind: accessStatus,
          message:
            accessStatus === "unauthorized"
              ? "Tu sesión expiró."
              : "Sin permiso.",
        };
      },
      callSendApi: async (): Promise<NotificationSendResult> =>
        overrides.result ?? {
          ok: true as const,
          id: "n1",
          message: "Enviada.",
        },
      redirect: (path: string) => {
        redirects.push(path);
        throw new Error(path);
      },
      revalidate: (path: string) => {
        revalidated.push(path);
      },
    },
  };
}

test("el envío individual válido revalida bandeja y dashboard", async () => {
  const { deps, revalidated } = sendDependencies();

  const result = await sendActionCore(
    formData({
      audience: "individual",
      title: "  Aviso  ",
      content: "Texto",
      recipientId: "tutor-1",
    }),
    deps,
  );

  assert.equal(result.status, "success");
  assert.deepEqual(revalidated, ["/dashboard/notifications", "/dashboard"]);
});

test("el envío a todos los tutores no exige destinatario", async () => {
  const { deps } = sendDependencies();

  const result = await sendActionCore(
    formData({
      audience: "allTutors",
      title: "Aviso",
      content: "Texto",
    }),
    deps,
  );

  assert.equal(result.status, "success");
});

test("el envío sin curso o tutor falla en validación", async () => {
  const { deps } = sendDependencies();

  for (const audience of ["course", "individual"]) {
    const result = await sendActionCore(
      formData({ audience, title: "Aviso", content: "Texto" }),
      deps,
    );

    assert.equal(result.status, "validation");
  }
});

test("el envío valida título, contenido y adjunto", async () => {
  const { deps } = sendDependencies();

  const result = await sendActionCore(
    formData({
      audience: "allTutors",
      title: "   ",
      content: "  ",
    }),
    deps,
  );

  assert.equal(result.status, "validation");

  if (result.status === "validation") {
    assert.ok(result.fieldErrors.title);
    assert.ok(result.fieldErrors.content);
  }
});

test("mapea los errores del envío sin perder la redacción", async () => {
  const cases = [
    ["not_found", "not_found"],
    ["too_large", "too_large"],
    ["uncertain", "uncertain"],
    ["server", "error"],
  ] as const;

  for (const [kind, expected] of cases) {
    const { deps } = sendDependencies({
      result: {
        ok: false,
        kind,
        status: 500,
        message: "Mensaje del servicio.",
      },
    });

    const result = await sendActionCore(
      formData({
        audience: "allTutors",
        title: "Aviso",
        content: "Texto",
      }),
      deps,
    );

    assert.equal(result.status, expected);
  }
});

test("un 422 devuelve los errores por campo", async () => {
  const { deps } = sendDependencies({
    result: {
      ok: false,
      kind: "validation",
      status: 422,
      message: "Revisá.",
      fieldErrors: { title: "Obligatorio." },
    },
  });

  const result = await sendActionCore(
    formData({
      audience: "allTutors",
      title: "Aviso",
      content: "Texto",
    }),
    deps,
  );

  assert.equal(result.status, "validation");

  if (result.status === "validation") {
    assert.equal(result.fieldErrors.title, "Obligatorio.");
  }
});

test("el envío sin sesión redirige", async () => {
  const { deps, redirects } = sendDependencies({ access: "unauthorized" });

  await assert.rejects(
    sendActionCore(
      formData({
        audience: "allTutors",
        title: "Aviso",
        content: "Texto",
      }),
      deps,
    ),
  );

  assert.deepEqual(redirects, ["/session-expired"]);
});

test("un rol sin permiso no envía", async () => {
  const { deps } = sendDependencies({ access: "forbidden" });

  const result = await sendActionCore(
    formData({
      audience: "allTutors",
      title: "Aviso",
      content: "Texto",
    }),
    deps,
  );

  assert.equal(result.status, "forbidden");
});
