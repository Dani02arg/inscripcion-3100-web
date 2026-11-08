import { cookies } from "next/headers";

import {
  SIDEBAR_COLLAPSE_COOKIE_NAME,
  parseCollapsePreference,
} from "./collapse-preference.ts";

/** Lee la preferencia de colapso en el servidor; sin cookie, expandido. */
export async function getCollapsedPreference(): Promise<boolean> {
  const cookieStore = await cookies();

  return parseCollapsePreference(
    cookieStore.get(SIDEBAR_COLLAPSE_COOKIE_NAME)?.value,
  );
}
