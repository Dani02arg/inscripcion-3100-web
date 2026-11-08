"use client";

import {
  getDeactivateDisabledReason,
  getDeleteDisabledReason,
  getEditDisabledReason,
  isCourseEditable,
} from "../../lib/courses/rules.ts";
import type { Course } from "../../lib/courses/types.ts";
import type { RowActionItem } from "../../lib/ui/row-actions.ts";
import RowActionsMenu from "../table/row-actions-menu.tsx";

interface CourseRowActionsProps {
  course: Course;
  currentYear: number;
  onView: (course: Course) => void;
  onEdit: (course: Course) => void;
  onClone: (course: Course) => void;
  onDelete: (course: Course) => void;
  onToggleStatus: (course: Course) => void;
}

/** Menú accesible de acciones por curso. */
export default function CourseRowActions({
  course,
  currentYear,
  onView,
  onEdit,
  onClone,
  onDelete,
  onToggleStatus,
}: CourseRowActionsProps) {
  const code = course.code ?? "Sin código";
  const isEditable = isCourseEditable(course, currentYear);
  const editDisabledReason = getEditDisabledReason(course, currentYear);
  const deleteDisabledReason = getDeleteDisabledReason(course);
  const deactivateDisabledReason = getDeactivateDisabledReason(course);
  const isActive = course.status === "active";
  const statusLabel = isActive ? "Desactivar" : "Activar";
  const statusDisabled = isActive && deactivateDisabledReason !== null;

  const items: readonly RowActionItem[] = [
    {
      id: "view",
      label: "Ver detalles",
      onSelect: () => onView(course),
    },
    {
      id: "edit",
      label: "Editar",
      disabled: !isEditable,
      disabledReason: editDisabledReason ?? undefined,
      onSelect: () => onEdit(course),
    },
    {
      id: "clone",
      label: "Clonar",
      onSelect: () => onClone(course),
    },
    {
      id: "report",
      label: "Generar reporte",
      accessibleLabel: "Generar reporte del curso",
      badge: "Próximamente",
      disabled: true,
      disabledReason: "No disponible, próximamente.",
    },
    {
      id: "status",
      label: statusLabel,
      disabled: statusDisabled,
      disabledReason: deactivateDisabledReason ?? undefined,
      onSelect: () => onToggleStatus(course),
    },
    {
      id: "delete",
      label: "Eliminar",
      disabled: deleteDisabledReason !== null,
      disabledReason: deleteDisabledReason ?? undefined,
      onSelect: () => onDelete(course),
    },
  ];

  return (
    <RowActionsMenu
      triggerLabel={`Acciones del curso ${code}`}
      menuLabel={`Acciones del curso ${code}`}
      items={items}
    />
  );
}
