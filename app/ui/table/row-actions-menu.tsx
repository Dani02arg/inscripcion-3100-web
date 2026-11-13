"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  computeMenuPosition,
  type MenuPosition,
} from "../../lib/ui/menu-position.ts";
import {
  getRowActionAccessibleLabel,
  type RowActionItem,
} from "../../lib/ui/row-actions.ts";

export interface RowActionsMenuProps {
  readonly triggerLabel: string;
  readonly menuLabel?: string;
  readonly items: readonly RowActionItem[];
  readonly triggerContent?: ReactNode;
  readonly triggerClassName?: string;
  readonly menuClassName?: string;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const TRIGGER_CLASSES =
  `inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-borde-input bg-superficie px-3 py-2 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`;

const ITEM_BASE_CLASSES =
  "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm text-texto-principal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-inset";

const ITEM_ENABLED_CLASSES = "hover:bg-fondo-app";

const ITEM_DISABLED_CLASSES = "cursor-not-allowed text-texto-secundario";

const MENU_CLASSES =
  "z-50 max-h-[calc(100vh-1rem)] w-56 overflow-y-auto rounded-xl border border-borde-input bg-superficie p-1 shadow-lg";

/**
 * Menú de acciones por fila reutilizable: disparador de tres puntos, portal,
 * posición fija, navegación por teclado y retorno de foco.
 */
export default function RowActionsMenu({
  triggerLabel,
  menuLabel,
  items,
  triggerContent,
  triggerClassName,
  menuClassName,
}: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      const trigger = triggerRef.current;
      const menu = menuRef.current;

      if (!trigger || !menu) {
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();

      setPosition(
        computeMenuPosition(
          {
            top: triggerRect.top,
            right: triggerRect.right,
            bottom: triggerRect.bottom,
            left: triggerRect.left,
            width: triggerRect.width,
            height: triggerRect.height,
          },
          { width: menuRect.width, height: menuRect.height },
          { width: window.innerWidth, height: window.innerHeight },
        ),
      );
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const menu = menuRef.current;
    const firstItem = menu?.querySelector<HTMLElement>('[role="menuitem"]');
    firstItem?.focus({ preventScroll: true });

    function closeAndFocus() {
      setOpen(false);
      triggerRef.current?.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAndFocus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (menu?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      closeAndFocus();
    }

    function handleFocusIn(event: FocusEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (menu?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      closeAndFocus();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [open]);

  const closeForAction = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const select = (item: RowActionItem) => {
    closeForAction();
    item.onSelect?.();
  };

  const handleMenuKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    const menu = menuRef.current;
    const menuItems = Array.from(
      menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const currentIndex = menuItems.indexOf(
      document.activeElement as HTMLElement,
    );
    const baseIndex = currentIndex >= 0 ? currentIndex : 0;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = menuItems[(baseIndex + 1) % menuItems.length];
      next?.focus();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const previous =
        menuItems[(baseIndex - 1 + menuItems.length) % menuItems.length];
      previous?.focus();
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      menuItems[0]?.focus();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      menuItems[menuItems.length - 1]?.focus();
    }
  };

  const label = menuLabel ?? triggerLabel;

  return (
    <div className="inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={triggerLabel}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }

          setPosition(null);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setPosition(null);
            setOpen(true);
          }
        }}
        className={triggerClassName ?? TRIGGER_CLASSES}
      >
        {triggerContent ?? <span aria-hidden="true">⋯</span>}
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={label}
              onKeyDown={handleMenuKeyDown}
              style={{
                position: "fixed",
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                opacity: position ? 1 : 0,
                pointerEvents: position ? "auto" : "none",
              }}
              className={menuClassName ?? MENU_CLASSES}
            >
              {items.map((item) => {
                const disabled = item.disabled ?? false;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    aria-disabled={disabled ? true : undefined}
                    aria-label={getRowActionAccessibleLabel(item)}
                    title={disabled ? item.disabledReason : undefined}
                    onClick={
                      disabled ? undefined : () => select(item)
                    }
                    className={`${ITEM_BASE_CLASSES} ${
                      disabled
                        ? ITEM_DISABLED_CLASSES
                        : ITEM_ENABLED_CLASSES
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full border border-borde-input bg-fondo-app px-2 py-0.5 text-sm font-medium text-texto-principal">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
