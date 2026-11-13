"use client";

import {
  useCallback,
  useEffect,
  useTransition,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import type {
  UserFilters,
  UserListState,
  UserNotice as UserNoticeData,
} from "../../lib/users/types.ts";
import type { UserRole } from "../../lib/auth/types.ts";
import type { UserSummary } from "../../lib/users/types.ts";
import { clearUserFilters } from "../../lib/users/list.ts";
import {
  serializeUserFilters,
  USERS_PATH,
} from "../../lib/users/users-url.ts";
import UserFiltersPanel from "./user-filters.tsx";
import UserNotice from "./user-notice.tsx";
import UserPagination from "./user-pagination.tsx";
import UserTable from "./user-table.tsx";
import UserRowActions from "./user-row-actions.tsx";
import ChangeRoleDialog from "./change-role-dialog.tsx";
import DeleteUserDialog from "./delete-user-dialog.tsx";
import { UserTableEmptyState } from "./user-table-states.tsx";
import UsersHeader from "./users-header.tsx";

type RenderableUserListState = Extract<
  UserListState,
  { status: "ready" | "empty" | "no_results" }
>;

interface UsersViewProps {
  readonly state: RenderableUserListState;
  readonly filters: UserFilters;
  readonly initialNotice: UserNoticeData | null;
  readonly role: UserRole;
  readonly currentUserId: string | null;
}

/** Coordina los filtros, la tabla, la paginación, la URL y los avisos. */
export default function UsersView({
  state,
  filters,
  initialNotice,
  role,
  currentUserId,
}: UsersViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState(initialNotice);
  const [changeRoleTarget, setChangeRoleTarget] =
    useState<UserSummary | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] =
    useState<UserSummary | null>(null);
  const page = state.page.page;
  const filtersKey = serializeUserFilters(filters, 1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("deleted");
    const query = serializeUserFilters(filters, page, params);
    const nextUrl = query.length > 0 ? `${USERS_PATH}?${query}` : USERS_PATH;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [filters, initialNotice, page]);

  const updateUrl = (nextFilters: UserFilters, nextPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.delete("deleted");
    const query = serializeUserFilters(nextFilters, nextPage, params);
    const nextUrl = query.length > 0 ? `${USERS_PATH}?${query}` : USERS_PATH;

    startTransition(() => {
      router.replace(nextUrl);
    });
  };

  const handleClearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const refreshList = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const handleActionSuccess = useCallback(
    (message: string) => {
      setNotice({ kind: "success", message });
      setChangeRoleTarget(null);
      setDeleteUserTarget(null);
      refreshList();
    },
    [refreshList],
  );

  const handleActionNotFound = useCallback(() => {
    refreshList();
  }, [refreshList]);

  return (
    <div
      aria-busy={isPending ? true : undefined}
      className="space-y-6"
    >
      <span role="status" aria-live="polite" className="sr-only">
        {isPending ? "Actualizando el padrón de usuarios." : ""}
      </span>
      <UsersHeader />

      {notice ? (
        <UserNotice
          key={`${notice.kind}-${notice.message}`}
          notice={notice}
          onClose={handleClearNotice}
        />
      ) : null}

      <UserFiltersPanel
        key={filtersKey}
        initialFilters={filters}
        isPending={isPending}
        onApply={(nextFilters) => updateUrl(nextFilters, 1)}
        onClear={() => updateUrl(clearUserFilters(), 1)}
      />

      {state.status === "empty" ? (
        <UserTableEmptyState
          kind="empty"
          isPending={isPending}
          onClearFilters={() => updateUrl(filters, 1)}
        />
      ) : state.status === "no_results" ? (
        <UserTableEmptyState
          kind="no_results"
          isPending={isPending}
          onClearFilters={() => updateUrl(clearUserFilters(), 1)}
        />
      ) : (
        <UserTable
          users={state.users}
          caption="Listado de usuarios del padrón"
          renderRowActions={(user) => (
            <UserRowActions
              user={user}
              role={role}
              currentUserId={currentUserId}
              onView={(selectedUser) =>
                router.push(
                  `/dashboard/users/${encodeURIComponent(selectedUser.id)}?from=users`,
                )
              }
              onChangeRole={setChangeRoleTarget}
              onDelete={setDeleteUserTarget}
            />
          )}
        />
      )}

      <UserPagination
        page={page}
        totalPages={state.page.totalPages}
        totalResults={state.page.total}
        isPending={isPending}
        onPageChange={(nextPage) => updateUrl(filters, nextPage)}
      />

      {changeRoleTarget ? (
        <ChangeRoleDialog
          user={changeRoleTarget}
          onClose={() => setChangeRoleTarget(null)}
          onSuccess={handleActionSuccess}
          onNotFound={handleActionNotFound}
        />
      ) : null}

      {deleteUserTarget ? (
        <DeleteUserDialog
          user={deleteUserTarget}
          onClose={() => setDeleteUserTarget(null)}
          onSuccess={handleActionSuccess}
          onNotFound={handleActionNotFound}
        />
      ) : null}
    </div>
  );
}
