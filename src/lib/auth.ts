import { createInternalNeonAuth } from "@neondatabase/neon-js/auth";

const neonAuthUrl = (import.meta.env.VITE_NEON_AUTH_URL ??
  import.meta.env.VITE_STORAGE_TABLETOP_NEON_AUTH_BASE_URL) as
  | string
  | undefined;

export const neonAuthEnabled = Boolean(neonAuthUrl);
export const neonAuth = neonAuthUrl ? createInternalNeonAuth(neonAuthUrl) : null;
export const authClient = neonAuth?.adapter ?? null;
export const neonAuthClient = authClient;

console.info("[auth] Neon Auth config", {
  authClientCreated: Boolean(authClient),
  enabled: neonAuthEnabled,
  host: getAuthHost(neonAuthUrl),
});

export async function getNeonAuthToken() {
  const token = (await neonAuth?.getJWTToken()) ?? "";

  console.info("[auth] Neon JWT lookup", {
    present: Boolean(token),
  });

  return token;
}

function getAuthHost(url: string | undefined) {
  if (!url) {
    return "";
  }

  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}
