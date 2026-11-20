import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  SIDEBAR_ICON_PATHS,
  getSidebarIconPath,
} from "../../app/lib/sidebar/icons.ts";

test("Notificaciones reutiliza la campana existente", () => {
  assert.equal(SIDEBAR_ICON_PATHS.notification, "/icons/ico-bell.svg");
  assert.equal(getSidebarIconPath("notification"), "/icons/ico-bell.svg");
  assert.equal(
    existsSync(resolve(process.cwd(), "public", "icons", "ico-bell.svg")),
    true,
  );
});
