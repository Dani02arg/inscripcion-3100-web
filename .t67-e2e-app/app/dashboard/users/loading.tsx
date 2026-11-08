import SidebarSkeleton from "../../ui/sidebar/sidebar-skeleton.tsx";

const HEADER_CELLS = [
  "Usuario",
  "DNI",
  "Correo",
  "Rol",
  "Acciones",
];

/** Esqueleto accesible del padrón de usuarios, sin filas ni datos ficticios. */
export default function UsersLoading() {
  return (
    <div className="flex min-h-screen bg-fondo-app text-texto-principal">
      <SidebarSkeleton />

      <div className="min-w-0 flex-1 pb-16 pt-14 lg:pt-0">
        <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
          <div
            role="status"
            aria-busy="true"
            aria-live="polite"
            aria-label="Cargando padrón de usuarios"
            className="mx-auto w-[97%] space-y-6 md:w-[95%]"
          >
            <span className="sr-only">
              Cargando el padrón de usuarios.
            </span>

            <div aria-hidden="true" className="space-y-3">
              <div className="h-4 w-44 animate-pulse rounded bg-superficie motion-reduce:animate-none" />
              <div className="h-8 w-64 max-w-full animate-pulse rounded bg-superficie motion-reduce:animate-none" />
              <div className="h-5 w-80 max-w-full animate-pulse rounded bg-superficie motion-reduce:animate-none" />
            </div>

            <div
              aria-hidden="true"
              className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
                    <div className="h-11 w-full animate-pulse rounded-lg bg-fondo-app motion-reduce:animate-none" />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <div className="h-11 w-32 animate-pulse rounded-xl bg-fondo-app motion-reduce:animate-none" />
                <div className="h-11 w-32 animate-pulse rounded-xl bg-fondo-app motion-reduce:animate-none" />
              </div>
            </div>

            <div
              aria-hidden="true"
              className="overflow-x-auto rounded-2xl border border-borde-input bg-superficie shadow-sm"
            >
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    {HEADER_CELLS.map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="whitespace-nowrap border-b border-borde-input bg-fondo-app px-4 py-3 text-left text-sm font-semibold text-texto-principal"
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
                          className="border-b border-borde-input px-4 py-3"
                        >
                          <div className="h-5 w-24 animate-pulse rounded bg-fondo-app motion-reduce:animate-none" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
