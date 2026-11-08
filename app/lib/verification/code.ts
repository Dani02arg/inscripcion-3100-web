/** Cantidad de dígitos del código de verificación. */
export const CODE_LENGTH = 5;

/** Relleno interno de las casillas vacías. */
const EMPTY_SLOT = " ";

/** Deja solo dígitos y recorta a la longitud del código. */
export function normalizeCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

/** Completa el código con casillas vacías hasta la longitud fija. */
function toSlots(digits: string): string {
  return digits.padEnd(CODE_LENGTH, EMPTY_SLOT).slice(0, CODE_LENGTH);
}

/** Reemplaza una casilla por un dígito; ignora índices y caracteres inválidos. */
export function setDigit(digits: string, index: number, char: string): string {
  const slots = toSlots(digits);

  if (index < 0 || index >= CODE_LENGTH || !/^\d$/.test(char)) {
    return slots;
  }

  return `${slots.slice(0, index)}${char}${slots.slice(index + 1)}`;
}

/** Reparte el texto pegado desde la casilla activa y descarta lo que no sea dígito. */
export function applyPaste(
  digits: string,
  text: string,
  startIndex: number,
): string {
  const slots = toSlots(digits);
  const pasted = normalizeCode(text);

  if (!pasted) {
    return slots;
  }

  const start = Math.min(Math.max(startIndex, 0), CODE_LENGTH - 1);
  const chunk = pasted.slice(0, CODE_LENGTH - start);

  return `${slots.slice(0, start)}${chunk}${slots.slice(start + chunk.length)}`;
}

/** Indica la casilla que recibe el foco tras escribir (avanza) o borrar (retrocede). */
export function nextFocusIndex(digits: string, index: number): number {
  const slots = toSlots(digits);
  const current = Math.min(Math.max(index, 0), CODE_LENGTH - 1);

  if (/\d/.test(slots[current])) {
    return Math.min(current + 1, CODE_LENGTH - 1);
  }

  return Math.max(current - 1, 0);
}

/** Comprueba que las cinco casillas tengan un dígito. */
export function isCompleteCode(value: string): boolean {
  return value.length === CODE_LENGTH && /^\d+$/.test(value);
}
