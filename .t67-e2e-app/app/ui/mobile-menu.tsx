"use client";

import { useState } from "react";
import Link from "next/link";

export function MobileMenuToggle() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-borde-input focus:outline-none focus:ring-2 focus:ring-borde-focus"
        aria-label="Abrir menú de navegación"
        aria-expanded={isOpen}
      >
        <svg
          className="h-6 w-6 text-texto-secundario"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-superficie rounded-xl shadow-lg py-4 z-50 border border-borde-input">
          <div className="space-y-1">
            <Link
              href="/login"
              className="block py-3 px-4 text-sm text-texto-principal hover:bg-borde-input rounded-lg transition-colors"
              aria-label="Iniciar sesión"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="block py-3 px-4 text-sm text-texto-principal hover:bg-borde-input rounded-lg transition-colors"
              aria-label="Registrarse"
            >
              Registrarse
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
