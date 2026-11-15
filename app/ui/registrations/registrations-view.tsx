"use client";

import { useEffect, useMemo, useState } from "react";

import {
  clearFilters,
  filterRegistrations,
  paginateRegistrations,
  sortRegistrations,
  type RegistrationSortOrder,
} from "../../lib/registrations/list.ts";
import {
  readStoredIdentifiers,
  writeStoredIdentifiers,
} from "../../lib/registrations/filters-storage.ts";
import { serializeRegistrationsFilters } from "../../lib/registrations/registrations-url.ts";
import type {
  Registration,
  RegistrationFilters,
  RegistrationStatusTab,
} from "../../lib/registrations/types.ts";
import RegistrationCard from "./registration-card.tsx";
import RegistrationFiltersPanel from "./registration-filters.tsx";
import RegistrationPagination from "./registration-pagination.tsx";
import RegistrationsHeader from "./registrations-header.tsx";
import { RegistrationEmptyState } from "./registration-states.tsx";
import StatusTabs from "./status-tabs.tsx";

interface RegistrationsViewProps {
  registrations: readonly Registration[];
  years: readonly number[];
  initialTab: RegistrationStatusTab;
  initialFilters: RegistrationFilters;
  initialPage: number;
}

const SORT_CLASSES =
  "min-h-11 rounded-lg border border-borde-input bg-superficie px-3 py-2 text-base text-texto-principal focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus";

/** Coordina pestañas, filtros, orden y paginación sobre el conjunto completo. */
export default function RegistrationsView({
  registrations,
  years,
  initialTab,
  initialFilters,
  initialPage,
}: RegistrationsViewProps) {
  const [tab, setTab] = useState<RegistrationStatusTab>(initialTab);
  const [filters, setFilters] = useState<RegistrationFilters>(() => ({
    ...initialFilters,
    ...readStoredIdentifiers(),
  }));
  const [page, setPage] = useState(initialPage);
  const [sortOrder, setSortOrder] =
    useState<RegistrationSortOrder>("recent");

  const filtered = useMemo(
    () => filterRegistrations(registrations, tab, filters),
    [registrations, tab, filters],
  );
  const sorted = useMemo(
    () => sortRegistrations(filtered, sortOrder),
    [filtered, sortOrder],
  );
  const pageData = useMemo(
    () => paginateRegistrations(sorted, page),
    [sorted, page],
  );

  useEffect(() => {
    const query = serializeRegistrationsFilters(filters, tab, pageData.page);
    const nextUrl =
      query.length > 0
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
    writeStoredIdentifiers({
      studentDni: filters.studentDni,
      studentCuil: filters.studentCuil,
    });
  }, [filters, tab, pageData.page]);

  const handleTabChange = (nextTab: RegistrationStatusTab) => {
    setTab(nextTab);
    setPage(1);
  };

  const handleFiltersChange = (nextFilters: RegistrationFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleClear = () => {
    setFilters(clearFilters());
    setPage(1);
  };

  const hasRegistrations = registrations.length > 0;
  const hasFiltered = filtered.length > 0;

  return (
    <div className="space-y-6">
      <RegistrationsHeader />

      <StatusTabs value={tab} onChange={handleTabChange} />

      <RegistrationFiltersPanel
        filters={filters}
        years={years}
        onFiltersChange={handleFiltersChange}
        onClear={handleClear}
      />

      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-texto-secundario">
          {filtered.length}{" "}
          {filtered.length === 1 ? "solicitud" : "solicitudes"}
        </p>

        <div className="flex items-center gap-2">
          <label
            htmlFor="reg-sort"
            className="text-sm font-medium text-texto-principal"
          >
            Ordenar por
          </label>
          <select
            id="reg-sort"
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value as RegistrationSortOrder)
            }
            className={SORT_CLASSES}
          >
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguas</option>
          </select>
        </div>
      </div>

      {!hasRegistrations ? (
        <RegistrationEmptyState variant="global" />
      ) : !hasFiltered ? (
        <RegistrationEmptyState
          variant="filtered"
          onClearFilters={handleClear}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageData.items.map((registration) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
              />
            ))}
          </div>

          <RegistrationPagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalResults={pageData.total}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
