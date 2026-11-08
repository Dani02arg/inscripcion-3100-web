"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME } from "../auth/session-cookie.ts";
import { notifyLogout } from "../api/logout.ts";

/** Cierra la sesión: borra la cookie, notifica al endpoint y redirige. */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  cookieStore.delete(SESSION_COOKIE_NAME);

  if (token) {
    await notifyLogout(token);
  }

  redirect("/login");
}
