"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { fetchRegistrationFormAction } from "../../lib/actions/registrations.ts";

interface PdfModalProps {
  open: boolean;
  registrationId: string;
  onClose: () => void;
}

type PdfState =
  | { status: "loading" }
  | { status: "ready"; url: string; filename: string }
  | { status: "error"; message: string };

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie";

const BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`;

function base64ToBlob(base64: string, contentType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: contentType });
}

/** Modal del formulario en PDF con previsualización, descarga e impresión. */
export default function PdfModal({
  open,
  registrationId,
  onClose,
}: PdfModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<PdfState>({ status: "loading" });
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    setState({ status: "loading" });
  }

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

    const focusable = dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    focusable?.focus();

    return () => {
      if (dialog.open) {
        dialog.close();
      }

      triggerRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    fetchRegistrationFormAction(registrationId)
      .then((result) => {
        if (cancelled) {
          return;
        }

        if (!result.ok) {
          setState({ status: "error", message: result.message });
          return;
        }

        const blob = base64ToBlob(result.base64, result.contentType);
        objectUrl = URL.createObjectURL(blob);
        setState({
          status: "ready",
          url: objectUrl,
          filename: result.filename,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            status: "error",
            message: "No se pudo cargar el formulario.",
          });
        }
      });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [open, registrationId]);

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

  function handleDownload() {
    if (state.status !== "ready") {
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = state.url;
    anchor.download = state.filename || "formulario-inscripcion.pdf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function handlePrint() {
    iframeRef.current?.contentWindow?.print();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-label="Formulario de inscripción en PDF"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={handleKeyDown}
      className="m-auto w-[min(95vw,56rem)] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-borde-input bg-superficie p-0 text-texto-principal shadow-lg"
    >
      <div className="flex items-center justify-between gap-3 border-b border-borde-input px-4 py-3">
        <h2 className="text-lg font-bold text-texto-principal">
          Formulario de inscripción
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar diálogo"
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xl font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="p-4">
        {state.status === "loading" ? (
          <div className="flex h-80 items-center justify-center text-base text-texto-principal">
            Cargando formulario…
          </div>
        ) : state.status === "error" ? (
          <div className="flex h-80 items-center justify-center px-6 text-center text-base text-texto-principal">
            {state.message}
          </div>
        ) : (
          <>
            <iframe
              ref={iframeRef}
              title="Formulario de inscripción en PDF"
              src={state.url}
              className="h-[60vh] w-full rounded-lg border border-borde-input bg-fondo-app"
            />

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className={BUTTON_CLASSES}
              >
                Descargar
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className={BUTTON_CLASSES}
              >
                Imprimir
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
