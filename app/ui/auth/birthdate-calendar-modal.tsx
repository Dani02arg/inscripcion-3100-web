"use client";

import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";

import {
  getCalendarDisabledMatcher,
  getMaxBirthdate,
  MIN_REGISTER_AGE,
} from "../../lib/validation/register.ts";

type CalendarStyle = CSSProperties & {
  "--rdp-day-width": string;
  "--rdp-day-height": string;
  "--rdp-day_button-width": string;
  "--rdp-day_button-height": string;
};

const CALENDAR_STYLE: CalendarStyle = {
  "--rdp-day-width": "clamp(2.25rem, 7vw, 2.75rem)",
  "--rdp-day-height": "clamp(2.25rem, 7vw, 2.75rem)",
  "--rdp-day_button-width": "clamp(2.25rem, 7vw, 2.75rem)",
  "--rdp-day_button-height": "clamp(2.25rem, 7vw, 2.75rem)",
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L8.94 10l-4.72 4.72a.75.75 0 1 0 1.06 1.06L10 11.06l4.72 4.72a.75.75 0 1 0 1.06-1.06L11.06 10l4.72-4.72a.75.75 0 1 0-1.06-1.06L10 8.94 5.28 4.22Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export interface BirthdateCalendarModalProps {
  open: boolean;
  id: string;
  selected?: Date;
  now: Date;
  minimumAge?: number;
  title?: string;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

export default function BirthdateCalendarModal({
  open,
  id,
  selected,
  now,
  minimumAge = MIN_REGISTER_AGE,
  title = "Seleccioná tu fecha de nacimiento",
  onSelect,
  onClose,
}: BirthdateCalendarModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const maxBirthdate = getMaxBirthdate(now, minimumAge);
  const disabledMatcher = getCalendarDisabledMatcher(now, minimumAge);
  const startMonth = new Date(1900, 0, 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  useEffect(() => {
    if (!open) {
      return;
    }

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusables =
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const first = focusables?.[0] ?? dialogRef.current;
    first?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusables = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ??
        [],
    ).filter((element) => element.offsetParent !== null);

    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        onKeyDown={handleKeyDown}
        className="max-h-[calc(100vh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-borde-input bg-superficie p-4 shadow-lg"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2
            id={`${id}-title`}
            className="text-base font-semibold text-texto-principal"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar calendario"
            className="rounded-md p-1.5 text-texto-principal transition-colors hover:bg-fondo-app focus:outline-none focus:ring-2 focus:ring-borde-focus"
          >
            <CloseIcon />
          </button>
        </div>

        <DayPicker
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onSelect(date);
            }
          }}
          locale={es}
          disabled={disabledMatcher}
          defaultMonth={selected ?? maxBirthdate}
          startMonth={startMonth}
          endMonth={endMonth}
          captionLayout="dropdown"
          navLayout="after"
          showOutsideDays={false}
          className="mx-auto max-w-full text-texto-principal"
          style={CALENDAR_STYLE}
        />
      </div>
    </div>
  );
}
