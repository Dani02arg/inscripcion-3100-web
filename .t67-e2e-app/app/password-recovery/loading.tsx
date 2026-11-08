import Navbar from "../ui/navbar";

export default function PasswordRecoveryLoading() {
  return (
    <main className="min-h-screen bg-fondo-app text-texto-principal">
      <Navbar />

      <div className="mx-auto w-full max-w-4xl px-3 pb-16 pt-28 sm:px-6">
        <section
          aria-busy="true"
          aria-live="polite"
          className="mx-auto w-[97%] rounded-2xl border border-borde-input bg-superficie p-3 shadow-sm sm:p-6 md:w-[95%] lg:p-8"
        >
          <p className="sr-only">Cargando la recuperación de contraseña.</p>

          <div className="h-8 w-64 max-w-full animate-pulse rounded bg-fondo-app" />
          <div className="mt-3 h-4 w-full max-w-lg animate-pulse rounded bg-fondo-app" />
          <div className="mt-8 space-y-5">
            <div className="h-16 w-full animate-pulse rounded-lg bg-fondo-app" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-fondo-app" />
          </div>
        </section>
      </div>
    </main>
  );
}
