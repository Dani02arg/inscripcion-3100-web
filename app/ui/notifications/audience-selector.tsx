import {
  NOTIFICATION_AUDIENCE_DESCRIPTIONS,
  NOTIFICATION_AUDIENCE_LABELS,
} from "../../lib/notifications/labels.ts";
import {
  NOTIFICATION_AUDIENCES,
  type NotificationAudience,
} from "../../lib/notifications/types.ts";

interface AudienceSelectorProps {
  readonly value: NotificationAudience | null;
  readonly onChange: (audience: NotificationAudience) => void;
  readonly disabled?: boolean;
}

/** Tres modalidades de audiencia con su alcance. */
export default function AudienceSelector({
  value,
  onChange,
  disabled = false,
}: AudienceSelectorProps) {
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="text-sm font-semibold text-texto-principal">
        Destinatario
      </legend>

      <div className="grid gap-2 sm:grid-cols-3">
        {NOTIFICATION_AUDIENCES.map((audience) => (
          <label
            key={audience}
            className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm transition-colors ${
              value === audience
                ? "border-azul-institucional bg-azul-suave"
                : "border-borde-input bg-superficie hover:bg-fondo-app"
            }`}
          >
            <input
              type="radio"
              name="notification-audience"
              value={audience}
              checked={value === audience}
              onChange={() => {
                onChange(audience);
              }}
              className="mt-1 h-4 w-4 shrink-0"
            />
            <span>
              <span className="block font-semibold text-texto-principal">
                {NOTIFICATION_AUDIENCE_LABELS[audience]}
              </span>
              <span className="mt-0.5 block text-xs text-texto-secundario">
                {NOTIFICATION_AUDIENCE_DESCRIPTIONS[audience]}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
