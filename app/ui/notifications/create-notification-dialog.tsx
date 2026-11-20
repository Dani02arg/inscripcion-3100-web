"use client";

import { useCallback, useEffect, useState } from "react";

import {
  loadNotificationCoursesAction,
  sendNotificationAction,
} from "../../lib/actions/notifications.ts";
import {
  buildTutorOptionLabel,
} from "../../lib/notifications/labels.ts";
import {
  buildNotificationCourseLabel,
  hasNotificationDraft,
} from "../../lib/notifications/rules.ts";
import type {
  CourseOptionsResult,
  NotificationAudience,
  NotificationFieldErrors,
  NotificationNotice,
  SendNotificationState,
} from "../../lib/notifications/types.ts";
import {
  countTitleCharacters,
  normalizeNotificationTitle,
  NOTIFICATION_TITLE_TOO_LONG_MESSAGE,
  validateNotificationAttachment,
  validateNotificationContent,
  validateNotificationTitle,
} from "../../lib/validation/notifications.ts";
import type { UserSummary } from "../../lib/users/types.ts";
import CourseDialog from "../courses/course-dialog.tsx";
import AudienceSelector from "./audience-selector.tsx";
import CourseSelector, {
  type CourseOptionsState,
} from "./course-selector.tsx";
import NotificationComposer from "./notification-composer.tsx";
import SendConfirmation from "./send-confirmation.tsx";
import TutorSelector from "./tutor-selector.tsx";

interface CreateNotificationDialogProps {
  readonly onClose: () => void;
  readonly onSuccess: (notice: NotificationNotice) => void;
}

type Step = "form" | "confirm" | "discard";

const PRIMARY_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie disabled:cursor-not-allowed disabled:opacity-60";

const SECONDARY_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie disabled:cursor-not-allowed disabled:text-texto-secundario";

