"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { loadNotificationTutorsAction } from "../../lib/actions/notifications.ts";
import {
  buildTutorOptionLabel,
  NOTIFICATION_NO_CONTACT_LABEL,
} from "../../lib/notifications/labels.ts";
import {
  filterTutorsByQuery,
  limitSearchResults,
  NOTIFICATION_SEARCH_RESULT_LIMIT,
} from "../../lib/notifications/rules.ts";
import type { UserSummary } from "../../lib/users/types.ts";

interface TutorSelectorProps {
  readonly selected: UserSummary | null;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly onSelect: (user: UserSummary) => void;
  readonly onClear: () => void;
}

type TutorDirectoryState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly users: readonly UserSummary[] }
  | { readonly status: "error"; readonly message: string };

const TRIGGER_CLASSES =
  "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-borde-input bg-superficie px-3 py-2 text-left text-base text-texto-principal focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario";

const SEARCH_CLASSES =
  "min-h-11 w-full rounded-lg border border-borde-input bg-superficie py-2 pl-10 pr-3 text-base text-texto-principal placeholder:text-placeholder focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus";

const SECONDARY_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2 text-sm font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus";

const EMPTY_USERS: readonly UserSummary[] = Object.freeze([]);

/** Selector de tutor con búsqueda en vivo y hasta cuatro coincidencias. */
export default function TutorSelector({
  selected,
  error,
  disabled = false,
  onSelect,
  onClear,
}: TutorSelectorProps) {
  const [directory, setDirectory] = useState<TutorDirectoryState>({
    status: "loading",
  });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const retry = (): void => {
    setDirectory({ status: "loading" });

    loadNotificationTutorsAction()
      .then((result) => {
        setDirectory(
          result.ok
            ? { status: "ready", users: result.users }
            : { status: "error", message: result.message },
        );
      })
      .catch(() => {
        setDirectory({
          status: "error",
          message: "No pudimos cargar los tutores. Intentá nuevamente.",
        });
      });
  };

  useEffect(() => {
    let active = true;

    loadNotificationTutorsAction()
      .then((result) => {
        if (!active) {
          return;
        }

        setDirectory(
          result.ok
            ? { status: "ready", users: result.users }
            : { status: "error", message: result.message },
        );
      })
      .catch(() => {
        if (active) {
          setDirectory({
            status: "error",
            message: "No pudimos cargar los tutores. Intentá nuevamente.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const users = directory.status === "ready" ? directory.users : EMPTY_USERS;
  const results = useMemo(
    () => limitSearchResults(filterTutorsByQuery(users, query)),
    [users, query],
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

  const selectTutor = (user: UserSummary): void => {
    onSelect(user);
    closeAndFocus();
  };

  if (directory.status === "loading") {
    return (
      <p role="status" className="text-sm text-texto-secundario">
        Cargando tutores…
      </p>
    );
  }

  if (directory.status === "error") {
    return (
      <div className="space-y-2">
        <p role="alert" className="text-sm font-medium text-estado-error-texto">
          {directory.message}
        </p>
        <button type="button" onClick={retry} className={SECONDARY_CLASSES}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div>
        <label
          htmlFor="notification-tutor-trigger"
          className="mb-1 block text-sm font-semibold text-texto-principal"
        >
          Tutor
        </label>

        <button
          ref={triggerRef}
          id="notification-tutor-trigger"
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls="notification-tutor-panel"
          onClick={() => {
            setOpen((current) => !current);
            setQuery("");
            setActiveIndex(0);
          }}
          className={TRIGGER_CLASSES}
        >
          <span className="min-w-0 break-words">
            {selected
              ? `${selected.lastname}, ${selected.name}`
              : "Seleccioná un tutor"}
          </span>
          <span aria-hidden="true" className="shrink-0 text-xs">
            {open ? "▴" : "▾"}
          </span>
        </button>
      </div>

      {open ? (
        <div
          id="notification-tutor-panel"
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
              aria-controls="notification-tutor-listbox"
              aria-autocomplete="list"
              aria-activedescendant={
                results.items[activeIndex]
                  ? `notification-tutor-option-${results.items[activeIndex].id}`
                  : undefined
              }
              aria-label="Buscar tutor"
              aria-describedby="notification-tutor-hint"
              placeholder="Buscá por nombre, apellido, DNI, CUIL o correo"
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
                  const user = results.items[activeIndex];

                  if (user) {
                    selectTutor(user);
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

          <p
            id="notification-tutor-hint"
            className="px-2 pt-1 text-xs text-texto-secundario"
          >
            Podés buscar por nombre, apellido, DNI, CUIL o correo.
          </p>

          {results.items.length === 0 ? (
            <p role="status" className="px-2 py-3 text-sm text-texto-secundario">
              No encontramos tutores con ese criterio.
            </p>
          ) : (
            <ul
              id="notification-tutor-listbox"
              role="listbox"
              aria-label="Tutores"
              className="mt-2 max-h-64 space-y-1 overflow-y-auto"
            >
              {results.items.map((user, index) => {
                const active = selected?.id === user.id;
                const highlighted = index === activeIndex;

                return (
                  <li key={user.id}>
                    <button
                      id={`notification-tutor-option-${user.id}`}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => {
                        setActiveIndex(index);
                      }}
                      onClick={() => {
                        selectTutor(user);
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        active
                          ? "border-azul-institucional bg-azul-suave font-semibold text-azul-institucional"
                          : highlighted
                            ? "border-borde-focus bg-fondo-app text-texto-principal"
                            : "border-transparent text-texto-principal hover:bg-fondo-app"
                      }`}
                    >
                      {buildTutorOptionLabel(user)}
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

      {selected ? (
        <div className="rounded-xl border border-azul-institucional/40 bg-azul-suave p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-secundario">
            Destinatario seleccionado
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-texto-principal">
            {selected.lastname}, {selected.name}
          </p>
          <p className="text-xs text-texto-secundario">
            {selected.dni ?? selected.email ?? NOTIFICATION_NO_CONTACT_LABEL}
          </p>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="mt-2 text-sm font-semibold text-azul-institucional underline underline-offset-2 disabled:text-texto-secundario"
          >
            Cambiar
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-medium text-estado-error-texto">
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
