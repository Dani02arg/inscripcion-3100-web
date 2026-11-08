import type { Metadata } from "next";

import LoginForm from "../ui/auth/login-form";
import Footer from "../ui/footer";
import Navbar from "../ui/navbar";
import { SESSION_EXPIRED_MESSAGE } from "../lib/auth/types.ts";

export const metadata: Metadata = {
  title: "Iniciar sesión | EET N° 3100",
  description:
    "Ingresá con tu email y contraseña para acceder a los servicios de la EET N° 3100.",
};

interface LoginPageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { reason } = await searchParams;
  const sessionExpired = reason === "session-expired";

  return (
    <>
      <main className="min-h-screen bg-fondo-app text-texto-principal">
        <Navbar />

      <div className="mx-auto w-full max-w-4xl px-3 pb-16 pt-28 sm:px-6">
        <section className="mx-auto w-[97%] rounded-2xl border border-borde-input bg-superficie p-3 shadow-sm sm:p-6 md:w-[95%] lg:p-8">
          <h1 className="text-2xl font-bold text-texto-principal">
            Iniciar sesión
          </h1>
          <p className="mt-2 text-base text-texto-principal">
            Ingresá con tu email y contraseña para acceder a la EET N° 3100.
          </p>

          {sessionExpired ? (
            <p
              role="status"
              className="mt-4 rounded-lg border border-borde-input bg-fondo-app p-3 text-sm text-texto-principal"
            >
              {SESSION_EXPIRED_MESSAGE}
            </p>
          ) : null}

          <div className="mt-6">
            <LoginForm />
          </div>
        </section>
      </div>
      </main>
      <Footer />
    </>
  );
}
