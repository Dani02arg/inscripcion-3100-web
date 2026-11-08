import SidebarSkeleton from "../ui/sidebar/sidebar-skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-fondo-app text-texto-principal">
      <SidebarSkeleton />

      <div className="min-w-0 flex-1 pb-16 pt-14 lg:pt-0">
        <main className="mx-auto w-full max-w-4xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
          <section
            aria-busy="true"
            aria-live="polite"
            className="mx-auto w-[97%] rounded-2xl border border-borde-input bg-superficie p-3 shadow-sm sm:p-6 md:w-[95%] lg:p-8"
          >
            <p className="sr-only">Cargando el panel principal.</p>

            <div className="h-8 w-48 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
            <div className="mt-6 h-9 w-64 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
            <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
            <div className="mt-6 space-y-3">
              <div className="h-4 w-40 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
              <div className="h-4 w-40 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
