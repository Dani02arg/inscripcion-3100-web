import type { Course } from "../courses/types.ts";
import type { UserSummary } from "../users/types.ts";

/** Filtros de la bandeja. */
export const NOTIFICATION_FILTERS = ["all", "unread"] as const;

export type NotificationFilter = (typeof NOTIFICATION_FILTERS)[number];

/** Audiencias admitidas por el servicio. */
export const NOTIFICATION_AUDIENCES = [
  "individual",
  "course",
  "allTutors",
] as const;

export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

/** Campos que el servicio puede señalar en un `422`. */
export const NOTIFICATION_FIELDS = [
  "title",
  "content",
  "recipientId",
  "courseId",
  "attachment",
  "recipients",
] as const;

export type NotificationField = (typeof NOTIFICATION_FIELDS)[number];

export type NotificationFieldErrors = Partial<
  Record<NotificationField, string>
>;

export interface NotificationItem {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly isRead: boolean;
  readonly readAt: string | null;
  readonly hasAttachment: boolean;
  readonly attachmentUrl: string | null;
  readonly sentAt: string;
}

export type NotificationFailureKind =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "too_large"
  | "server"
  | "uncertain";

export interface NotificationFailure {
  readonly ok: false;
  readonly kind: NotificationFailureKind;
  readonly status: number | null;
  readonly message: string;
  readonly fieldErrors?: NotificationFieldErrors;
}

export interface NotificationListSuccess {
  readonly ok: true;
  readonly notifications: readonly NotificationItem[];
  readonly message: string;
}

export type NotificationListResult =
  | NotificationListSuccess
  | NotificationFailure;

export interface NotificationReadSuccess {
  readonly ok: true;
  readonly notification: NotificationItem;
  readonly message: string;
}

export type NotificationReadResult =
  | NotificationReadSuccess
  | NotificationFailure;

export interface NotificationAttachmentSuccess {
  readonly ok: true;
  readonly base64: string;
  readonly filename: string;
  readonly contentType: string;
}

export type NotificationAttachmentResult =
  | NotificationAttachmentSuccess
  | NotificationFailure;

export interface NotificationSendInput {
  readonly audience: NotificationAudience;
  readonly title: string;
  readonly content: string;
  readonly recipientId?: string;
  readonly courseId?: string;
  readonly attachment?: File | null;
}

export interface NotificationSendSuccess {
  readonly ok: true;
  readonly id: string | null;
  readonly message: string;
}

export type NotificationSendResult =
  | NotificationSendSuccess
  | NotificationFailure;

export interface TutorDirectorySuccess {
  readonly ok: true;
  readonly users: readonly UserSummary[];
  readonly message: string;
}

export interface TutorDirectoryFailure {
  readonly ok: false;
  readonly kind: "unauthorized" | "forbidden" | "failed";
  readonly status: number | null;
  readonly message: string;
}

export type TutorDirectoryResult =
  | TutorDirectorySuccess
  | TutorDirectoryFailure;

export interface CourseOptionsSuccess {
  readonly ok: true;
  readonly courses: readonly Course[];
  readonly message: string;
}

export type CourseOptionsResult = CourseOptionsSuccess | NotificationFailure;

export interface NotificationNotice {
  readonly kind: "success" | "error" | "info";
  readonly message: string;
}

export interface NotificationDraft {
  readonly audience: NotificationAudience | null;
  readonly courseId: string | null;
  readonly recipient: UserSummary | null;
  readonly title: string;
  readonly content: string;
  readonly attachment: File | null;
}

export type NotificationBadgeCount = number | null;

export type SendNotificationState =
  | { readonly status: "idle" }
  | { readonly status: "success"; readonly message: string }
  | {
      readonly status: "validation";
      readonly message: string;
      readonly fieldErrors: NotificationFieldErrors;
    }
  | {
      readonly status: "forbidden";
      readonly message: string;
    }
  | {
      readonly status: "not_found";
      readonly message: string;
    }
  | {
      readonly status: "too_large";
      readonly message: string;
    }
  | {
      readonly status: "uncertain";
      readonly message: string;
    }
  | {
      readonly status: "error";
      readonly message: string;
    };

export type ReadNotificationState =
  | { readonly status: "success"; readonly notification: NotificationItem }
  | { readonly status: "unavailable"; readonly message: string }
  | { readonly status: "error"; readonly message: string };

export type DownloadNotificationState =
  | {
      readonly status: "success";
      readonly base64: string;
      readonly filename: string;
      readonly contentType: string;
    }
  | {
      readonly status: "unavailable" | "error" | "expired";
      readonly message: string;
    };

export interface NotificationActionDependencies<TResult> {
  readonly getAccess: () => Promise<
    | { readonly status: "ok"; readonly token: string }
    | {
        readonly status: "forbidden";
        readonly message: string;
        readonly kind: "forbidden" | "unauthorized";
      }
  >;
  readonly callApi: (token: string) => Promise<TResult>;
  readonly revalidatePath?: (path: string) => void;
}
