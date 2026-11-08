"use client";

import { useState } from "react";

import type { CourseNotice as CourseNoticeData } from "../../lib/courses/types.ts";
import CourseNotice from "./course-notice.tsx";

interface CourseDetailNoticeProps {
  message: string;
}

/** Aviso de actualización del detalle; al cerrar elimina el parámetro de la URL. */
export default function CourseDetailNotice({
  message,
}: CourseDetailNoticeProps) {
  const [notice, setNotice] = useState<CourseNoticeData | null>({
    kind: "success",
    message,
  });

  if (!notice) {
    return null;
  }

  const handleClose = () => {
    setNotice(null);

    const params = new URLSearchParams(window.location.search);
    params.delete("updated");
    const query = params.toString();
    const nextUrl =
      query.length > 0
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  };

  return <CourseNotice notice={notice} onClose={handleClose} />;
}
