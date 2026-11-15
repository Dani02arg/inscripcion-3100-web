import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REGISTRATION_PAGE_SIZE,
  clearFilters,
  filterRegistrations,
  getDefaultFilters,
  hasActiveFilters,
  paginateRegistrations,
  sortRegistrations,
} from "../../app/lib/registrations/list.ts";
import type { Registration } from "../../app/lib/registrations/types.ts";

function makeRegistration(
  overrides: Partial<Registration> & { readonly id: string },
): Registration {
  return {
    status: "PENDING",
    studentId: "st-1",
    idCourse: "c-1",
    proposedCourseId: null,
    institutionOfOrigin: null,
    relationship: "Padre",
    photoAuthorization: true,
    healthProblem: false,
    inclusionStudent: false,
    contactImpediment: false,
    legalProceedings: false,
    hasHealthProblemCertificate: false,
    hasInclusionStudentCertificate: false,
    hasContactImpedimentCertificate: false,
    hasLegalProceedingsCertificate: false,
    reassignmentReason: null,
    observations: null,
    pendingSubjects: null,
    missingDocumentation: null,
    student: {
      id: "s-1",
      studentCuil: "20123456789",
      firstName: "Lucas",
      lastName: "Pérez",
    },
    course: {
      id: "c-1",
      code: "2026-1-1-BAS-INF-M",
      year: 2026,
      studyYear: 1,
      division: "1",
      cycle: "basic",
      shift: "morning",
      speciality: "informatics",
    },
    proposedCourse: null,
    created_at: "2026-10-31T15:30:00Z",
    updated_at: "2026-10-31T15:30:00Z",
    ...overrides,
  };
}

test("los filtros por defecto están vacíos o en «Todas/Todos»", () => {
  assert.deepEqual(getDefaultFilters(), {
    studentDni: "",
    studentCuil: "",
    firstName: "",
    lastName: "",
    year: "all",
    studyYear: "all",
    division: "",
    cycle: "all",
    shift: "all",
    speciality: "all",
  });
  assert.deepEqual(clearFilters(), getDefaultFilters());
  assert.equal(hasActiveFilters(getDefaultFilters()), false);
});

test("hasActiveFilters detecta cualquier filtro activo", () => {
  assert.equal(
    hasActiveFilters({ ...getDefaultFilters(), studentCuil: "20123456789" }),
    true,
  );
  assert.equal(
    hasActiveFilters({ ...getDefaultFilters(), lastName: "pérez" }),
    true,
  );
  assert.equal(
    hasActiveFilters({ ...getDefaultFilters(), year: "2026" }),
    true,
  );
  assert.equal(
    hasActiveFilters({ ...getDefaultFilters(), cycle: "basic" }),
    true,
  );
});

test("filterRegistrations filtra por estado, CUIL, nombre y curso", () => {
  const regs = [
    makeRegistration({ id: "1" }),
    makeRegistration({
      id: "2",
      status: "APPROVED",
      student: {
        id: "s-2",
        studentCuil: "20987654321",
        firstName: "Ana",
        lastName: "Gómez",
      },
    }),
    makeRegistration({
      id: "3",
      status: "PENDING",
      student: {
        id: "s-3",
        studentCuil: "20555666777",
        firstName: "Lucas",
        lastName: "García",
      },
      course: {
        id: "c-3",
        code: "2026-2-1-BAS-INF-T",
        year: 2026,
        studyYear: 2,
        division: "1",
        cycle: "basic",
        shift: "afternoon",
        speciality: "informatics",
      },
    }),
  ];

  const defaults = getDefaultFilters();

  assert.equal(filterRegistrations(regs, "ALL", defaults).length, 3);
  assert.equal(filterRegistrations(regs, "PENDING", defaults).length, 2);
  assert.equal(filterRegistrations(regs, "APPROVED", defaults).length, 1);

  const byCuil = filterRegistrations(regs, "ALL", {
    ...defaults,
    studentCuil: "20987654321",
  });
  assert.deepEqual(byCuil.map((r) => r.id), ["2"]);

  const byName = filterRegistrations(regs, "ALL", {
    ...defaults,
    lastName: "garcia",
  });
  assert.deepEqual(byName.map((r) => r.id), ["3"]);

  const byCourse = filterRegistrations(regs, "ALL", {
    ...defaults,
    studyYear: "2",
    shift: "afternoon",
  });
  assert.deepEqual(byCourse.map((r) => r.id), ["3"]);

  // No muta la entrada
  filterRegistrations(regs, "ALL", { ...defaults, lastName: "x" });
  assert.equal(regs.length, 3);
});

test("sortRegistrations ordena por recientes y antiguas con desempate por id", () => {
  const regs = [
    makeRegistration({ id: "a", created_at: "2026-11-01T10:00:00Z" }),
    makeRegistration({ id: "b", created_at: "2026-10-01T10:00:00Z" }),
    makeRegistration({ id: "c", created_at: "2026-12-01T10:00:00Z" }),
  ];

  assert.deepEqual(
    sortRegistrations(regs, "recent").map((r) => r.id),
    ["c", "a", "b"],
  );
  assert.deepEqual(
    sortRegistrations(regs, "oldest").map((r) => r.id),
    ["b", "a", "c"],
  );

  const tie = [
    makeRegistration({ id: "z", created_at: "2026-11-01T10:00:00Z" }),
    makeRegistration({ id: "a", created_at: "2026-11-01T10:00:00Z" }),
  ];
  assert.deepEqual(
    sortRegistrations(tie, "recent").map((r) => r.id),
    ["a", "z"],
  );
});

test("paginateRegistrations pagina de a 15 y ajusta la página fuera de rango", () => {
  const regs = Array.from({ length: 32 }, (_, index) =>
    makeRegistration({ id: String(index + 1) }),
  );

  assert.equal(REGISTRATION_PAGE_SIZE, 15);

  const first = paginateRegistrations(regs, 1);
  assert.equal(first.items.length, 15);
  assert.equal(first.total, 32);
  assert.equal(first.totalPages, 3);
  assert.equal(first.from, 1);
  assert.equal(first.to, 15);

  const last = paginateRegistrations(regs, 3);
  assert.equal(last.items.length, 2);
  assert.equal(last.from, 31);
  assert.equal(last.to, 32);

  // Página fuera de rango se ajusta a la última
  assert.equal(paginateRegistrations(regs, 99).page, 3);
  assert.equal(paginateRegistrations(regs, 0).page, 1);
  assert.equal(paginateRegistrations(regs, -5).page, 1);

  // Conjunto vacío
  const empty = paginateRegistrations([], 1);
  assert.equal(empty.total, 0);
  assert.equal(empty.totalPages, 1);
  assert.equal(empty.items.length, 0);
});
