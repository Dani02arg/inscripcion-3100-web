/** Esqueleto accesible del perfil, sin datos personales ficticios. */
export default function ProfileSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Cargando tu perfil"
      className="space-y-6"
    >
      <span className="sr-only">Cargando tu perfil.</span>

      <div aria-hidden="true" className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-superficie motion-reduce:animate-none" />
        <div className="h-5 w-64 max-w-full animate-pulse rounded bg-superficie motion-reduce:animate-none" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <section
            key={index}
            className="space-y-4 rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
          >
            <div className="h-6 w-40 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
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
