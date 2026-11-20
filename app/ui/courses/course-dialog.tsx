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
  closeOnBackdrop?: boolean;
  wide?: boolean;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function CourseDialog({
  open,
  id,
  title,
  children,
  onClose,
  closeDisabled = false,
  describedBy,
  closeOnBackdrop = false,
  wide = false,
}: CourseDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const backdropPressRef = useRef(false);
  const titleId = `${id}-title`;

  const dialogWidthClass = wide
    ? "w-[min(95vw,56rem)]"
    : "w-[min(95vw,44rem)]";

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
      onPointerDown={(event) => {
        backdropPressRef.current = event.target === dialogRef.current;
      }}
      onPointerUp={(event) => {
        const startedOnBackdrop = backdropPressRef.current;
        backdropPressRef.current = false;

        if (
          closeOnBackdrop &&
          !closeDisabled &&
          startedOnBackdrop &&
          event.target === dialogRef.current
        ) {
          onClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();

        if (!closeDisabled) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
      className={`
        m-auto
        ${dialogWidthClass}
        max-h-[calc(100vh-1.5rem)]
        overflow-y-auto
        rounded-2xl
        border border-slate-200
        bg-white
        p-0
        text-slate-800
        shadow-2xl
        backdrop:bg-slate-950/40
        backdrop:backdrop-blur-[2px]
      `}
    >
      {/* Encabezado compacto */}
      <div className="
        sticky top-0 z-20
        flex items-center justify-between gap-3
        border-b border-slate-200
        bg-white
        px-5 py-3
      ">
        <h2
          id={titleId}
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          {title}
        </h2>

        <button
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          aria-label="Cerrar diálogo"
          className="
            inline-flex h-8 w-8 shrink-0
            items-center justify-center
            rounded-lg
            text-lg text-slate-500
            transition-colors
            hover:bg-slate-100 hover:text-slate-900
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-blue-700
            focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-40
          "
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      {/* Contenido con padding vertical más ajustado */}
      <div className="px-5 py-3.5 sm:px-6 sm:py-4">
        {children}
      </div>
    </dialog>
  );
}