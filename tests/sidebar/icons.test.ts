import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  NEW_SIDEBAR_ICON_FILES,
  SIDEBAR_ICON_PATHS,
  getSidebarIconPath,
} from "../../app/lib/sidebar/icons.ts";
import type { SidebarIconKey } from "../../app/lib/sidebar/types.ts";

const ICON_KEYS: readonly SidebarIconKey[] = [
  "home",
  "students",
  "courses",
  "inscriptions",
  "notification",
  "users",
  "staff",
  "reports",
  "profile",
  "settings",
];

test("todas las claves de icono tienen una ruta declarada", () => {
  for (const key of ICON_KEYS) {
    assert.equal(typeof SIDEBAR_ICON_PATHS[key], "string");
    assert.ok(SIDEBAR_ICON_PATHS[key].startsWith("/icons/"));
    assert.equal(getSidebarIconPath(key), SIDEBAR_ICON_PATHS[key]);
  }
});

test("reutiliza los iconos existentes para alumnos, cursos e inscripciones", () => {
  assert.equal(SIDEBAR_ICON_PATHS.students, "/icons/ico-read-book.svg");
  assert.equal(SIDEBAR_ICON_PATHS.courses, "/icons/ico-course.svg");
  assert.equal(SIDEBAR_ICON_PATHS.inscriptions, "/icons/ico-register.svg");
});

test("el icono de directorio de staff es propio", () => {
  assert.equal(SIDEBAR_ICON_PATHS.staff, "/icons/ico-staff.svg");
  assert.equal(getSidebarIconPath("staff"), "/icons/ico-staff.svg");
});

test("declara los seis iconos nuevos sin repetirlos", () => {
  assert.deepEqual([...NEW_SIDEBAR_ICON_FILES], [
    "ico-home.svg",
    "ico-users.svg",
    "ico-staff.svg",
    "ico-report.svg",
    "ico-profile.svg",
    "ico-settings.svg",
  ]);
  assert.equal(
    new Set(NEW_SIDEBAR_ICON_FILES).size,
    NEW_SIDEBAR_ICON_FILES.length,
  );
});

test("las rutas de icono no se repiten entre opciones distintas", () => {
  const paths = Object.values(SIDEBAR_ICON_PATHS);

  assert.equal(new Set(paths).size, paths.length);
});

test("todos los archivos de icono del menú existen en public/icons", () => {
  for (const path of Object.values(SIDEBAR_ICON_PATHS)) {
    const file = path.replace("/icons/", "");
    const absolute = resolve(process.cwd(), "public", "icons", file);

    assert.equal(existsSync(absolute), true, `Falta ${file}`);
  }

  for (const file of NEW_SIDEBAR_ICON_FILES) {
    const absolute = resolve(process.cwd(), "public", "icons", file);

    assert.equal(existsSync(absolute), true, `Falta ${file}`);
  }
});

