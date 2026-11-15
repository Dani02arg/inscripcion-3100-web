/** Conserva únicamente los dígitos de un CUIL. */
export function extractCuilDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Aplica la máscara argentina `XX-XXXXXXXX-X` de forma progresiva: hasta dos
 * dígitos sin guion, luego `XX-XXXX…` y, al completar los once, `XX-XXXXXXXX-X`.
 */
export function formatCuil(value: string): string {
  const digits = extractCuilDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

/** Indica si el valor contiene los once dígitos de un CUIL completo. */
export function isCuilComplete(value: string): boolean {
  return extractCuilDigits(value).length === 11;
}
