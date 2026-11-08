import {
  getStatusLabel,
  isCourseStatus,
} from "../../lib/courses/labels.ts";

interface CourseStatusBadgeProps {
  status: string;
}

const STATUS_CLASSES: Record<"active" | "inactive", string> = {
  active: "estado-aprobado",
  inactive: "estado-observacion",
};

/** Estado del curso con texto e indicador, sin depender solo del color. */
export default function CourseStatusBadge({
  status,
}: CourseStatusBadgeProps) {
  const className = isCourseStatus(status)
    ? STATUS_CLASSES[status]
    : "bg-fondo-app text-texto-principal";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${className}`}
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      {getStatusLabel(status)}
    </span>
  );
}
