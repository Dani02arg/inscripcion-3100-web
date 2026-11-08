import { canManageUsers } from "./access.ts";
import { formatUserFullName } from "./labels.ts";
import {
  CHANGE_ROLE_SELF_REASON,
  DELETE_USER_SELF_REASON,
} from "./rules.ts";
import type { UserSummary } from "./types.ts";

export interface UserRowActionDefinition {
  readonly id: "view" | "change-role" | "delete";
  readonly label: string;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
}

const VIEW_ACTION: UserRowActionDefinition = {
  id: "view",
  label: "Ver usuario",
};

const ADMIN_ACTIONS: readonly UserRowActionDefinition[] = [
  VIEW_ACTION,
  { id: "change-role", label: "Cambiar rol" },
  { id: "delete", label: "Dar de baja" },
];

/** Devuelve solo las acciones permitidas para el rol vigente. */
export function getUserRowActionDefinitions(
  role: unknown,
  isSelf = false,
): readonly UserRowActionDefinition[] {
  if (!canManageUsers(role)) {
    return [];
  }

  if (role !== "ADMINISTRADOR") {
    return [VIEW_ACTION];
  }

  if (!isSelf) {
    return ADMIN_ACTIONS;
  }

  return [
    VIEW_ACTION,
    {
      id: "change-role",
      label: "Cambiar rol",
      disabled: true,
      disabledReason: CHANGE_ROLE_SELF_REASON,
    },
    {
      id: "delete",
      label: "Dar de baja",
      disabled: true,
      disabledReason: DELETE_USER_SELF_REASON,
    },
  ];
}

/** Nombre accesible del menú de acciones de una fila. */
export function getUserRowActionsLabel(user: UserSummary): string {
  return `Acciones de ${formatUserFullName(user)}`;
}
