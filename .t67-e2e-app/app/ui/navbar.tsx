import Link from "next/link";
import IconLink from "./icon-link";
import { MobileMenuToggle } from "./mobile-menu-toggle";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-azul-institucional text-fondo-app">
      <div className="mx-auto w-[85%] px-2 py-2 md:w-[70%] md:px-6 md:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo institucional a la izquierda (móvil y escritorio) */}
          <Link
            href="/home"
            className="flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fondo-app focus-visible:ring-offset-2 focus-visible:ring-offset-azul-institucional"
          >
            <img
              src="/logo.png"
              alt="Logo EET 3100"
              className="h-8 w-auto object-contain md:h-10"
            />
          </Link>

          {/* Links en desktop (ocultos en móvil) */}
          <div className="hidden md:flex items-center gap-6">
            <IconLink
              href="/login"
              icono="ico-login"
              texto="Iniciar Sesión"
              className="rounded-sm text-sm font-medium text-fondo-app hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fondo-app focus-visible:ring-offset-2 focus-visible:ring-offset-azul-institucional"
              iconClassName="brightness-0 invert"
            />
            <IconLink
              href="/register"
              icono="ico-register"
              texto="Registrarse"
              className="rounded-sm text-sm font-medium text-fondo-app hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fondo-app focus-visible:ring-offset-2 focus-visible:ring-offset-azul-institucional"
              iconClassName="brightness-0 invert"
            />
          </div>

          {/* Menú hamburguesa en móvil (visible solo en móvil) */}
          <div className="flex items-center md:hidden">
            <MobileMenuToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}