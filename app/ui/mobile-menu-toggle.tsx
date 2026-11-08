"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function MobileMenuToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      const container = menuRef.current;
      if (target instanceof Node && container && !container.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="contents">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg p-2 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-fondo-app focus-visible:ring-offset-2 focus-visible:ring-offset-azul-institucional"
        aria-label="Abrir menú de navegación"
        aria-expanded={isOpen}
      >
        <img
          src="/icons/ico-burger-menu.svg"
          alt="Menú hamburguesa"
          aria-label="Icono de menú hamburguesa"
          className="h-6 w-6 brightness-0 invert"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-superficie rounded-xl shadow-lg py-4 z-50 border border-borde-input">
          <div className="space-y-1">
            <Link
              href="/login"
              className="block rounded-lg px-4 py-3 text-sm text-texto-principal transition-colors hover:bg-borde-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2"
              aria-label="Iniciar sesión"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="block rounded-lg px-4 py-3 text-sm text-texto-principal transition-colors hover:bg-borde-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2"
              aria-label="Registrarse"
            >
              Registrarse
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
