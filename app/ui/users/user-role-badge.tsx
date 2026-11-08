import { getUserRoleLabel } from "../../lib/users/labels.ts";

interface UserRoleBadgeProps {
  readonly role: string;
}

/** Etiqueta del rol con el color institucional y texto visible. */
export default function UserRoleBadge({ role }: UserRoleBadgeProps) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full border border-azul-institucional bg-fondo-app px-2.5 py-1 text-sm font-semibold text-azul-institucional">
      {getUserRoleLabel(role)}
    </span>
  );
}
