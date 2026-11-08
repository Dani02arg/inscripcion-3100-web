import type { Metadata } from "next";

import RequestRecoveryForm from "../ui/auth/request-recovery-form";
import Footer from "../ui/footer";
import Navbar from "../ui/navbar";
import { shouldRestoreSavedRecoveryRequest } from "../lib/recovery/request-value.ts";

export const metadata: Metadata = {
  title: "Recuperar contraseña | EET N° 3100",
  description:
    "Solicitá un código para restablecer la contraseña de tu cuenta de la EET N° 3100.",
  openGraph: {
    title: "Recuperar contraseña | EET N° 3100",
    description:
      "Solicitá un código para restablecer la contraseña de tu cuenta de la EET N° 3100.",
    type: "website",
  },
};

export default async function PasswordRecoveryPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    readonly source?: string | string[];
  }>;
}) {
  const { source } = await searchParams;
  const restoreSavedRequest = shouldRestoreSavedRecoveryRequest(source);

  return (
    <>
      <main className="min-h-screen bg-fondo-app text-texto-principal">
        <Navbar />

      <div className="mx-auto w-full max-w-4xl px-3 pb-16 pt-28 sm:px-6">
        <section className="mx-auto w-[97%] rounded-2xl border border-borde-input bg-superficie p-3 shadow-sm sm:p-6 md:w-[95%] lg:p-8">
          <h1 className="text-2xl font-bold text-texto-principal">
            Recuperar contraseña
          </h1>
          <p className="mt-2 text-base text-texto-principal">
            Ingresá tu correo electrónico y te enviaremos un código para
            restablecer tu contraseña.
          </p>

          <div className="mt-6">
            <RequestRecoveryForm restoreSavedRequest={restoreSavedRequest} />
          </div>
        </section>
      </div>
      </main>
      <Footer />
    </>
  );
}
