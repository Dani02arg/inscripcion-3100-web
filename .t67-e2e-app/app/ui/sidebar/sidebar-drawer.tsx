"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";

interface SidebarDrawerProps {
  id: string;
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Drawer modal con `dialog` nativo: foco contenido, fondo inerte,
 * cierre con Escape o clic en el fondo y scroll del interior.
 */
export default function SidebarDrawer({
  id,
  open,
  onClose,
  triggerRef,
  header,
  children,
  footer,
}: SidebarDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }

      const target =
        dialog.querySelector<HTMLElement>("[data-drawer-close]") ??
        dialog.querySelector<HTMLElement>("button, a, [tabindex]");

      target?.focus();
      return;
    }

    if (dialog.open) {
      dialog.close();
      triggerRef.current?.focus();
    }
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!dialog.contains(active)) {
        event.preventDefault();
        first?.focus();
        return;
      }

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

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label="Menú principal"
      data-drawer-open={open ? "true" : "false"}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-y-0 left-0 z-50 m-0 h-dvh max-h-none w-80 max-w-[85vw] overflow-hidden border-0 bg-superficie p-0 text-texto-principal shadow-xl backdrop:bg-black/50"
    >
      <div className="flex h-full flex-col">
        <div className="shrink-0">{header}</div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <div className="shrink-0">{footer}</div>
      </div>
    </dialog>
  );
}
