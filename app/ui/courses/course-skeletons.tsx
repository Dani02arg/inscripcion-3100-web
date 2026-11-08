const HEADER_CELLS = [
  "Código",
  "Año académico",
  "Año de cursada",
  "División",
  "Ciclo",
  "Especialidad",
  "Turno",
  "Estado",
  "Acciones",
];

/** Esqueleto accesible del listado, sin datos ficticios. */
export function CourseDetailSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Cargando el detalle del curso.</span>

      <div aria-hidden="true" className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
        <div className="h-8 w-64 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
        <div className="h-5 w-48 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
      </div>

      <div
        aria-hidden="true"
        className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 11 }, (_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl bg-fondo-app motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="space-y-3 rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm"
      >
        <div className="h-6 w-48 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
        <div className="h-4 w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
        <div className="h-20 w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export function CourseFormSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Cargando el formulario de curso.</span>

      <div aria-hidden="true" className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
        <div className="h-8 w-56 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
        <div className="h-5 w-44 max-w-full animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
      </div>

      <div
        aria-hidden="true"
        className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-fondo-app motion-reduce:animate-none" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <div className="h-11 w-28 animate-pulse rounded-xl bg-fondo-app motion-reduce:animate-none" />
          <div className="h-11 w-32 animate-pulse rounded-xl bg-fondo-app motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}

export default function CourseTableSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Cargando cursos"
      className="overflow-x-auto rounded-2xl border border-borde-input bg-superficie shadow-sm"
    >
      <span className="sr-only">Cargando cursos.</span>
      <table className="min-w-full border-collapse" aria-hidden="true">
        <thead>
          <tr>
            {HEADER_CELLS.map((label) => (
              <th
                key={label}
                scope="col"
                className="whitespace-nowrap border-b border-borde-input bg-fondo-app px-3 py-2 text-left text-sm font-semibold text-texto-principal"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {HEADER_CELLS.map((label) => (
                <td
                  key={`${label}-${rowIndex}`}
                  className="border-b border-borde-input px-3 py-3"
                >
                  <div className="h-5 w-20 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
