"use client";

/** Esqueleto accesible del listado sin filas ficticias. */
export default function RegistrationSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="space-y-4 motion-reduce:animate-none"
    >
      <span className="sr-only">Cargando inscripciones…</span>

      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-borde-input bg-superficie p-4"
        >
          <div className="h-5 w-2/3 rounded bg-fondo-app" />
          <div className="mt-2 h-4 w-1/2 rounded bg-fondo-app" />
          <div className="mt-2 h-4 w-1/3 rounded bg-fondo-app" />
        </div>
      ))}
    </div>
  );
}
