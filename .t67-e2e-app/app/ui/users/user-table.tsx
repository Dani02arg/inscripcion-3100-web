import type { ReactNode } from "react";

import {
  buildUserRowLabel,
  formatUserFullName,
  USER_NO_INFO_LABEL,
} from "../../lib/users/labels.ts";
import type { UserSummary } from "../../lib/users/types.ts";
import UserRoleBadge from "./user-role-badge.tsx";

interface UserTableProps {
  readonly users: readonly UserSummary[];
  readonly caption?: string;
  readonly renderRowActions?: (user: UserSummary) => ReactNode;
  readonly id?: string;
}

const HEADER_CLASSES =
  "whitespace-nowrap px-4 py-3.5 text-left text-sm font-semibold";

const CELL_CLASSES = "whitespace-nowrap px-4 py-3 align-middle";

/** Tabla semántica reutilizable para el padrón y el directorio de usuarios. */
export default function UserTable({
  users,
  caption = "Listado de usuarios",
  renderRowActions,
  id = "users-results",
}: UserTableProps) {
  return (
    <section className="overflow-x-auto rounded-2xl border border-borde-input bg-superficie shadow-sm">
      <table
        id={id}
        className="min-w-full divide-y divide-borde-input text-left text-sm text-texto-principal"
      >
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-fondo-app">
          <tr>
            <th scope="col" className={HEADER_CLASSES}>
              Usuario
            </th>
            <th scope="col" className={HEADER_CLASSES}>
              DNI
            </th>
            <th scope="col" className={HEADER_CLASSES}>
              Correo
            </th>
            <th scope="col" className={HEADER_CLASSES}>
              Rol
            </th>
            <th scope="col" className={HEADER_CLASSES}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borde-input">
          {users.map((user) => (
            <tr
              key={user.id}
              aria-label={buildUserRowLabel(user)}
              className="hover:bg-superficie-hover"
            >
              <th
                scope="row"
                className={`${CELL_CLASSES} font-semibold`}
              >
                {formatUserFullName(user)}
              </th>
              <td className={CELL_CLASSES}>
                {user.dni?.trim() || USER_NO_INFO_LABEL}
              </td>
              <td className={CELL_CLASSES}>
                {user.email?.trim() || USER_NO_INFO_LABEL}
              </td>
              <td className={CELL_CLASSES}>
                <UserRoleBadge role={user.role} />
              </td>
              <td className={CELL_CLASSES}>
                {renderRowActions ? renderRowActions(user) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
