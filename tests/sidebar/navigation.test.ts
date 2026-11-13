import assert from "node:assert/strict";
import { test } from "node:test";

import { KNOWN_ROLES } from "../../app/lib/auth/types.ts";
import {
  ACCOUNT_PATH,
  PROFILE_PATH,
  SIDEBAR_NAVIGATION,
  getActiveChild,
  getNavigationItemState,
  getRoleNavigation,
  isHrefActive,
  isSectionItem,
  normalizePathname,
} from "../../app/lib/sidebar/navigation.ts";
import type { SidebarNavItem } from "../../app/lib/sidebar/types.ts";

test("el tutor recibe sus opciones en el orden de la spec", () => {
  const labels = getRoleNavigation("TUTOR").map((item) => item.label);

  assert.deepEqual(labels, [
    "Inicio",
    "Mis hijos",
    "Inscripciones",
    "Mi perfil",
  ]);
});

test("el administrativo recibe sus opciones en el orden de la spec", () => {
  const labels = getRoleNavigation("ADMINISTRATIVO").map((item) => item.label);

  assert.deepEqual(labels, [
    "Inicio",
    "Alumnos",
    "Cursos",
    "Inscripciones",
    "Gestión de usuarios",
    "Mi perfil",
  ]);
});

test("el administrador recibe sus opciones en el orden de la spec", () => {
  const labels = getRoleNavigation("ADMINISTRADOR").map((item) => item.label);

  assert.deepEqual(labels, [
    "Inicio",
    "Alumnos",
    "Cursos",
    "Inscripciones",
    "Gestión de usuarios",
    "Reportes",
    "Mi perfil",
  ]);
});

test("Inicio, Cursos, la sección de usuarios y Mi perfil están habilitados", () => {
  const expected: Record<string, readonly string[]> = {
    TUTOR: ["Inicio", "Mis hijos", "Mi perfil"],
    ADMINISTRATIVO: [
      "Inicio",
      "Alumnos",
      "Cursos",
      "Gestión de usuarios",
      "Mi perfil",
    ],
    ADMINISTRADOR: [
      "Inicio",
      "Alumnos",
      "Cursos",
      "Gestión de usuarios",
      "Mi perfil",
    ],
  };

  for (const role of KNOWN_ROLES) {
    const items = getRoleNavigation(role);
    const enabled = items.filter((item) => item.enabled);

    assert.deepEqual(
      enabled.map((item) => item.label),
      expected[role],
    );
    assert.ok(
      items
        .filter((item) => !item.enabled)
        .every((item) => item.href === null),
    );
  }
});

test("cada rol ve exclusivamente sus opciones", () => {
  const tutor = new Set(getRoleNavigation("TUTOR").map((item) => item.label));
  const administrativo = new Set(
    getRoleNavigation("ADMINISTRATIVO").map((item) => item.label),
  );
  const administrador = new Set(
    getRoleNavigation("ADMINISTRADOR").map((item) => item.label),
  );

  assert.equal(tutor.has("Alumnos"), false);
  assert.equal(tutor.has("Cursos"), false);
  assert.equal(tutor.has("Gestión de usuarios"), false);
  assert.equal(tutor.has("Reportes"), false);

  assert.equal(tutor.has("Mis hijos"), true);
  assert.equal(administrativo.has("Mis hijos"), false);
  assert.equal(administrativo.has("Alumnos"), true);
  assert.equal(administrativo.has("Gestión de usuarios"), true);
  assert.equal(administrativo.has("Reportes"), false);

  assert.equal(administrador.has("Mis hijos"), false);
  assert.equal(administrador.has("Alumnos"), true);
});

test("ningún rol repite opciones y todos empiezan por Inicio", () => {
  for (const role of KNOWN_ROLES) {
    const items = getRoleNavigation(role);
    const labels = items.map((item) => item.label);

    assert.equal(labels[0], "Inicio");
    assert.equal(new Set(labels).size, labels.length);
  }
});

test("un rol no reconocido no recibe opciones", () => {
  assert.deepEqual(getRoleNavigation("DESCONOCIDO"), []);
  assert.deepEqual(getRoleNavigation(null), []);
  assert.deepEqual(getRoleNavigation(42), []);
});

test("el inventario cubre exactamente los tres roles conocidos", () => {
  assert.deepEqual(Object.keys(SIDEBAR_NAVIGATION).sort(), [
    "ADMINISTRADOR",
    "ADMINISTRATIVO",
    "TUTOR",
  ]);
  assert.deepEqual([...KNOWN_ROLES].sort(), [
    "ADMINISTRADOR",
    "ADMINISTRATIVO",
    "TUTOR",
  ]);
});

