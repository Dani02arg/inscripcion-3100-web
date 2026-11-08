/** Esqueleto accesible del detalle, sin datos ficticios. */
export default function UserDetailSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Cargando detalle del usuario"
      className="space-y-6"
    >
      <span className="sr-only">Cargando el detalle del usuario.</span>

      <div aria-hidden="true" className="space-y-3">
        <div className="h-4 w-44 animate-pulse rounded bg-superficie motion-reduce:animate-none" />
        <div className="h-8 w-64 max-w-full animate-pulse rounded bg-superficie motion-reduce:animate-none" />
        <div className="h-5 w-56 max-w-full animate-pulse rounded bg-superficie motion-reduce:animate-none" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <section
            key={index}
            className="space-y-4 rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
          >
            <div className="h-6 w-48 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 3 }, (_, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
                  <div className="h-5 w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
