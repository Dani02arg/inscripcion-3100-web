import type { Metadata } from "next";

import RegisterForm from "../ui/auth/register-form";
import Footer from "../ui/footer";
import Navbar from "../ui/navbar";

export const metadata: Metadata = {
  title: "Registrarse | EET N° 3100",
  description:
    "Creá tu cuenta en la EET N° 3100 para acceder a los servicios institucionales.",
};

export default function RegisterPage() {
  return (
    <>
      <main className="min-h-screen bg-fondo-app text-texto-principal">
        <Navbar />

      <div className="mx-auto w-full max-w-4xl px-3 pb-16 pt-28 sm:px-6">
        <section className="mx-auto w-[97%] rounded-2xl border border-borde-input bg-superficie p-3 shadow-sm sm:p-6 md:w-[95%] lg:p-8">
          <h1 className="text-2xl font-bold text-texto-principal">
            Crear cuenta
          </h1>
          <p className="mt-2 text-base text-texto-principal">
            Completá tus datos para registrarte en la EET N° 3100.
          </p>

          <div className="mt-6">
            <RegisterForm />
          </div>
        </section>
      </div>
      </main>
      <Footer />
    </>
  );
}
