/** Esqueleto accesible del detalle de alumno, sin datos ficticios. */
export function StudentDetailSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Cargando el detalle del alumno.</span>

      <div aria-hidden="true" className="space-y-3">
        <div className="h-4 w-48 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
        <div className="h-8 w-64 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
        <div className="h-5 w-40 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
      </div>

      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
        >
          <div className="h-5 w-40 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, itemIndex) => (
              <div
                key={itemIndex}
                className="space-y-2 rounded-xl border border-borde-input bg-fondo-app px-3 py-2"
              >
                <div className="h-3 w-24 animate-pulse rounded bg-superficie motion-reduce:animate-none" />
                <div className="h-4 w-32 animate-pulse rounded bg-superficie motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Esqueleto accesible del formulario de alumno, sin datos ficticios. */
export function StudentFormSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Cargando el formulario de alumno.</span>

      <div aria-hidden="true" className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
        <div className="h-8 w-56 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
        <div className="h-5 w-72 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
      </div>

      <div
        aria-hidden="true"
        className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 10 }, (_, index) => (
            <div
              key={index}
              className={`space-y-2 ${index === 4 ? "sm:col-span-2" : ""}`}
            >
              <div className="h-4 w-28 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-fondo-app motion-reduce:animate-none" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <div className="h-11 w-28 animate-pulse rounded-xl bg-fondo-app motion-reduce:animate-none" />
          <div className="h-11 w-36 animate-pulse rounded-xl bg-fondo-app motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
