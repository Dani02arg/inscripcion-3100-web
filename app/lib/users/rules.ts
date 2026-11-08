import { isKnownRole } from "../auth/session.ts";
import { canAdministerUsers, isUserManagerRole } from "./access.ts";
import { normalizeUserId } from "./list.ts";

export const CHANGE_ROLE_FORBIDDEN_REASON =
  "Solo un administrador puede cambiar roles.";
export const CHANGE_ROLE_SELF_REASON =
  "No podés cambiar tu propio rol.";
export const CHANGE_ROLE_SAME_REASON =
  "Seleccioná un rol distinto del actual.";
export const CHANGE_ROLE_INVALID_REASON =
  "Seleccioná un rol válido.";
export const CHANGE_ROLE_UNVERIFIED_REASON =
  "El correo del usuario debe estar verificado.";

export const DELETE_USER_FORBIDDEN_REASON =
  "Solo un administrador puede dar de baja usuarios.";
export const DELETE_USER_SELF_REASON =
  "No podés dar de baja tu propia cuenta.";

export const VERIFICATION_LABELS = {
  verified: "Verificado",
  unverified: "Sin verificar",
  unavailable: "No informado",
} as const;

export type VerificationStatus = keyof typeof VERIFICATION_LABELS;

export interface VerificationDisplay {
  readonly status: VerificationStatus;
  readonly label: string;
  readonly date: string | null;
}

export interface ChangeRoleEligibilityInput {
  readonly viewerRole: unknown;
  readonly currentRole: string;
  readonly newRole: string;
  readonly targetVerified: boolean | null;
  readonly isSelf: boolean;
}

export interface DeleteUserEligibilityInput {
  readonly viewerRole: unknown;
  readonly isSelf: boolean;
}

export interface UserDetailActionAvailability {
  readonly changeRoleDisabledReason: string | null;
  readonly deleteDisabledReason: string | null;
}

/** Compara la propia cuenta por identificador normalizado, nunca por nombre. */
export function isOwnAccount(
  userId: string | number | null | undefined,
  currentUserId: string | number | null | undefined,
): boolean {
  if (
    userId === null ||
    userId === undefined ||
    currentUserId === null ||
    currentUserId === undefined
  ) {
    return false;
  }

  const target = normalizeUserId(userId);
  const current = normalizeUserId(currentUserId);

  return target.length > 0 && current.length > 0 && target === current;
}

/** Indica si el rol pertenece al staff administrativo. */
export function isStaffRole(role: unknown): boolean {
  return isUserManagerRole(role);
}

/** Indica si la solicitud pide el mismo rol que ya tiene la cuenta. */
export function isSameRoleRequest(
  requestedRole: string,
  currentRole: string,
): boolean {
  return (
    isKnownRole(requestedRole) &&
    isKnownRole(currentRole) &&
    requestedRole === currentRole
  );
}

/** Motivo por el que no se puede cambiar el rol, o `null` si es elegible. */
export function getChangeRoleDisabledReason(
  input: ChangeRoleEligibilityInput,
): string | null {
  if (!canAdministerUsers(input.viewerRole)) {
    return CHANGE_ROLE_FORBIDDEN_REASON;
  }

  if (input.isSelf) {
    return CHANGE_ROLE_SELF_REASON;
  }

  if (!isKnownRole(input.newRole)) {
    return CHANGE_ROLE_INVALID_REASON;
  }

  if (input.currentRole === input.newRole) {
    return CHANGE_ROLE_SAME_REASON;
  }

  if (input.targetVerified === false) {
    return CHANGE_ROLE_UNVERIFIED_REASON;
  }

  return null;
}

export function canChangeUserRole(
  input: ChangeRoleEligibilityInput,
): boolean {
  return getChangeRoleDisabledReason(input) === null;
}

/** Motivo por el que no se puede dar de baja, o `null` si es elegible. */
export function getDeleteDisabledReason(
  input: DeleteUserEligibilityInput,
): string | null {
  if (!canAdministerUsers(input.viewerRole)) {
    return DELETE_USER_FORBIDDEN_REASON;
  }

  if (input.isSelf) {
    return DELETE_USER_SELF_REASON;
  }

  return null;
}

export function canDeleteUser(input: DeleteUserEligibilityInput): boolean {
  return getDeleteDisabledReason(input) === null;
}

/** Expone acciones en detalle solo al administrador y aplica sus bloqueos. */
export function getUserDetailActionAvailability(
  viewerRole: unknown,
  isSelf: boolean,
  targetVerified: boolean,
): UserDetailActionAvailability | null {
  if (!canAdministerUsers(viewerRole)) {
    return null;
  }

  return {
    changeRoleDisabledReason: isSelf
      ? CHANGE_ROLE_SELF_REASON
      : targetVerified
        ? null
        : CHANGE_ROLE_UNVERIFIED_REASON,
    deleteDisabledReason: isSelf ? DELETE_USER_SELF_REASON : null,
  };
}

/**
 * Estado de verificación visible según el rol del observador.
 * El detalle solo informa la fecha a `ADMINISTRADOR`; para el resto es
 * «No informado» y nunca se afirma que el correo esté sin verificar.
 */
export function getVerificationDisplay(
  viewerRole: unknown,
  emailVerifiedAt: string | null | undefined,
): VerificationDisplay {
  if (viewerRole !== "ADMINISTRADOR") {
    return {
      status: "unavailable",
      label: VERIFICATION_LABELS.unavailable,
      date: null,
    };
  }

  const date =
    typeof emailVerifiedAt === "string" && emailVerifiedAt.trim().length > 0
      ? emailVerifiedAt
      : null;

  if (date) {
    return {
      status: "verified",
      label: VERIFICATION_LABELS.verified,
      date,
    };
  }

  return {
    status: "unverified",
    label: VERIFICATION_LABELS.unverified,
    date: null,
  };
}
