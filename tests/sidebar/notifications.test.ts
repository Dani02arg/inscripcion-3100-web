import assert from "node:assert/strict";
import { test } from "node:test";

import { KNOWN_ROLES } from "../../app/lib/auth/types.ts";
import { withNotificationBadge } from "../../app/lib/notifications/rules.ts";
import {
  NOTIFICATIONS_PATH,
  getNavigationItemState,
  getRoleNavigation,
} from "../../app/lib/sidebar/navigation.ts";

test("Notificaciones está habilitado para los tres roles y activo en su ruta", () => {
  assert.equal(NOTIFICATIONS_PATH, "/dashboard/notifications");

  for (const role of KNOWN_ROLES) {
    const item = getRoleNavigation(role).find(
      (entry) => entry.label === "Notificaciones",
    );

    assert.ok(item);
    assert.equal(item.enabled, true);
    assert.equal(item.href, NOTIFICATIONS_PATH);
    assert.equal(item.icon, "notification");
    assert.equal(
      getNavigationItemState(item, "/dashboard/notifications"),
      "active",
    );
    assert.equal(
      getNavigationItemState(item, "/dashboard/notifications/otra"),
      "active",
    );
    assert.equal(getNavigationItemState(item, "/dashboard"), "inactive");
  }
});

test("el badge se aplica solo a Notificaciones y se oculta sin no leídas", () => {
  const items = getRoleNavigation("TUTOR");
  const withBadge = withNotificationBadge(items, 4);
  const notifications = withBadge.find(
    (item) => item.label === "Notificaciones",
  );

  assert.ok(notifications);
  assert.equal(notifications.badge, 4);
  assert.equal(
    withBadge.filter((item) => item.badge !== undefined).length,
    1,
  );

  const hidden = withNotificationBadge(items, 0).find(
    (item) => item.label === "Notificaciones",
  );

  assert.ok(hidden);
  assert.equal(hidden.badge, 0);

  assert.deepEqual(withNotificationBadge(items, null), items);
});
