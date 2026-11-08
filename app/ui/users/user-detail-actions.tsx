"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { UserRole } from "../../lib/auth/types.ts";
import {
  getUserDetailActionAvailability,
  isOwnAccount,
} from "../../lib/users/rules.ts";
import type { UserDetail, UserOrigin } from "../../lib/users/types.ts";
import ChangeRoleDialog from "./change-role-dialog.tsx";
import DeleteUserDialog from "./delete-user-dialog.tsx";
import UserNotice from "./user-notice.tsx";

interface UserDetailActionsProps {
  readonly user: UserDetail;
  readonly viewerRole: UserRole;
  readonly currentUserId: string | null;
  readonly origin: UserOrigin;
}

const ACTION_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app disabled:cursor-not-allowed disabled:opacity-60";

/** Coordina las acciones administrativas y sus diálogos en el detalle. */
export default function UserDetailActions({
  user,
  viewerRole,
  currentUserId,
  origin,
}: UserDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const isSelf = isOwnAccount(user.id, currentUserId);
  const targetVerified =
    typeof user.emailVerifiedAt === "string" &&
    user.emailVerifiedAt.trim().length > 0;
  const availability = getUserDetailActionAvailability(
    viewerRole,
    isSelf,
    targetVerified,
  );

  const refreshDetail = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const handleActionSuccess = useCallback(
    (message: string) => {
      setChangeRoleOpen(false);
      setDeleteUserOpen(false);
      setNotice(message);
      refreshDetail();
    },
    [refreshDetail],
  );

  const handleNotFound = useCallback(() => {
    refreshDetail();
  }, [refreshDetail]);

  if (!availability) {
    return null;
  }

  const changeRoleDescriptionId = "user-detail-change-role-disabled";
  const deleteDescriptionId = "user-detail-delete-disabled";

  return (
    <section
      aria-labelledby="user-detail-actions-title"
      aria-busy={isPending ? true : undefined}
      className="space-y-4 rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
    >
      <h2
        id="user-detail-actions-title"
        className="text-lg font-bold text-texto-principal"
      >
        Acciones
      </h2>

      {notice ? (
        <UserNotice
          notice={{ kind: "success", message: notice }}
          onClose={() => setNotice(null)}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <div className="space-y-1">
          <button
            type="button"
            disabled={
              isPending || availability.changeRoleDisabledReason !== null
            }
            aria-describedby={
              availability.changeRoleDisabledReason
                ? changeRoleDescriptionId
                : undefined
            }
            onClick={() => setChangeRoleOpen(true)}
            className={`${ACTION_CLASSES} bg-azul-institucional text-superficie hover:opacity-90`}
          >
            Cambiar rol
          </button>
          {availability.changeRoleDisabledReason ? (
            <p
              id={changeRoleDescriptionId}
              className="max-w-xs text-sm text-texto-secundario"
            >
              {availability.changeRoleDisabledReason}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            disabled={isPending || availability.deleteDisabledReason !== null}
            aria-describedby={
              availability.deleteDisabledReason
                ? deleteDescriptionId
                : undefined
            }
            onClick={() => setDeleteUserOpen(true)}
            className={`${ACTION_CLASSES} bg-estado-rechazado text-superficie hover:opacity-90`}
          >
            Dar de baja
          </button>
          {availability.deleteDisabledReason ? (
            <p
              id={deleteDescriptionId}
              className="max-w-xs text-sm text-texto-secundario"
            >
              {availability.deleteDisabledReason}
            </p>
          ) : null}
        </div>
      </div>

      {changeRoleOpen ? (
        <ChangeRoleDialog
          user={user}
          targetVerified={targetVerified}
          onClose={() => setChangeRoleOpen(false)}
          onSuccess={handleActionSuccess}
          onNotFound={handleNotFound}
        />
      ) : null}

      {deleteUserOpen ? (
        <DeleteUserDialog
          user={user}
          origin={origin}
          onClose={() => setDeleteUserOpen(false)}
          onSuccess={handleActionSuccess}
          onNotFound={handleNotFound}
        />
      ) : null}
    </section>
  );
}
