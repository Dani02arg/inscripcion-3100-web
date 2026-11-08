import type { Metadata } from "next";

import ResetPasswordForm from "../../ui/auth/reset-password-form";
import Footer from "../../ui/footer";
import Navbar from "../../ui/navbar";

export const metadata: Metadata = {
  title: "Cambiar contraseña | EET N° 3100",
  description:
    "Ingresá el código de recuperación y definí una nueva contraseña para tu cuenta de la EET N° 3100.",
  openGraph: {
    title: "Cambiar contraseña | EET N° 3100",
    description:
      "Ingresá el código de recuperación y definí una nueva contraseña para tu cuenta de la EET N° 3100.",
    type: "website",
  },
};

export default function ResetPasswordPage() {
  return (
    <>
      <main className="min-h-screen bg-fondo-app text-texto-principal">
        <Navbar />

      <div className="mx-auto w-full max-w-4xl px-3 pb-16 pt-28 sm:px-6">
        <section className="mx-auto w-[97%] rounded-2xl border border-borde-input bg-superficie p-3 shadow-sm sm:p-6 md:w-[95%] lg:p-8">
          <h1 className="text-2xl font-bold text-texto-principal">
            Cambiar contraseña
          </h1>
          <p className="mt-2 text-base text-texto-principal">
            Ingresá el código que enviamos a tu correo y definí una nueva
            contraseña.
          </p>

          <div className="mt-6">
            <ResetPasswordForm />
          </div>
        </section>
      </div>
      </main>
      <Footer />
    </>
  );
}
