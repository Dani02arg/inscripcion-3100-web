import {
  canWriteStudents,
  isStudentReaderRole,
} from "./access.ts";

export { getStudentRowActionsLabel } from "./labels.ts";

export type StudentRowActionId = "view" | "edit" | "delete";

export interface StudentRowActionDefinition {
  readonly id: StudentRowActionId;
  readonly label: string;
}

const VIEW_ACTION: StudentRowActionDefinition = Object.freeze({
  id: "view",
  label: "Ver",
});

const TUTOR_ACTIONS: readonly StudentRowActionDefinition[] = Object.freeze([
  VIEW_ACTION,
  Object.freeze({ id: "edit", label: "Editar" }),
  Object.freeze({ id: "delete", label: "Eliminar" }),
]);

const ADMIN_ACTIONS: readonly StudentRowActionDefinition[] = Object.freeze([
  VIEW_ACTION,
]);

/**
 * Devuelve las acciones del rol: el tutor ve, edita y elimina; los roles
 * administrativos solo ven. Un rol desconocido no recibe acciones.
 */
export function getStudentRowActionDefinitions(
  role: unknown,
): readonly StudentRowActionDefinition[] {
  if (!isStudentReaderRole(role)) {
    return [];
  }

  return canWriteStudents(role) ? TUTOR_ACTIONS : ADMIN_ACTIONS;
}
