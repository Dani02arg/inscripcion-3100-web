import { ROLE_LABELS, type UserRole } from "../auth/types.ts";
import type {
  SidebarAccountData,
  SidebarAccountState,
} from "./types.ts";

/** Entrada mínima del pie de cuenta, independiente de la capa de red. */
export type SidebarAccountInput =
  | {
      readonly status: "ok";
      readonly user: {
        readonly name: string;
        readonly lastname: string;
        readonly email: string;
        readonly role: UserRole;
      };
    }
  | { readonly status: "forbidden" }
  | { readonly status: "error" };

function splitWords(value: string): string[] {
  return value.trim().split(/\s+/).filter((word) => word.length > 0);
}

function firstCharacter(value: string): string {
  return Array.from(value)[0] ?? "";
}

function firstTwoCharacters(value: string): string {
  return Array.from(value).slice(0, 2).join("");
}

/**
 * Calcula las iniciales: primera letra del primer nombre y del último
 * apellido. Con una sola palabra usa sus dos primeras letras.
 */
export function formatInitials(
  name: string,
  lastname: string,
): string | null {
  const nameWords = splitWords(name);

  if (nameWords.length === 0) {
    return null;
  }

  const lastNameWords = splitWords(lastname);
  const firstName = nameWords[0] ?? "";
  const firstInitial = firstCharacter(firstName);

  if (lastNameWords.length > 0) {
    const lastLastname = lastNameWords[lastNameWords.length - 1] ?? "";

    return `${firstInitial}${firstCharacter(lastLastname)}`.toLocaleUpperCase(
      "es",
    );
  }

  if (nameWords.length > 1) {
    const lastFirstName = nameWords[nameWords.length - 1] ?? "";

    return `${firstInitial}${firstCharacter(lastFirstName)}`.toLocaleUpperCase(
      "es",
    );
  }

  return firstTwoCharacters(firstName).toLocaleUpperCase("es");
}

/** Une nombre y apellido sin espacios sobrantes. */
export function formatFullName(name: string, lastname: string): string {
  return [...splitWords(name), ...splitWords(lastname)].join(" ");
}

/** Nombre accesible del disparador del menú de cuenta. */
export function getAccountAccessibleName(displayName?: string): string {
  const trimmed = displayName?.trim() ?? "";

  return trimmed.length > 0 ? `Cuenta de ${trimmed}` : "Cuenta";
}

/** Convierte el estado del servidor en datos de pie o en estado degradado. */
export function toSidebarAccount(
  input: SidebarAccountInput,
): SidebarAccountState {
  if (input.status !== "ok") {
    return { status: "unavailable" };
  }

  const name = input.user.name.trim();
  const lastname = input.user.lastname.trim();
  const email = input.user.email.trim();

  if (name.length === 0 && lastname.length === 0 && email.length === 0) {
    return { status: "unavailable" };
  }

  const data: SidebarAccountData = {
    name,
    lastname,
    email,
    initials: formatInitials(name, lastname),
    displayName: formatFullName(name, lastname),
    roleLabel: ROLE_LABELS[input.user.role],
  };

  return { status: "ready", data };
}
