import type { Metadata } from "next";
import Link from "next/link";

import { maskEmail } from "../lib/verification/mask-email.ts";
import { readPendingRegistration } from "../lib/verification/pending.ts";
import VerifyEmailForm from "../ui/auth/verify-email-form";
import Footer from "../ui/footer";
import Navbar from "../ui/navbar";

export const metadata: Metadata = {
  title: "Verificar correo | EET N° 3100",
  description:
    "Ingresá el código de 5 dígitos enviado a tu correo para completar el registro en la EET N° 3100.",
};

export default async function VerifyEmailPage() {
  const pending = await readPendingRegistration();
  const maskedEmail = pending ? maskEmail(pending.email) : "";

  return (
    <>
      <main className="min-h-screen bg-fondo-app text-texto-principal">
        <Navbar />

      <div className="mx-auto w-full max-w-4xl px-3 pb-16 pt-28 sm:px-6">
        <section className="mx-auto w-[97%] rounded-2xl border border-borde-input bg-superficie p-3 shadow-sm sm:p-6 md:w-[95%] lg:p-8">
          <h1 className="text-2xl font-bold text-texto-principal">
            Verificá tu correo
          </h1>

          {pending ? (
            <>
              <p className="mt-2 text-base text-texto-principal">
                Ingresá el código de 5 dígitos que enviamos a{" "}
                <span className="font-semibold">{maskedEmail}</span>.
              </p>

              <div className="mt-6">
                <VerifyEmailForm
                  resendAvailableAt={pending.resendAvailableAt}
                />
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-base text-texto-principal">
                No hay una verificación pendiente. Para recibir un código,
                completá el registro con tus datos.
              </p>

              <Link
                href="/register"
                className="mt-6 inline-flex rounded-xl bg-azul-institucional px-6 py-3 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
              >
                Ir al registro
              </Link>
            </>
          )}
        </section>
      </div>
      </main>
      <Footer />
    </>
  );
}
