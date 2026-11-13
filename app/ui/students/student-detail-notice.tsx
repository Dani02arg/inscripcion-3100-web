"use client";

import { useCallback, useState } from "react";

import type { StudentNotice as StudentNoticeData } from "../../lib/students/types.ts";
import StudentNotice from "./student-notice.tsx";

interface StudentDetailNoticeProps {
  readonly initialNotice: StudentNoticeData | null;
}

/** Aviso de resultado del detalle; se cierra a los 4 s y retira el parámetro. */
export default function StudentDetailNotice({
  initialNotice,
}: StudentDetailNoticeProps) {
  const noticeKey = initialNotice
    ? `${initialNotice.kind}:${initialNotice.message}`
    : null;
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const notice =
    noticeKey !== null && dismissedKey !== noticeKey ? initialNotice : null;

  const handleClose = useCallback(() => {
    setDismissedKey(noticeKey);

    const params = new URLSearchParams(window.location.search);
    params.delete("created");
    params.delete("updated");
    const query = params.toString();
    const nextUrl =
      query.length > 0
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  }, [noticeKey]);

  if (!notice) {
    return null;
  }

  return (
    <StudentNotice
      key={`${notice.kind}-${notice.message}`}
      notice={notice}
      onClose={handleClose}
    />
  );
}