test("normalizePathname descarta query, fragmento y barras finales", () => {
  assert.equal(normalizePathname("/dashboard"), "/dashboard");
  assert.equal(normalizePathname("/dashboard/"), "/dashboard");
  assert.equal(normalizePathname("/dashboard/?tab=1"), "/dashboard");
  assert.equal(normalizePathname("/dashboard#inicio"), "/dashboard");
  assert.equal(normalizePathname("/dashboard//"), "/dashboard");
  assert.equal(normalizePathname(""), "/");
  assert.equal(normalizePathname("/"), "/");
  assert.equal(normalizePathname("dashboard"), "/dashboard");
});

test("Inicio está activo en el dashboard con sus variantes de URL", () => {
  const home = getRoleNavigation("TUTOR")[0];

  assert.ok(home);
  assert.equal(getNavigationItemState(home, "/dashboard"), "active");
  assert.equal(getNavigationItemState(home, "/dashboard/"), "active");
  assert.equal(getNavigationItemState(home, "/dashboard?tab=1"), "active");
  assert.equal(getNavigationItemState(home, "/dashboard#inicio"), "active");
});

test("Inicio no se activa en rutas ajenas ni en subpantallas", () => {
  const home = getRoleNavigation("TUTOR")[0];

  assert.ok(home);
  assert.equal(getNavigationItemState(home, "/home"), "inactive");
  assert.equal(getNavigationItemState(home, "/login"), "inactive");
  assert.equal(getNavigationItemState(home, "/dashboard/otro"), "inactive");
});

test("Cursos está activo en la ruta y sus subpantallas", () => {
  const courses = getRoleNavigation("ADMINISTRADOR").find(
    (item) => item.label === "Cursos",
  );

  assert.ok(courses);
  assert.equal(courses.enabled, true);
  assert.equal(courses.href, "/dashboard/courses");
  assert.equal(courses.match, "prefix");
  assert.equal(
    getNavigationItemState(courses, "/dashboard/courses"),
    "active",
  );
  assert.equal(
    getNavigationItemState(courses, "/dashboard/courses/new"),
    "active",
  );
  assert.equal(
    getNavigationItemState(courses, "/dashboard/courses/course-1"),
    "active",
  );
  assert.equal(
    getNavigationItemState(courses, "/dashboard/courses/course-1/edit"),
    "active",
  );
  assert.equal(
    getNavigationItemState(courses, "/dashboard/courses-otros"),
    "inactive",
  );
});

test("La opción de alumnos está habilitada y activa en sus rutas", () => {
  const tutorStudents = getRoleNavigation("TUTOR").find(
    (item) => item.label === "Mis hijos",
  );
  const adminStudents = getRoleNavigation("ADMINISTRATIVO").find(
    (item) => item.label === "Alumnos",
  );

  assert.ok(tutorStudents);
  assert.ok(adminStudents);
  assert.equal(tutorStudents.enabled, true);
  assert.equal(tutorStudents.href, "/dashboard/students");
  assert.equal(tutorStudents.match, "prefix");
  assert.equal(adminStudents.enabled, true);
  assert.equal(adminStudents.href, "/dashboard/students");
  assert.equal(adminStudents.match, "prefix");

  for (const path of [
    "/dashboard/students",
    "/dashboard/students/new",
    "/dashboard/students/student-1",
    "/dashboard/students/student-1/edit",
  ]) {
    assert.equal(getNavigationItemState(tutorStudents, path), "active");
    assert.equal(getNavigationItemState(adminStudents, path), "active");
  }

  assert.equal(
    getNavigationItemState(tutorStudents, "/dashboard/students-otros"),
    "inactive",
  );
  assert.equal(
    getNavigationItemState(adminStudents, "/dashboard"),
    "inactive",
  );
});

test("Cursos no se activa para TUTOR y no desplaza a Inicio", () => {
  const tutorItems = getRoleNavigation("TUTOR");
  const adminItems = getRoleNavigation("ADMINISTRATIVO");
  const home = adminItems[0];

  assert.equal(tutorItems.some((item) => item.label === "Cursos"), false);
  assert.ok(home);
  assert.equal(
    getNavigationItemState(home, "/dashboard/courses"),
    "inactive",
  );
});

test("la sección de usuarios agrupa padrón y directorio", () => {
  const section = getRoleNavigation("ADMINISTRADOR").find(
    (item) => item.label === "Gestión de usuarios",
  );

  assert.ok(section);
  assert.equal(isSectionItem(section), true);
  assert.equal(section.enabled, true);
  assert.equal(section.href, null);
  assert.deepEqual(
    section.children?.map((child) => child.label),
    ["Padrón de usuarios", "Directorio de staff"],
  );
  assert.deepEqual(
    section.children?.map((child) => child.href),
    ["/dashboard/users", "/dashboard/users/staff"],
  );
});

