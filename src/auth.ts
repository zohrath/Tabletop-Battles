import { createAuthClient } from "@neondatabase/neon-js/auth";

const neonAuthUrl = (import.meta.env.VITE_NEON_AUTH_URL ??
  import.meta.env.VITE_STORAGE_TABLETOP_NEON_AUTH_BASE_URL) as
  | string
  | undefined;

export const neonAuthEnabled = Boolean(neonAuthUrl);
export const neonAuthClient = neonAuthUrl ? createAuthClient(neonAuthUrl) : null;
