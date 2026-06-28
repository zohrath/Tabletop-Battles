import { createInternalNeonAuth } from "@neondatabase/neon-js/auth";

const neonAuthUrl = (import.meta.env.VITE_NEON_AUTH_URL ??
  import.meta.env.VITE_STORAGE_TABLETOP_NEON_AUTH_BASE_URL) as
  | string
  | undefined;

export const neonAuthEnabled = Boolean(neonAuthUrl);
export const neonAuth = neonAuthUrl ? createInternalNeonAuth(neonAuthUrl) : null;
export const neonAuthClient = neonAuth?.adapter ?? null;

export async function getNeonAuthToken() {
  return (await neonAuth?.getJWTToken()) ?? "";
}
