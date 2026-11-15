"use client";

import { useState, useRef, useEffect } from "react";
import {
  COURSE_CYCLE_FILTER_OPTIONS,
  COURSE_SHIFT_FILTER_OPTIONS,
  COURSE_SPECIALITY_FILTER_OPTIONS,
} from "../../lib/courses/labels.ts";
import {
  extractCuilDigits,
  formatCuil,
} from "../../lib/registrations/cuil.ts";
import type { RegistrationFilters } from "../../lib/registrations/types.ts";
import SelectField from "../forms/select-field.tsx";

interface RegistrationFiltersPanelProps {
  filters: RegistrationFilters;
  years: readonly number[];
  onFiltersChange: (filters: RegistrationFilters) => void;
  onClear: () => void;
}

type SearchFieldType = "firstName" | "lastName" | "studentDni" | "studentCuil";

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const LABEL_CLASSES = "mb-1 block text-xs font-semibold uppercase tracking-wider text-texto-secundario";

const CONTROL_CLASSES =
  `min-h-10 w-full rounded-lg border border-borde-input bg-superficie px-3 py-2 text-sm text-texto-principal transition-colors focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus ${FOCUS_RING_CLASSES}`;

export default function RegistrationFiltersPanel({
  filters,
  years,
  onFiltersChange,
  onClear,
}: RegistrationFiltersPanelProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchType, setSearchType] = useState<SearchFieldType>("firstName");

  const advancedRef = useRef<HTMLDivElement>(null);

  // Cerrar panel de filtros avanzados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (advancedRef.current && !advancedRef.current.contains(event.target as Node)) {
        setIsAdvancedOpen(false);
      }
    };

    if (isAdvancedOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAdvancedOpen]);

  // Obtener el valor actual y placeholder según el tipo de búsqueda seleccionado
  const getCurrentSearchValue = () => {
    switch (searchType) {
      case "firstName": return filters.firstName;
      case "lastName": return filters.lastName;
      case "studentDni": return filters.studentDni;
      case "studentCuil": return filters.studentCuil;
    }
  };

  const getSearchPlaceholder = () => {
    switch (searchType) {
      case "firstName": return "Escriba el nombre del alumno...";
      case "lastName": return "Escriba el apellido del alumno...";
      case "studentDni": return "Ingrese DNI (solo dígitos)...";
      case "studentCuil": return "Ingrese CUIL (ej. 20-XXXXXXXX-X)...";
    }
  };

  // Manejar cambio en el input de búsqueda principal limpiando los demás campos de texto principales para evitar conflictos
  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, firstName: "", lastName: "", studentDni: "", studentCuil: "" };

    if (searchType === "studentDni") {
      newFilters.studentDni = value.replace(/\D/g, "").slice(0, 8);
    } else if (searchType === "studentCuil") {
      newFilters.studentCuil = extractCuilDigits(value).slice(0, 11);
    } else {
      newFilters[searchType] = value;
    }

    onFiltersChange(newFilters);
  };

  const update = <K extends keyof RegistrationFilters>(
    key: K,
    value: RegistrationFilters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const yearOptions = [
    { value: "all", label: "Todos los años" },
    ...years.map((year) => ({ value: String(year), label: String(year) })),
  ];

  const studyYearOptions = [
    { value: "all", label: "Todos" },
    ...[1, 2, 3, 4, 5, 6].map((year) => ({
      value: String(year),
      label: String(year),
    })),
  ];

  const activeAdvancedCount = [
    filters.year !== "all",
    filters.studyYear !== "all",
    filters.division !== "",
    filters.cycle !== "all",
    filters.shift !== "all",
    filters.speciality !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters =
    Boolean(filters.firstName) ||
    Boolean(filters.lastName) ||
    Boolean(filters.studentDni) ||
    Boolean(filters.studentCuil) ||
    activeAdvancedCount > 0;

  return (
    <section
      aria-label="Filtros de inscripciones"
      className="rounded-xl border border-borde-input bg-superficie p-4 shadow-sm transition-all relative"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        
        {/* Barra de Búsqueda con Selector de Criterio Integrado */}
        <div className="flex flex-1 items-center rounded-lg border border-borde-input bg-superficie focus-within:border-borde-focus focus-within:ring-2 focus-within:ring-borde-focus">
          
          {/* Selector desplegable integrado para elegir el campo */}
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as SearchFieldType)}
            aria-label="Criterio de búsqueda"
            className="bg-fondo-app text-texto-principal text-xs font-semibold py-2.5 px-3 rounded-l-lg border-r border-borde-input outline-none cursor-pointer hover:bg-borde transition-colors"
          >
            <option value="firstName">Nombre alumno</option>
            <option value="lastName">Apellido</option>
            <option value="studentDni">DNI</option>
            <option value="studentCuil">CUIL</option>
          </select>

          {/* Icono de búsqueda */}
          <span className="pl-3 text-texto-secundario pointer-events-none flex items-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>

          {/* Input de texto dinámico */}
          <input
            type="search"
            value={searchType === "studentCuil" ? formatCuil(filters.studentCuil) : getCurrentSearchValue()}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={getSearchPlaceholder()}
            autoComplete="off"
            className="w-full bg-transparent px-3 py-2.5 text-sm text-texto-principal outline-none"
          />
        </div>

        {/* Acciones: Filtros Avanzados y Limpiar */}
        <div className="flex items-center gap-2 self-end md:self-auto" ref={advancedRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`inline-flex items-center gap-2 rounded-lg border border-borde-input bg-superficie px-4 py-2.5 text-sm font-medium text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`}
            >
              <svg className="w-4 h-4 text-texto-secundario" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filtros avanzados</span>
              {activeAdvancedCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-azul-principal text-[11px] font-bold text-white">
                  {activeAdvancedCount}
                </span>
              )}
            </button>

            {/* Panel Desplegable de Filtros Avanzados tipo Popover */}
            {isAdvancedOpen && (
              <div className="absolute right-0 mt-2 z-20 w-full md:w-[640px] rounded-2xl border border-borde bg-superficie p-5 shadow-xl animate-fadeIn">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-borde">
                  <h3 className="text-sm font-bold text-texto-principal uppercase tracking-wider">Filtros Avanzados de Cursada</h3>
                  <button
                    type="button"
                    onClick={() => setIsAdvancedOpen(false)}
                    className="text-texto-secundario hover:text-texto-principal p-1 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <SelectField
                      id="reg-year"
                      label="Año lectivo"
                      value={filters.year}
                      options={yearOptions}
                      onChange={(event) => update("year", event.target.value)}
                    />
                  </div>

                  <div>
                    <SelectField
                      id="reg-study-year"
                      label="Año de cursada"
                      value={filters.studyYear}
                      options={studyYearOptions}
                      onChange={(event) => update("studyYear", event.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-division" className={LABEL_CLASSES}>División</label>
                    <input
                      id="reg-division"
                      type="text"
                      value={filters.division}
                      onChange={(event) => update("division", event.target.value)}
                      placeholder="Ej. 1, A"
                      className={CONTROL_CLASSES}
                    />
                  </div>

                  <div>
                    <SelectField
                      id="reg-cycle"
                      label="Ciclo"
                      value={filters.cycle}
                      options={COURSE_CYCLE_FILTER_OPTIONS}
                      onChange={(event) => update("cycle", event.target.value)}
                    />
                  </div>

                  <div>
                    <SelectField
                      id="reg-shift"
                      label="Turno"
                      value={filters.shift}
                      options={COURSE_SHIFT_FILTER_OPTIONS}
                      onChange={(event) => update("shift", event.target.value)}
                    />
                  </div>

                  <div>
                    <SelectField
                      id="reg-speciality"
                      label="Especialidad"
                      value={filters.speciality}
                      options={COURSE_SPECIALITY_FILTER_OPTIONS}
                      onChange={(event) => update("speciality", event.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              title="Limpiar todos los filtros"
              className={`rounded-lg border border-transparent p-2.5 text-sm font-medium text-texto-secundario transition-colors hover:bg-estado-rechazado-fondo hover:text-estado-rechazado ${FOCUS_RING_CLASSES}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}