"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  approveRegistrationAction,
  observeRegistrationAction,
  reassignRegistrationAction,
  rejectRegistrationAction,
} from "../../lib/actions/registrations.ts";
import {
  formatRegistrationDate,
  formatRegistrationStudentName,
  getCycleLabel,
  getShiftLabel,
  getSpecialityLabel,
} from "../../lib/registrations/labels.ts";
import { getStatusLabel } from "../../lib/registrations/status.ts";
import type {
  AvailableCourse,
  DictamenActionState,
  Registration,
  RegistrationTutor,
} from "../../lib/registrations/types.ts";
import type {
  DictamenOptionalPayload,
  ObservePayload,
  ReassignPayload,
} from "../../lib/validation/registrations.ts";
import CourseBreadcrumb from "../courses/course-breadcrumb.tsx";
import ApproveChoiceDialog from "./approve-choice-dialog.tsx";
import DictamenConfirmDialog from "./dictamen-confirm-dialog.tsx";
import ObserveDialog from "./observe-dialog.tsx";
import PdfModal from "./pdf-modal.tsx";
import ReassignDialog from "./reassign-dialog.tsx";
import RegistrationActionsFab from "./registration-actions-fab.tsx";
import RegistrationStatusFab from "./registration-status-fab.tsx";
import RejectDialog from "./reject-dialog.tsx";

type DialogState =
  | { kind: "approve-choice" }
  | { kind: "approve-confirm" }
  | { kind: "observe" }
  | { kind: "reassign" }
  | { kind: "reject" }
  | null;

interface RegistrationDetailProps {
  registration: Registration;
  tutor: RegistrationTutor | null;
  availableCourses: readonly AvailableCourse[];
}

type DictamenServerAction = (
  previousState: DictamenActionState,
  formData: FormData,
) => Promise<DictamenActionState>;

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const ACTION_BASE_CLASSES =
  `inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-2.5 text-base font-semibold transition-colors ${FOCUS_RING_CLASSES}`;

const ACTION_BUTTON_STYLES: Record<
  "approve-choice" | "observe" | "reassign" | "reject",
  string
> = {
  "approve-choice": "bg-estado-aprobado text-white hover:opacity-90",
  observe: "bg-azul-principal text-white hover:opacity-90",
  reassign: "bg-estado-pendiente text-white hover:opacity-90",
  reject: "bg-estado-rechazado text-white hover:opacity-90",
};

interface DetailField {
  readonly label: string;
  readonly value: string;
}

function formatYesNo(value: boolean): string {
  return value ? "Sí" : "No";
}

function formatPresent(value: boolean): string {
  return value ? "Presente" : "Ausente";
}

function formatText(value: string | null | undefined): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : "No informado";
}

function formatSubjects(value: readonly string[] | null): string {
  return value && value.length > 0 ? value.join(", ") : "No informado";
}

function DetailItem({ label, value }: DetailField) {
  return (
    <div className="min-w-0 rounded-xl border border-borde-input bg-fondo-app px-3 py-2">
      <dt className="text-sm font-semibold text-texto-principal">{label}</dt>
      <dd className="mt-1 break-words text-base font-medium text-texto-principal">
        {value}
      </dd>
    </div>
  );
}

