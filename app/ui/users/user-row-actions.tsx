"use client";

import type { UserRole } from "../../lib/auth/types.ts";
import { isOwnAccount } from "../../lib/users/rules.ts";
import {
  getUserRowActionDefinitions,
  getUserRowActionsLabel,
} from "../../lib/users/row-actions.ts";
import type { UserSummary } from "../../lib/users/types.ts";
import type { RowActionItem } from "../../lib/ui/row-actions.ts";
import RowActionsMenu from "../table/row-actions-menu.tsx";

interface UserRowActionsProps {
  readonly user: UserSummary;
  readonly role: UserRole;
  readonly currentUserId: string | null;
  readonly onView: (user: UserSummary) => void;
  readonly onChangeRole?: (user: UserSummary) => void;
  readonly onDelete?: (user: UserSummary) => void;
}

/** Menú accesible de acciones para una fila del padrón. */
export default function UserRowActions({
  user,
  role,
  currentUserId,
  onView,
  onChangeRole,
  onDelete,
}: UserRowActionsProps) {
  const items: readonly RowActionItem[] = getUserRowActionDefinitions(
    role,
    isOwnAccount(user.id, currentUserId),
  ).map((action) => ({
    ...action,
    onSelect:
      action.id === "view"
        ? () => onView(user)
        : action.id === "change-role"
          ? onChangeRole
            ? () => onChangeRole(user)
            : undefined
          : onDelete
            ? () => onDelete(user)
            : undefined,
  }));
  const actionsLabel = getUserRowActionsLabel(user);

  return (
    <RowActionsMenu
      triggerLabel={actionsLabel}
      menuLabel={actionsLabel}
      items={items}
    />
  );
}
