"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import type { UserRole } from "../../lib/auth/types.ts";
import {
  filterDirectoryUsers,
  getDefaultDirectoryFilters,
  hasActiveDirectoryFilters,
  paginateUserList,
} from "../../lib/users/list.ts";
import type {
  UserNotice as UserNoticeData,
  UserSummary,
} from "../../lib/users/types.ts";
import UserNotice from "./user-notice.tsx";
import UserRowActions from "./user-row-actions.tsx";
import DirectoryFiltersPanel from "./directory-filters.tsx";
import UserPagination from "./user-pagination.tsx";
import UserTable from "./user-table.tsx";
import { UserTableEmptyState } from "./user-table-states.tsx";
import ChangeRoleDialog from "./change-role-dialog.tsx";
import DeleteUserDialog from "./delete-user-dialog.tsx";

interface DirectoryViewProps {
  readonly users: readonly UserSummary[];
  readonly role: UserRole;
  readonly currentUserId: string | null;
  readonly initialNotice?: UserNoticeData | null;
}

/** Aplica los filtros al conjunto completo recibido de la ruta del servidor. */
export default function DirectoryView({
  users,
  role,
  currentUserId,
  initialNotice = null,
}: DirectoryViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState(getDefaultDirectoryFilters);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(
    initialNotice?.message ?? null,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (!params.has("deleted")) {
      return;
    }

    params.delete("deleted");
    const query = params.toString();
    const nextUrl =
      query.length > 0
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, []);
  const [changeRoleTarget, setChangeRoleTarget] =
    useState<UserSummary | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] =
    useState<UserSummary | null>(null);
  const filteredUsers = useMemo(
    () => filterDirectoryUsers(users, filters),
    [filters, users],
  );
  const pageData = paginateUserList(filteredUsers, page);
  const activeFilters = hasActiveDirectoryFilters(filters);
  const clearFilters = () => {
    setFilters(getDefaultDirectoryFilters());
    setPage(1);
  };
  const refreshDirectory = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);
  const handleActionSuccess = useCallback(
    (message: string) => {
      setChangeRoleTarget(null);
      setDeleteUserTarget(null);
      setNotice(message);
      refreshDirectory();
    },
    [refreshDirectory],
  );
  const handleNotFound = useCallback(() => {
    refreshDirectory();
  }, [refreshDirectory]);

  return (
    <div
      aria-busy={isPending ? true : undefined}
      className="space-y-6"
    >
      <span role="status" aria-live="polite" className="sr-only">
        {isPending ? "Actualizando el directorio de staff." : ""}
      </span>

      {notice ? (
        <UserNotice
          key={notice}
          notice={{ kind: "success", message: notice }}
          onClose={() => setNotice(null)}
        />
      ) : null}

      <DirectoryFiltersPanel
        key={JSON.stringify(filters)}
        initialFilters={filters}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setPage(1);
        }}
        onClear={clearFilters}
      />

      {pageData.total === 0 ? (
        <UserTableEmptyState
          kind={activeFilters ? "no_results" : "empty"}
          onClearFilters={clearFilters}
          isPending={isPending}
          listName="directorio"
        />
      ) : (
        <UserTable
          users={pageData.items}
          caption="Directorio de staff"
          id="staff-results"
          renderRowActions={(user) => (
            <UserRowActions
              user={user}
              role={role}
              currentUserId={currentUserId}
              onView={(selectedUser) =>
                router.push(
                  `/dashboard/users/${encodeURIComponent(selectedUser.id)}?from=staff`,
                )
              }
              onChangeRole={setChangeRoleTarget}
              onDelete={setDeleteUserTarget}
            />
          )}
        />
      )}

      <UserPagination
        page={pageData.page}
        totalPages={pageData.totalPages}
        totalResults={pageData.total}
        isPending={isPending}
        onPageChange={setPage}
        label="Paginación del directorio de staff"
      />

      {changeRoleTarget ? (
        <ChangeRoleDialog
          user={changeRoleTarget}
          onClose={() => setChangeRoleTarget(null)}
          onSuccess={handleActionSuccess}
          onNotFound={handleNotFound}
        />
      ) : null}

      {deleteUserTarget ? (
        <DeleteUserDialog
          user={deleteUserTarget}
          onClose={() => setDeleteUserTarget(null)}
          onSuccess={handleActionSuccess}
          onNotFound={handleNotFound}
        />
      ) : null}
    </div>
  );
}