function DetailSection({
  title,
  items,
}: {
  title: string;
  items: readonly DetailField[];
}) {
  const sectionId = `registration-detail-${title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section
      aria-labelledby={sectionId}
      className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm"
    >
      <h2 id={sectionId} className="text-lg font-bold text-texto-principal">
        {title}
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <DetailItem key={item.label} label={item.label} value={item.value} />
        ))}
      </dl>
    </section>
  );
}

/** Detalle de una inscripción en dos columnas (web) o con FABs (móvil). */
export default function RegistrationDetail({
  registration,
  tutor,
  availableCourses,
}: RegistrationDetailProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  const canDictate = registration.status === "PENDING";

  const submit = async (
    formData: FormData,
    action: DictamenServerAction,
  ) => {
    const result = await action({ status: "idle" }, formData);

    if (result.status === "success") {
      setDialog(null);
      router.refresh();
    }
  };

  const handleApproveConfirm = (payload: DictamenOptionalPayload) => {
    const formData = new FormData();
    formData.set("registrationId", registration.id);
    formData.set("observations", payload.observations ?? "");
    formData.set("pendingSubjects", (payload.pendingSubjects ?? []).join(", "));
    formData.set("missingDocumentation", payload.missingDocumentation ?? "");
    void submit(formData, approveRegistrationAction);
  };

  const handleReject = (payload: DictamenOptionalPayload) => {
    const formData = new FormData();
    formData.set("registrationId", registration.id);
    formData.set("observations", payload.observations ?? "");
    formData.set("pendingSubjects", (payload.pendingSubjects ?? []).join(", "));
    formData.set("missingDocumentation", payload.missingDocumentation ?? "");
    void submit(formData, rejectRegistrationAction);
  };

  const handleObserve = (payload: ObservePayload) => {
    const formData = new FormData();
    formData.set("registrationId", registration.id);
    formData.set("observations", payload.observations);
    void submit(formData, observeRegistrationAction);
  };

  const handleReassign = (payload: ReassignPayload) => {
    const formData = new FormData();
    formData.set("registrationId", registration.id);
    formData.set("newCourseId", payload.newCourseId);
    formData.set("reassignmentReason", payload.reassignmentReason);
    formData.set("observations", payload.observations ?? "");
    formData.set("pendingSubjects", (payload.pendingSubjects ?? []).join(", "));
    formData.set("missingDocumentation", payload.missingDocumentation ?? "");
    void submit(formData, reassignRegistrationAction);
  };

  const studentItems: readonly DetailField[] = [
    {
      label: "Apellido y nombre",
      value: formatRegistrationStudentName(registration.student),
    },
    { label: "CUIL", value: formatText(registration.student.studentCuil) },
  ];

  const courseItems: readonly DetailField[] = [
    { label: "Código", value: formatText(registration.course.code) },
    { label: "Año lectivo", value: String(registration.course.year) },
    { label: "Año de cursada", value: String(registration.course.studyYear) },
    { label: "División", value: formatText(registration.course.division) },
    { label: "Ciclo", value: getCycleLabel(registration.course.cycle) },
    { label: "Turno", value: getShiftLabel(registration.course.shift) },
    {
      label: "Especialidad",
      value: getSpecialityLabel(registration.course.speciality),
    },
  ];

  const requestItems: readonly DetailField[] = [
    { label: "Vínculo", value: formatText(registration.relationship) },
    {
      label: "Institución de origen",
      value: formatText(registration.institutionOfOrigin),
    },
    {
      label: "Autorización de imagen",
      value: formatYesNo(registration.photoAuthorization),
    },
  ];

  const tutorItems: readonly DetailField[] = [
    {
      label: "Nombre y apellido",
      value: tutor
        ? formatText(`${tutor.name} ${tutor.lastname}`.trim())
        : "No informado",
    },
    { label: "Correo electrónico", value: formatText(tutor?.email) },
    { label: "Teléfono", value: formatText(tutor?.user_phone) },
  ];

  const conditionsItems: readonly DetailField[] = [
    {
      label: "Problema de salud",
      value: formatYesNo(registration.healthProblem),
    },
    {
      label: "Alumno de inclusión",
      value: formatYesNo(registration.inclusionStudent),
    },
    {
      label: "Impedimento de contacto",
      value: formatYesNo(registration.contactImpediment),
    },
    {
      label: "Procesos legales",
      value: formatYesNo(registration.legalProceedings),
    },
  ];

  const certificatesItems: readonly DetailField[] = [
    {
      label: "Certificado de salud",
      value: formatPresent(registration.hasHealthProblemCertificate),
    },
    {
      label: "Certificado de inclusión",
      value: formatPresent(registration.hasInclusionStudentCertificate),
    },
    {
      label: "Certificado de impedimento",
      value: formatPresent(registration.hasContactImpedimentCertificate),
    },
    {
      label: "Certificado de procesos legales",
      value: formatPresent(registration.hasLegalProceedingsCertificate),
    },
  ];

  const subjectsItems: readonly DetailField[] = [
    {
      label: "Materias adeudadas",
      value: formatSubjects(registration.pendingSubjects),
    },
    {
      label: "Documentación faltante",
      value: formatText(registration.missingDocumentation),
    },
  ];

  const dateItems: readonly DetailField[] = [
    { label: "Creada", value: formatRegistrationDate(registration.created_at) },
    {
      label: "Última actualización",
      value: formatRegistrationDate(registration.updated_at),
    },
  ];

  const reassignmentItems: readonly DetailField[] =
    registration.status === "PROPOSED_REASSIGNMENT"
      ? [
        {
          label: "Curso propuesto",
          value: registration.proposedCourse
            ? formatText(registration.proposedCourse.code)
            : "No informado",
        },
        {
          label: "Motivo",
          value: formatText(registration.reassignmentReason),
        },
      ]
      : [];

  const sections = (
    <>
      <DetailSection title="Datos del alumno" items={studentItems} />
      <DetailSection title="Datos del curso" items={courseItems} />
      <DetailSection title="Datos de la solicitud" items={requestItems} />
      <DetailSection title="Tutor responsable" items={tutorItems} />
      <DetailSection title="Condiciones especiales" items={conditionsItems} />
      <DetailSection title="Certificados adjuntos" items={certificatesItems} />
      {reassignmentItems.length > 0 ? (
        <DetailSection title="Reasignación propuesta" items={reassignmentItems} />
      ) : null}
      {registration.observations ? (
        <DetailSection
          title="Observaciones"
          items={[
            {
              label: "Observaciones",
              value: formatText(registration.observations),
            },
          ]}
        />
      ) : null}
      <DetailSection title="Materias y documentación" items={subjectsItems} />
      <DetailSection title="Fechas" items={dateItems} />
    </>
  );

  const actions = [
    { action: "approve-choice", label: "Aprobar" },
    { action: "observe", label: "Devolver con observaciones" },
    { action: "reassign", label: "Reasignar" },
    { action: "reject", label: "Rechazar" },
  ] as const;

  return (
    <div data-action={dialog?.kind ?? undefined} className="space-y-6">
      <CourseBreadcrumb
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Inscripciones", href: "/dashboard/registrations" },
          { label: "Detalle" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-texto-principal sm:text-3xl">
          Detalle de la inscripción
        </h1>
        <p className="mt-2 text-base text-texto-principal">
          {formatRegistrationStudentName(registration.student)}
        </p>
      </div>

      <div className="hidden lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
        <div className="space-y-4">{sections}</div>

        <aside className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm">
          <p className="text-sm font-semibold text-texto-secundario">Estado</p>
          <p className="mt-1 text-lg font-bold text-texto-principal">
            {getStatusLabel(registration.status)}
          </p>

          {canDictate ? (
            <div className="mt-4 flex flex-col gap-2">
              {actions.map(({ action, label }) => (
                <button
                  key={action}
                  type="button"
                  onClick={() =>
                    setDialog({ kind: action } as DialogState)
                  }
                  className={`${ACTION_BASE_CLASSES} ${ACTION_BUTTON_STYLES[action]}`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-texto-secundario">
              Esta solicitud no admite dictámenes en su estado actual.
            </p>
          )}

          <button
            type="button"
            onClick={() => setPdfOpen(true)}
            className={`${ACTION_BASE_CLASSES} mt-4 border border-borde-input bg-superficie text-texto-principal hover:bg-fondo-app`}
          >
            Ver formulario PDF
          </button>
        </aside>
      </div>

      <div className="space-y-4 lg:hidden">{sections}</div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setPdfOpen(true)}
          className={`${ACTION_BASE_CLASSES} mb-3 border border-borde-input bg-superficie text-texto-principal hover:bg-fondo-app`}
        >
          Ver formulario PDF
        </button>
        <RegistrationStatusFab status={registration.status} />
        {canDictate ? (
          <RegistrationActionsFab
            onApprove={() => setDialog({ kind: "approve-choice" })}
            onObserve={() => setDialog({ kind: "observe" })}
            onReassign={() => setDialog({ kind: "reassign" })}
            onReject={() => setDialog({ kind: "reject" })}
          />
        ) : null}
      </div>

      <ApproveChoiceDialog
        open={dialog?.kind === "approve-choice"}
        id="registration-approve-choice"
        onRequested={() => setDialog({ kind: "approve-confirm" })}
        onReassign={() => setDialog({ kind: "reassign" })}
        onBack={() => setDialog(null)}
      />

      <DictamenConfirmDialog
        open={dialog?.kind === "approve-confirm"}
        id="registration-approve-confirm"
        registration={registration}
        title="Aprobar solicitud"
        action="aprobar la solicitud"
        confirmLabel="Aprobar"
        onConfirm={handleApproveConfirm}
        onBack={() => setDialog({ kind: "approve-choice" })}
      />

      <RejectDialog
        open={dialog?.kind === "reject"}
        id="registration-reject"
        registration={registration}
        onSubmit={handleReject}
        onBack={() => setDialog(null)}
      />

      <ObserveDialog
        open={dialog?.kind === "observe"}
        id="registration-observe"
        registration={registration}
        onSubmit={handleObserve}
        onBack={() => setDialog(null)}
      />

      <ReassignDialog
        open={dialog?.kind === "reassign"}
        id="registration-reassign"
        registration={registration}
        courses={availableCourses}
        onSubmit={handleReassign}
        onBack={() => setDialog(null)}
      />

      <PdfModal
        open={pdfOpen}
        registrationId={registration.id}
        onClose={() => setPdfOpen(false)}
      />
    </div>
  );
}
