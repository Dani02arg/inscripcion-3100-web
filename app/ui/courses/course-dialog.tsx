"use client";

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

interface CourseDialogProps {
  open: boolean;
  id: string;
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  describedBy?: string;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Diálogo nativo reutilizable con foco atrapado y retorno al disparador. */
export default function CourseDialog({
  open,
  id,
  title,
  children,
  onClose,
  closeDisabled = false,
  describedBy,
}: CourseDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = `${id}-title`;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || !open) {
      return;
    }

    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (!dialog.open) {
      dialog.showModal();
    }

    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((element) => element.offsetParent !== null);
    const preferred =
      dialog.querySelector<HTMLElement>("[data-autofocus]") ??
      focusables[0] ??
      dialog;

    preferred.focus();

    return () => {
      if (dialog.open) {
        dialog.close();
      }

      triggerRef.current?.focus();
    };
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
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
    <dialog
      ref={dialogRef}
      id={id}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      onCancel={(event) => {
        event.preventDefault();

        if (!closeDisabled) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
      className="m-auto w-[min(92vw,36rem)] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-borde-input bg-superficie p-0 text-texto-principal shadow-lg"
    >
      <div className="flex items-center justify-between gap-3 border-b border-borde-input px-4 py-3">
        <h2 id={titleId} className="text-lg font-bold text-texto-principal">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          aria-label="Cerrar diálogo"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xl font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie disabled:cursor-not-allowed disabled:text-texto-secundario"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="p-4">{children}</div>
    </dialog>
  );
}
