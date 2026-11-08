/** Máscara que se muestra cuando el correo no es utilizable. */
const INVALID_MASK = "***";

/**
 * Enmascara un correo conservando la primera letra del usuario y el sufijo del
 * dominio: `andres@gmail.com` se muestra como `a***@g***.com`.
 */
export function maskEmail(email: string): string {
  const trimmed = email.trim();

  if (!trimmed || /\s/.test(trimmed)) {
    return INVALID_MASK;
  }

  const at = trimmed.lastIndexOf("@");

  if (at <= 0 || at === trimmed.length - 1) {
    return INVALID_MASK;
  }

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  if (local.includes("@") || domain.includes("@")) {
    return INVALID_MASK;
  }

  const dot = domain.lastIndexOf(".");

  if (dot <= 0 || dot === domain.length - 1) {
    return INVALID_MASK;
  }

  const domainName = domain.slice(0, dot);
  const suffix = domain.slice(dot);

  return `${local.charAt(0)}***@${domainName.charAt(0)}***${suffix}`;
}
