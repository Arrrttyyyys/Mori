import "server-only";
import type { RequestIdentity } from "@/lib/auth/server-auth";
import { createAdminServerClient } from "@/lib/supabase/server";
const shared = globalThis as typeof globalThis & {
  moriSessionLeases?: Set<string>;
};
export async function claimSession(
  identity: RequestIdentity,
  sessionId: string,
): Promise<null | (() => Promise<void>)> {
  if (identity.mode === "demo") {
    const held = (shared.moriSessionLeases ??= new Set());
    if (held.has(sessionId)) return null;
    held.add(sessionId);
    return async () => {
      held.delete(sessionId);
    };
  }
  const admin = createAdminServerClient();
  const lease = crypto.randomUUID();
  const args = {
    patient: identity.userId,
    session_key: sessionId,
    lease_key: lease,
  };
  const { data, error } = await admin.rpc("claim_mori_session", args);
  if (error) throw error;
  if (!data) return null;
  return async () => {
    const { error } = await admin.rpc("release_mori_session", args);
    if (error)
      console.error(
        "Could not release session lease; it will expire automatically.",
      );
  };
}
