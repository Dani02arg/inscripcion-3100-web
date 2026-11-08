/** Esqueleto accesible del menú y de la barra compacta durante la carga. */
export default function SidebarSkeleton() {
  const pulse = "animate-pulse rounded bg-fondo-app motion-reduce:animate-none";

  return (
    <>
      <aside
        aria-hidden="true"
        style={{ width: 280 }}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-borde-input bg-superficie lg:flex"
      >
        <div className="flex items-center gap-3 border-b border-borde-input px-3 py-4">
          <div className={`h-8 w-8 shrink-0 ${pulse}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-3 w-4/5 ${pulse}`} />
            <div className={`h-3 w-3/5 ${pulse}`} />
          </div>
        </div>

        <div className="flex-1 space-y-3 px-2 py-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 px-3 py-2">
              <div className={`h-6 w-6 shrink-0 ${pulse}`} />
              <div className={`h-3 flex-1 ${pulse}`} />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-borde-input p-3">
          <div className={`h-11 w-11 shrink-0 rounded-full ${pulse}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-3 w-3/4 ${pulse}`} />
            <div className={`h-3 w-1/2 ${pulse}`} />
          </div>
        </div>
      </aside>

      <header
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-40 h-14 border-b border-borde-input bg-superficie lg:hidden"
      >
        <div className="flex h-full items-center justify-between gap-3 px-3">
          <div className={`h-8 w-8 ${pulse}`} />
          <div className={`h-6 w-20 ${pulse}`} />
          <div className={`h-8 w-8 ${pulse}`} />
        </div>
      </header>
    </>
  );
}
