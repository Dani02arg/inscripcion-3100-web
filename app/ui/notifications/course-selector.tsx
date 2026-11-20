"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Course } from "../../lib/courses/types.ts";
import {
  buildNotificationCourseLabel,
  filterCoursesByQuery,
  limitSearchResults,
  NOTIFICATION_SEARCH_RESULT_LIMIT,
} from "../../lib/notifications/rules.ts";

export type CourseOptionsState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly courses: readonly Course[] }
  | { readonly status: "empty" }
  | { readonly status: "error"; readonly message: string };

interface CourseSelectorProps {
  readonly state: CourseOptionsState;
  readonly value: string | null;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly onChange: (courseId: string) => void;
  readonly onRetry: () => void;
}

const TRIGGER_CLASSES =
  "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-borde-input bg-superficie px-3 py-2 text-left text-base text-texto-principal focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario";

const SEARCH_CLASSES =
  "min-h-11 w-full rounded-lg border border-borde-input bg-superficie py-2 pl-10 pr-3 text-base text-texto-principal placeholder:text-placeholder focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus";

const EMPTY_COURSES: readonly Course[] = Object.freeze([]);

/** Selector de curso con búsqueda en vivo y hasta cuatro coincidencias. */
export default function CourseSelector({
  state,
  value,
  error,
  disabled = false,
  onChange,
  onRetry,
}: CourseSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const courses = state.status === "ready" ? state.courses : EMPTY_COURSES;
  const selected = courses.find((course) => course.id === value) ?? null;
  const results = useMemo(
    () => limitSearchResults(filterCoursesByQuery(courses, query)),
    [courses, query],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent): void => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const closeAndFocus = (): void => {
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  };

  const selectCourse = (course: Course): void => {
    onChange(course.id);
    closeAndFocus();
  };

  if (state.status === "loading") {
    return (
      <p role="status" className="text-sm text-texto-secundario">
        Cargando cursos…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-2">
        <p role="alert" className="text-sm font-medium text-estado-error-texto">
          {state.message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2 text-sm font-semibold text-texto-principal hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <p role="status" className="text-sm text-texto-secundario">
        No hay cursos para elegir en el año lectivo vigente.
      </p>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor="notification-course-trigger"
        className="mb-1 block text-sm font-semibold text-texto-principal"
      >
        Curso
      </label>

      <button
        ref={triggerRef}
        id="notification-course-trigger"
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="notification-course-panel"
        onClick={() => {
          setOpen((current) => !current);
          setQuery("");
          setActiveIndex(0);
        }}
        className={TRIGGER_CLASSES}
      >
        <span className="min-w-0 break-words">
          {selected ? buildNotificationCourseLabel(selected) : "Seleccioná un curso"}
        </span>
        <span aria-hidden="true" className="shrink-0 text-xs">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div
          id="notification-course-panel"
          className="absolute z-20 mt-2 w-full rounded-xl border border-borde-input bg-superficie p-2 shadow-lg"
        >
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-secundario"
            >
              <SearchIcon />
            </span>
            <input
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls="notification-course-listbox"
              aria-autocomplete="list"
              aria-activedescendant={
                results.items[activeIndex]
                  ? `notification-course-option-${results.items[activeIndex].id}`
                  : undefined
              }
              aria-label="Buscar curso"
              placeholder="Buscar por curso, código, división o especialidad"
              value={query}
              autoFocus
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    results.items.length === 0
                      ? 0
                      : (current + 1) % results.items.length,
                  );
                  return;
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    results.items.length === 0
                      ? 0
                      : (current - 1 + results.items.length) %
                        results.items.length,
                  );
                  return;
                }

                if (event.key === "Enter") {
                  event.preventDefault();
                  const course = results.items[activeIndex];

                  if (course) {
                    selectCourse(course);
                  }

                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  closeAndFocus();
                }
              }}
              className={SEARCH_CLASSES}
            />
          </div>

          {results.items.length === 0 ? (
            <p role="status" className="px-2 py-3 text-sm text-texto-secundario">
              No encontramos cursos con ese criterio.
            </p>
          ) : (
            <ul
              id="notification-course-listbox"
              role="listbox"
              aria-label="Cursos"
              className="mt-2 max-h-64 space-y-1 overflow-y-auto"
            >
              {results.items.map((course, index) => {
                const active = selected?.id === course.id;
                const highlighted = index === activeIndex;

                return (
                  <li key={course.id}>
                    <button
                      id={`notification-course-option-${course.id}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => {
                        setActiveIndex(index);
                      }}
                      onClick={() => {
                        selectCourse(course);
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        active
                          ? "border-azul-institucional bg-azul-suave font-semibold text-azul-institucional"
                          : highlighted
                            ? "border-borde-focus bg-fondo-app text-texto-principal"
                            : "border-transparent text-texto-principal hover:bg-fondo-app"
                      }`}
                    >
                      {buildNotificationCourseLabel(course)}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {results.total > NOTIFICATION_SEARCH_RESULT_LIMIT ? (
            <p role="status" className="px-2 pt-2 text-xs text-texto-secundario">
              Mostrando {NOTIFICATION_SEARCH_RESULT_LIMIT} de {results.total}{" "}
              coincidencias. Refiná la búsqueda para ver otras.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p
          id="notification-course-error"
          role="alert"
          className="mt-1 text-sm font-medium text-estado-error-texto"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
