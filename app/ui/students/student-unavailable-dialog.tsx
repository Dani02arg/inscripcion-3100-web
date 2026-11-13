"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

import { STUDENT_DELETE_UNAVAILABLE } from "../../lib/students/labels.ts";

interface StudentUnavailableDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Diálogo informativo de baja no disponible, sin solicitudes ni cambios. */
export default function StudentUnavailableDialog({
  open,
  onClose,
}: StudentUnavailableDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const dialog = dialogRef.current;
    const focusables =
      dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const first = focusables?.[0] ?? dialog;
    first?.focus();

    function handleFocusIn(event: FocusEvent) {
      if (!dialog || !(event.target instanceof Node)) {
        return;
      }
      if (dialog.contains(event.target)) {
        return;
      }
      const elements = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      (elements[0] ?? dialog).focus();
    }

    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.current;
    const focusables = Array.from(
      dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
    );

    if (focusables.length === 0) {
      event.preventDefault();
      dialog?.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last?.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-texto-principal/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-delete-unavailable-title"
        aria-describedby="student-delete-unavailable-desc"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative z-10 w-full max-w-md rounded-2xl border border-borde-input bg-superficie p-6 shadow-lg"
      >
        <h2
          id="student-delete-unavailable-title"
          className="text-xl font-bold text-texto-principal"
        >
          {STUDENT_DELETE_UNAVAILABLE.title}
        </h2>
        <p
          id="student-delete-unavailable-desc"
          className="mt-2 text-base text-texto-principal"
        >
          {STUDENT_DELETE_UNAVAILABLE.message}
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie"
          >
            {STUDENT_DELETE_UNAVAILABLE.action}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
