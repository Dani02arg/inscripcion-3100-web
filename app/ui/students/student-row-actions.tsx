"use client";

import type { UserRole } from "../../lib/auth/types.ts";
import {
  getStudentRowActionDefinitions,
  getStudentRowActionsLabel,
} from "../../lib/students/row-actions.ts";
import type { Student } from "../../lib/students/types.ts";
import type { RowActionItem } from "../../lib/ui/row-actions.ts";
import RowActionsMenu from "../table/row-actions-menu.tsx";

interface StudentRowActionsProps {
  readonly student: Student;
  readonly role: UserRole;
  readonly onView: (student: Student) => void;
  readonly onEdit?: (student: Student) => void;
  readonly onDelete?: (student: Student) => void;
}

/** Menú accesible de acciones para una fila de alumnos. */
export default function StudentRowActions({
  student,
  role,
  onView,
  onEdit,
  onDelete,
}: StudentRowActionsProps) {
  const items: readonly RowActionItem[] = getStudentRowActionDefinitions(
    role,
  ).map((action) => ({
    ...action,
    onSelect:
      action.id === "view"
        ? () => onView(student)
        : action.id === "edit"
          ? onEdit
            ? () => onEdit(student)
            : undefined
          : onDelete
            ? () => onDelete(student)
            : undefined,
  }));
  const actionsLabel = getStudentRowActionsLabel(student);

  return (
    <RowActionsMenu
      triggerLabel={actionsLabel}
      menuLabel={actionsLabel}
      items={items}
    />
  );
}
