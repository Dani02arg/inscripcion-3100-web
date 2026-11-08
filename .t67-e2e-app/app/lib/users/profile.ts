import {
  USER_NO_INFO_LABEL,
  getEducationLevelLabel,
  getUserRoleLabel,
  isEducationLevel,
} from "./labels.ts";
import type { CurrentUser, UserRole } from "../auth/types.ts";
import { getVerificationDisplay, VERIFICATION_LABELS } from "./rules.ts";
import type { TutorProfileInput, UserDetail } from "./types.ts";

export interface UserDetailField {
  readonly label: string;
  readonly value: string;
}

export interface UserDetailSection {
  readonly title: string;
  readonly fields: readonly UserDetailField[];
}

export function getAccountDisplayFields(
  user: Pick<CurrentUser, "name" | "lastname" | "email">,
): readonly UserDetailField[] {
  return [
    { label: "Nombre", value: formatOptionalValue(user.name) },
    { label: "Apellido", value: formatOptionalValue(user.lastname) },
    {
      label: "Correo electrónico",
      value: formatOptionalValue(user.email),
    },
  ];
}

export interface ProfileDateTimeOptions {
  readonly timeZone?: string;
}

interface DateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function parseDateOnly(
  value: string | null | undefined,
): DateParts | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^(\d{4})([-/])(\d{2})\2(\d{2})(?:$|T)/.exec(
    value.trim(),
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[3]);
  const day = Number(match[4]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

/** Fecha sin hora en `DD/MM/AAAA`, sin desplazamiento por zona horaria. */
export function formatProfileDate(
  value: string | null | undefined,
): string {
  const parts = parseDateOnly(value);

  if (!parts) {
    return USER_NO_INFO_LABEL;
  }

  return `${pad(parts.day)}/${pad(parts.month)}/${parts.year}`;
}

/**
 * Fecha y hora en `DD/MM/AAAA HH:mm`. Por defecto usa la zona local del
 * dispositivo; el parámetro de zona existe para pruebas deterministas.
 */
export function formatProfileDateTime(
  value: string | null | undefined,
  options: ProfileDateTimeOptions = {},
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return USER_NO_INFO_LABEL;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return USER_NO_INFO_LABEL;
  }

  let formatter: Intl.DateTimeFormat;

  try {
    formatter = new Intl.DateTimeFormat("en-GB", {
      ...(options.timeZone ? { timeZone: options.timeZone } : {}),
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    return USER_NO_INFO_LABEL;
  }

  const parts = formatter.formatToParts(date);
  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("day")}/${getPart("month")}/${getPart("year")} ${getPart("hour")}:${getPart("minute")}`;
}

/** Texto opcional recortado o «No informado» si falta. */
export function formatOptionalValue(
  value: string | null | undefined,
): string {
  if (typeof value !== "string") {
    return USER_NO_INFO_LABEL;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : USER_NO_INFO_LABEL;
}

export function formatEducationLevel(
  value: string | null | undefined,
): string {
  return getEducationLevelLabel(value);
}

/** Devuelve los valores editables confirmados por el perfil del servicio. */
export function getTutorProfileValues(
  user: Pick<CurrentUser, "occupation" | "educationLevel">,
): TutorProfileInput {
  return {
    occupation: user.occupation ?? "",
    educationLevel: isEducationLevel(user.educationLevel)
      ? user.educationLevel
      : "",
  };
}

/** Compone los datos visibles del perfil propio sin incluir identificadores. */
export function getOwnProfileSections(
  user: CurrentUser,
): readonly UserDetailSection[] {
  const verificationLabel = user.emailVerifiedAt
    ? VERIFICATION_LABELS.verified
    : VERIFICATION_LABELS.unverified;

  return [
    {
      title: "Datos personales",
      fields: [
        { label: "Nombre", value: formatOptionalValue(user.name) },
        { label: "Apellido", value: formatOptionalValue(user.lastname) },
        {
          label: "Fecha de nacimiento",
          value: formatProfileDate(user.birthdate),
        },
        { label: "Teléfono", value: formatOptionalValue(user.userPhone) },
        { label: "Ocupación", value: formatOptionalValue(user.occupation) },
        {
          label: "Nivel educativo",
          value: formatEducationLevel(user.educationLevel),
        },
      ],
    },
    {
      title: "Datos de contacto",
      fields: [
        {
          label: "Correo electrónico",
          value: formatOptionalValue(user.email),
        },
      ],
    },
    {
      title: "Datos de la cuenta",
      fields: [
        {
          label: "Correo electrónico",
          value: formatOptionalValue(user.email),
        },
        { label: "Rol", value: getUserRoleLabel(user.role) },
        {
          label: "Verificación del correo",
          value: verificationLabel,
        },
      ],
    },
  ];
}

/** Compone las secciones informativas visibles del detalle del usuario. */
export function getUserDetailSections(
  user: UserDetail,
  viewerRole: UserRole,
): readonly UserDetailSection[] {
  const verification = getVerificationDisplay(
    viewerRole,
    user.emailVerifiedAt,
  );
  const accountFields: UserDetailField[] = [
    { label: "Rol", value: getUserRoleLabel(user.role) },
    {
      label: "Verificación del correo",
      value: verification.label,
    },
  ];

  if (viewerRole === "ADMINISTRADOR") {
    if (verification.date) {
      accountFields.push({
        label: "Fecha de verificación",
        value: formatProfileDateTime(verification.date),
      });
    }

    accountFields.push(
      {
        label: "Fecha de creación",
        value: formatProfileDateTime(user.createdAt),
      },
      {
        label: "Última actualización",
        value: formatProfileDateTime(user.updatedAt),
      },
    );
  }

  return [
    {
      title: "Datos personales",
      fields: [
        { label: "Nombre", value: formatOptionalValue(user.name) },
        { label: "Apellido", value: formatOptionalValue(user.lastname) },
        {
          label: "Fecha de nacimiento",
          value: formatProfileDate(user.birthdate),
        },
        { label: "DNI", value: formatOptionalValue(user.dni) },
        { label: "CUIL", value: formatOptionalValue(user.cuil) },
      ],
    },
    {
      title: "Datos de contacto",
      fields: [
        {
          label: "Correo electrónico",
          value: formatOptionalValue(user.email),
        },
        { label: "Teléfono", value: formatOptionalValue(user.userPhone) },
      ],
    },
    {
      title: "Información adicional",
      fields: [
        { label: "Ocupación", value: formatOptionalValue(user.occupation) },
        {
          label: "Nivel educativo",
          value: formatEducationLevel(user.educationLevel),
        },
      ],
    },
    {
      title: "Información de la cuenta",
      fields: accountFields,
    },
  ];
}

/** El perfil de tutor está completo con ocupación y nivel educativo válidos. */
export function isTutorProfileComplete(user: {
  readonly occupation?: string | null;
  readonly educationLevel?: string | null;
}): boolean {
  const occupation =
    typeof user.occupation === "string" ? user.occupation.trim() : "";

  return occupation.length > 0 && isEducationLevel(user.educationLevel);
}

/** Nombre visible del perfil; «Cuenta» cuando no hay nombre. */
export function getProfileDisplayName(user: {
  readonly name?: string | null;
  readonly lastname?: string | null;
}): string {
  const parts = [user.name, user.lastname]
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .map((value) => value.trim());

  return parts.length > 0 ? parts.join(" ") : "Cuenta";
}
