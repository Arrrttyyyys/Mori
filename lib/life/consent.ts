import "server-only";
import { AuthError, RequestIdentity } from "@/lib/auth/server-auth";
import { loadLife } from "./store";
import { createAdminServerClient } from "@/lib/supabase/server";
export async function requireSessionConsent(identity: RequestIdentity) {
  if (identity.mode === "demo") return;
  const { profile } = await loadLife(identity);
  if (!profile.sessionConsent || !profile.transcriptAllowed)
    throw new AuthError(
      403,
      "Please review session permission and transcript storage in the Profile before beginning.",
    );
  const { data, error } = await createAdminServerClient()
    .from("pilot_consents")
    .select("*")
    .eq("patient_id", identity.userId)
    .maybeSingle();
  if (error) throw error;
  if (
    data &&
    (data.current_assent !== "granted" ||
      (data.patient_consent !== "granted" &&
        data.representative_consent !== "granted") ||
      !data.transcript_allowed ||
      (data.expires_at && Date.parse(data.expires_at) <= Date.now()))
  )
    throw new AuthError(
      403,
      "The pilot consent or current assent needs review before continuing.",
    );
}
