import {
  NotificationFiltersPlaceholder,
  NotificationSkeleton,
} from "../../ui/notifications/notification-states.tsx";

/** Carga del segmento de notificaciones. */
export default function NotificationsLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
      <div className="mx-auto w-[97%] space-y-6 md:w-[95%]">
        <header>
          <h1 className="text-2xl font-bold text-texto-principal">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-texto-secundario">
            Avisos recibidos en tu cuenta.
          </p>
        </header>

        <NotificationFiltersPlaceholder />
        <NotificationSkeleton />
      </div>
    </main>
  );
}