/** Modal de alta con audiencia, destinatario, redacción y confirmación. */
export default function CreateNotificationDialog({
  onClose,
  onSuccess,
}: CreateNotificationDialogProps) {
  const [step, setStep] = useState<Step>("form");
  const [audience, setAudience] = useState<NotificationAudience | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<UserSummary | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [courses, setCourses] = useState<CourseOptionsState>({
    status: "loading",
  });
  const [fieldErrors, setFieldErrors] = useState<NotificationFieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uncertainMessage, setUncertainMessage] = useState<string | null>(null);

  const titleLength = countTitleCharacters(normalizeNotificationTitle(title));
  const canCompose =
    audience === "allTutors" ||
    (audience === "course" && courseId !== null) ||
    (audience === "individual" && recipient !== null);

  const applyCoursesResult = useCallback((result: CourseOptionsResult) => {
    if (!result.ok) {
      setCourses({ status: "error", message: result.message });
      return;
    }

    if (result.courses.length === 0) {
      setCourses({ status: "empty" });
      return;
    }

    setCourses({ status: "ready", courses: result.courses });
  }, []);

  const retryCourses = useCallback((): void => {
    setCourses({ status: "loading" });
    loadNotificationCoursesAction()
      .then(applyCoursesResult)
      .catch(() => {
        setCourses({
          status: "error",
          message: "No pudimos cargar los cursos. Intentá nuevamente.",
        });
      });
  }, [applyCoursesResult]);

  useEffect(() => {
    let active = true;

    loadNotificationCoursesAction()
      .then((result) => {
        if (active) {
          applyCoursesResult(result);
        }
      })
      .catch(() => {
        if (active) {
          setCourses({
            status: "error",
            message: "No pudimos cargar los cursos. Intentá nuevamente.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [applyCoursesResult]);

  const draft = {
    audience,
    courseId,
    recipient,
    title,
    content,
    attachment,
  };

  const closeWithoutSending = (): void => {
    if (sending) {
      return;
    }

    if (step === "confirm") {
      setStep("form");
      return;
    }

    if (step === "discard") {
      setStep("form");
      return;
    }

    if (hasNotificationDraft(draft)) {
      setStep("discard");
      return;
    }

    onClose();
  };

  const handleTitleChange = (value: string): void => {
    if (countTitleCharacters(normalizeNotificationTitle(value)) > 80) {
      setFieldErrors((current) => ({
        ...current,
        title: NOTIFICATION_TITLE_TOO_LONG_MESSAGE,
      }));
      return;
    }

    setTitle(value);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.title;
      return next;
    });
  };

  const handleFileChange = (file: File | null): void => {
    if (!file) {
      return;
    }

    const validation = validateNotificationAttachment(file);

    if (!validation.ok) {
      setFieldErrors((current) => ({
        ...current,
        attachment: validation.message,
      }));
      return;
    }

    setAttachment(file);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.attachment;
      return next;
    });
  };

  const handleAudienceChange = (next: NotificationAudience): void => {
    setAudience(next);
    setCourseId(null);
    setRecipient(null);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.recipientId;
      delete next.courseId;
      return next;
    });
    setStep("form");
  };

  const handleContinue = (): void => {
    const errors: NotificationFieldErrors = {};
    const titleValidation = validateNotificationTitle(title);
    const contentError = validateNotificationContent(content);

    if (!titleValidation.ok) {
      errors.title = titleValidation.message;
    }

    if (contentError) {
      errors.content = contentError;
    }

    if (audience === "individual" && !recipient) {
      errors.recipientId = "Seleccioná un tutor.";
    }

    if (audience === "course" && !courseId) {
      errors.courseId = "Seleccioná un curso.";
    }

    if (!audience) {
      errors.recipients = "Seleccioná una audiencia.";
    }

    if (attachment) {
      const validation = validateNotificationAttachment(attachment);

      if (!validation.ok) {
        errors.attachment = validation.message;
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setGeneralError("Revisá los datos señalados.");
      return;
    }

    setGeneralError(null);
    setUncertainMessage(null);
    setStep("confirm");
  };

  const buildFormData = (): FormData => {
    const formData = new FormData();
    formData.set("title", normalizeNotificationTitle(title));
    formData.set("content", content);
    formData.set("audience", audience ?? "");

    if (audience === "individual" && recipient) {
      formData.set("recipientId", recipient.id);
    }

    if (audience === "course" && courseId) {
      formData.set("courseId", courseId);
    }

    if (attachment) {
      formData.set("attachment", attachment, attachment.name);
    }

    return formData;
  };

  const handleConfirm = (): void => {
    if (!audience || sending) {
      return;
    }

    setSending(true);
    setGeneralError(null);

    sendNotificationAction({ status: "idle" }, buildFormData())
      .then((result: SendNotificationState) => {
        if (result.status === "success") {
          onSuccess({ kind: "success", message: result.message });
          return;
        }

        if (result.status === "uncertain") {
          setUncertainMessage(result.message);
          return;
        }

        if (result.status === "validation") {
          setFieldErrors(result.fieldErrors);
          setGeneralError(result.message);
          setStep("form");

          if (result.fieldErrors.courseId) {
            setCourseId(null);
            retryCourses();
          }

          return;
        }

        if (result.status === "not_found") {
          if (audience === "course") {
            setCourseId(null);
            setFieldErrors({ courseId: result.message });
            retryCourses();
          } else {
            setRecipient(null);
            setFieldErrors({ recipientId: result.message });
          }

          setGeneralError(result.message);
          setStep("form");
          return;
        }

        if (result.status === "too_large") {
          setFieldErrors({ attachment: result.message });
          setGeneralError(result.message);
          setStep("form");
          return;
        }

        setGeneralError(
          result.status === "error" || result.status === "forbidden"
            ? result.message
            : "No pudimos enviar la notificación. Intentá nuevamente.",
        );
      })
      .catch(() => {
        setGeneralError(
          "No pudimos enviar la notificación. Intentá nuevamente.",
        );
      })
      .finally(() => {
        setSending(false);
      });
  };

  const courseLabel =
    courses.status === "ready" && courseId
      ? (() => {
          const course = courses.courses.find((item) => item.id === courseId);
          return course ? buildNotificationCourseLabel(course) : null;
        })()
      : null;

  const tutorLabel = recipient ? buildTutorOptionLabel(recipient) : null;

  return (
    <CourseDialog
      open
      id="notification-create"
      title={
        step === "confirm"
          ? "Confirmar envío"
          : step === "discard"
            ? "Descartar notificación"
            : "Crear notificación"
      }
      onClose={closeWithoutSending}
      closeDisabled={sending}
      closeOnBackdrop
      wide
    >
      {step === "form" ? (
        <div className="space-y-5">
          <AudienceSelector
            value={audience}
            onChange={handleAudienceChange}
            disabled={sending}
          />

          {audience === "course" ? (
            <CourseSelector
              state={courses}
              value={courseId}
              error={fieldErrors.courseId}
              disabled={sending}
              onChange={(value) => {
                setCourseId(value || null);
                setFieldErrors((current) => {
                  const next = { ...current };
                  delete next.courseId;
                  return next;
                });
              }}
              onRetry={retryCourses}
            />
          ) : null}

          {audience === "individual" ? (
            <TutorSelector
              selected={recipient}
              error={fieldErrors.recipientId}
              disabled={sending}
              onSelect={(user) => {
                setRecipient(user);
                setFieldErrors((current) => {
                  const next = { ...current };
                  delete next.recipientId;
                  return next;
                });
              }}
              onClear={() => {
                setRecipient(null);
              }}
            />
          ) : null}

          {audience === "allTutors" ? (
            <p className="rounded-xl border border-borde-input bg-fondo-app px-3 py-2 text-sm text-texto-principal">
              Recibirán el aviso todos los tutores verificados. No se solicitan
              destinatarios adicionales.
            </p>
          ) : null}

          <NotificationComposer
            enabled={canCompose && !sending}
            title={title}
            titleLength={titleLength}
            content={content}
            attachment={attachment}
            titleError={fieldErrors.title}
            contentError={fieldErrors.content}
            attachmentError={fieldErrors.attachment}
            onTitleChange={handleTitleChange}
            onContentChange={(value) => {
              setContent(value);
              setFieldErrors((current) => {
                const next = { ...current };
                delete next.content;
                return next;
              });
            }}
            onFileChange={handleFileChange}
            onRemoveAttachment={() => {
              setAttachment(null);
              setFieldErrors((current) => {
                const next = { ...current };
                delete next.attachment;
                return next;
              });
            }}
          />

          {fieldErrors.recipients ? (
            <p role="alert" className="text-sm font-medium text-estado-error-texto">
              {fieldErrors.recipients}
            </p>
          ) : null}

          {generalError ? (
            <p role="alert" className="text-sm font-medium text-estado-error-texto">
              {generalError}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={closeWithoutSending}
              disabled={sending}
              className={SECONDARY_CLASSES}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={sending || !canCompose}
              className={PRIMARY_CLASSES}
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}

      {step === "confirm" && audience ? (
        <SendConfirmation
          audience={audience}
          courseLabel={courseLabel}
          tutorLabel={tutorLabel}
          title={normalizeNotificationTitle(title)}
          attachmentName={attachment ? attachment.name : null}
          sending={sending}
          uncertainMessage={uncertainMessage}
          generalError={generalError}
          onBack={() => {
            setStep("form");
          }}
          onConfirm={handleConfirm}
        />
      ) : null}

      {step === "discard" ? (
        <div className="space-y-4">
          <p className="text-base text-texto-principal">
            Hay datos sin enviar. Si cerrás ahora se descartan.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setStep("form");
              }}
              className={SECONDARY_CLASSES}
            >
              Seguir editando
            </button>
            <button
              type="button"
              onClick={onClose}
              className={PRIMARY_CLASSES}
            >
              Descartar
            </button>
          </div>
        </div>
      ) : null}
    </CourseDialog>
  );
}
