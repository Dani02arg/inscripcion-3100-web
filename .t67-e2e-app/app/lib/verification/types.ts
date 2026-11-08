/** Registro pendiente: alta aceptada que todavía no fue verificada. */
export interface PendingRegistration {
  /** Identificador devuelto por el servicio de registro. */
  userId: string;
  /** Correo al que se envió el código. */
  email: string;
  /** Momento (ms desde la época) en que se habilita el reenvío; 0 si está habilitado. */
  resendAvailableAt: number;
}

/** Campos del formulario de verificación que pueden tener error. */
export type VerifyField = "code";

/** Errores por campo del formulario de verificación. */
export type VerifyFieldErrors = Partial<Record<VerifyField, string>>;

/** Estados posibles del resultado de verificar el código. */
export type VerifyStatus =
  | "idle"
  | "rejected"
  | "expired"
  | "failed"
  | "missing"
  | "success";

/** Resultado que la verificación entrega al formulario. */
export interface VerifyActionState {
  status: VerifyStatus;
  message: string;
  errors: VerifyFieldErrors;
}

/** Estados posibles del resultado de reenviar el código. */
export type ResendStatus = "idle" | "sent" | "failed" | "missing";

/** Resultado que el reenvío entrega al formulario. */
export interface ResendActionState {
  status: ResendStatus;
  message: string;
  /** Reenvíos disponibles en el día, solo si el servicio informa el dato. */
  remainingResends?: number;
}
