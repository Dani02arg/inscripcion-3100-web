"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  formatDateInput,
  formatDisplayDate,
  fromIsoDate,
  getBirthdateError,
  parseDisplayDate,
  toIsoDate,
} from "../../lib/validation/register.ts";
import BirthdateCalendarModal from "./birthdate-calendar-modal";
import TextField from "./text-field";

const UNDERAGE_MESSAGE = "Debés tener al menos 18 años.";

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-2.25 5.5v7.75c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V7.5H3.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export interface BirthdatePickerProps {
  id: string;
  name?: string;
  value: string;
  onChange: (isoDate: string) => void;
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  className?: string;
}

export default function BirthdatePicker({
  id,
  name = "birthdate",
  value,
  onChange,
  label = "Fecha de nacimiento",
  error,
  helpText,
  required = false,
  className = "",
}: BirthdatePickerProps) {
  const now = useMemo(() => new Date(), []);
  const [text, setText] = useState(() => formatDisplayDate(value));
  const [open, setOpen] = useState(false);
  const lastEmitted = useRef(value);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const modalId = `${id}-calendar-modal`;

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setText(formatDisplayDate(value));
      lastEmitted.current = value;
    }
  }, [value]);

  const selectedDate = fromIsoDate(value) ?? undefined;
  const birthdateError = getBirthdateError(value, now);
  const ageError = birthdateError === "underage" ? UNDERAGE_MESSAGE : "";
  const visibleError = error || ageError;

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    const masked = formatDateInput(event.target.value);
    const iso = parseDisplayDate(masked);
    lastEmitted.current = iso;
    setText(masked);
    onChange(iso);
  }

  function handleSelect(date: Date) {
    const iso = toIsoDate(date);
    lastEmitted.current = iso;
    setText(formatDisplayDate(iso));
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleClose() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className={className}>
      <TextField
        id={id}
        label={label}
        value={text}
        onChange={handleTextChange}
        placeholder="DD/MM/YYYY"
        inputMode="numeric"
        maxLength={10}
        required={required}
        helpText={helpText}
        error={visibleError}
        autoComplete="off"
        trailing={
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={modalId}
            aria-label="Abrir calendario"
            className="rounded-md p-1.5 text-azul-institucional transition-colors hover:bg-fondo-app focus:outline-none focus:ring-2 focus:ring-borde-focus"
          >
            <CalendarIcon />
          </button>
        }
      />

      <input type="hidden" name={name} value={value} />

      <BirthdateCalendarModal
        open={open}
        id={modalId}
        selected={selectedDate}
        now={now}
        onSelect={handleSelect}
        onClose={handleClose}
      />
    </div>
  );
}