test("la sección está activa en sus dos rutas y no en otras", () => {
  const section = getRoleNavigation("ADMINISTRADOR").find(
    (item) => item.label === "Gestión de usuarios",
  );

  assert.ok(section);
  assert.equal(
    getNavigationItemState(section, "/dashboard/users"),
    "active",
  );
  assert.equal(
    getNavigationItemState(section, "/dashboard/users/staff"),
    "active",
  );
  assert.equal(
    getNavigationItemState(section, "/dashboard/users/abc"),
    "active",
  );
  assert.equal(getNavigationItemState(section, "/dashboard"), "inactive");
  assert.equal(
    getNavigationItemState(section, "/dashboard/courses"),
    "inactive",
  );
});

test("el hijo activo de la sección corresponde a la ruta", () => {
  const section = getRoleNavigation("ADMINISTRATIVO").find(
    (item) => item.label === "Gestión de usuarios",
  );

  assert.ok(section);
  assert.equal(
    getActiveChild(section, "/dashboard/users")?.label,
    "Padrón de usuarios",
  );
  assert.equal(
    getActiveChild(section, "/dashboard/users/staff")?.label,
    "Directorio de staff",
  );
  assert.equal(
    getActiveChild(section, "/dashboard/users/abc")?.label,
    "Padrón de usuarios",
  );
  assert.equal(getActiveChild(section, "/dashboard/courses"), null);
});

test("Mi perfil está habilitado y activo en su ruta", () => {
  const profile = getRoleNavigation("TUTOR").find(
    (item) => item.label === "Mi perfil",
  );

  assert.ok(profile);
  assert.equal(profile.enabled, true);
  assert.equal(profile.href, PROFILE_PATH);
  assert.equal(
    getNavigationItemState(profile, "/dashboard/profile"),
    "active",
  );
  assert.equal(
    getNavigationItemState(profile, "/dashboard/users"),
    "inactive",
  );
});

test("Configuración de cuenta queda fuera de la navegación principal", () => {
  assert.equal(ACCOUNT_PATH, "/dashboard/account");

  for (const role of KNOWN_ROLES) {
    const items = getRoleNavigation(role);

    assert.equal(
      items.some((item) => item.href === ACCOUNT_PATH),
      false,
    );
    assert.equal(
      items.some((item) =>
        item.children?.some((child) => child.href === ACCOUNT_PATH),
      ),
      false,
    );
  }
});

test("las opciones no disponibles nunca se activan", () => {
  for (const role of KNOWN_ROLES) {
    const unavailableItems = getRoleNavigation(role).filter(
      (item) => !item.enabled,
    );

    for (const item of unavailableItems) {
      assert.equal(
        getNavigationItemState(item, "/dashboard"),
        "unavailable",
      );
      assert.equal(
        getNavigationItemState(item, "/dashboard/cualquiera"),
        "unavailable",
      );
    }
  }
});

test("sin coincidencia no hay ninguna opción activa", () => {
  const states = getRoleNavigation("ADMINISTRADOR").map((item) =>
    getNavigationItemState(item, "/ruta-desconocida"),
  );

  assert.equal(states.includes("active"), false);
});

test("un módulo futuro acepta sus subpantallas por prefijo", () => {
  const futureItem: SidebarNavItem = {
    label: "Alumnos",
    icon: "students",
    href: "/dashboard/alumnos",
    enabled: true,
    match: "prefix",
  };

  assert.equal(
    isHrefActive(futureItem.href, "/dashboard/alumnos", "prefix"),
    true,
  );
  assert.equal(
    isHrefActive(futureItem.href, "/dashboard/alumnos/", "prefix"),
    true,
  );
  assert.equal(
    isHrefActive(futureItem.href, "/dashboard/alumnos/123", "prefix"),
    true,
  );
  assert.equal(
    isHrefActive(futureItem.href, "/dashboard/alumnos-otros", "prefix"),
    false,
  );
  assert.equal(
    getNavigationItemState(futureItem, "/dashboard/alumnos/123"),
    "active",
  );
});

test("isHrefActive rechaza destinos nulos y respeta el modo exacto", () => {
  assert.equal(isHrefActive(null, "/dashboard"), false);
  assert.equal(isHrefActive("/dashboard", "/dashboard"), true);
  assert.equal(isHrefActive("/dashboard", "/dashboard/otro"), false);
});
