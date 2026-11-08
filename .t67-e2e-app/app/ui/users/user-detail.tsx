import { getUserDetailSections } from "../../lib/users/profile.ts";
import type { UserRole } from "../../lib/auth/types.ts";
import type { UserDetail } from "../../lib/users/types.ts";

interface UserDetailViewProps {
  readonly user: UserDetail;
  readonly viewerRole: UserRole;
}

/** Presenta las secciones informativas del detalle de usuario. */
export default function UserDetailView({
  user,
  viewerRole,
}: UserDetailViewProps) {
  const sections = getUserDetailSections(user, viewerRole);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {sections.map((section) => (
        <section
          key={section.title}
          aria-labelledby={`user-detail-${section.title}`}
          className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
        >
          <h2
            id={`user-detail-${section.title}`}
            className="text-lg font-bold text-texto-principal"
          >
            {section.title}
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.label} className="min-w-0 space-y-1">
                <dt className="text-sm font-semibold text-texto-secundario">
                  {field.label}
                </dt>
                <dd className="break-words text-base text-texto-principal">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
