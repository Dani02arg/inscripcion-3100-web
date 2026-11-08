import { CODE_LENGTH, isCompleteCode, normalizeCode } from "../verification/code.ts";

/** Relleno interno de las casillas vacías. */
const EMPTY_SLOT = " ";

/** Resultado del pegado: código con casillas y casilla que recibe el foco. */
export type RecoveryPasteResult = {
  digits: string;
  focusIndex: number;
};

/** Devuelve el índice de la primera casilla vacía; si no hay, la última. */
function nextEmptyIndex(digits: string): number {
  const slots = digits.padEnd(CODE_LENGTH, EMPTY_SLOT).slice(0, CODE_LENGTH);
  const index = slots.search(/[^0-9]/);

  return index === -1 ? CODE_LENGTH - 1 : index;
}

/**
 * Reparte el texto pegado desde la primera casilla, sin importar dónde se
 * pegó. Descarta lo que no sea dígito, conserva los primeros cinco y deja el
 * foco en la siguiente casilla vacía o en la última si el código quedó completo.
 */
export function applyRecoveryPaste(
  digits: string,
  text: string,
): RecoveryPasteResult {
  const pasted = normalizeCode(text);

  if (!pasted) {
    return { digits, focusIndex: nextEmptyIndex(digits) };
  }

  return {
    digits: pasted.padEnd(CODE_LENGTH, EMPTY_SLOT),
    focusIndex: isCompleteCode(pasted) ? CODE_LENGTH - 1 : pasted.length,
  };
}
