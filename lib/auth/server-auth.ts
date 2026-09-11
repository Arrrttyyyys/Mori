import "server-only";

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PILOT_DEMO_ACCOUNT } from "@/lib/demo-account";
import { createUserServerClient } from "@/lib/supabase/server";

export type RequestIdentity =
  | {
      mode: "demo";
      userId: typeof PILOT_DEMO_ACCOUNT.userId;
      actorId: "demo_supervisor";
    }
  | {
      mode: "supabase";
      userId: string;
      actorId: string;
      client: SupabaseClient;
      workspaceRole?: "viewer" | "contributor" | "caregiver";
    };

export class AuthError extends Error {
  constructor(
    public status: 401 | 403 | 503,
    message: string,
  ) {
    super(message);
  }
}

export async function requireRequestIdentity(
  request: NextRequest,
  requestedUserId?: string,
): Promise<RequestIdentity> {
  if (request.headers.get("x-mori-demo-mode") === "true") {
    if (requestedUserId && requestedUserId !== PILOT_DEMO_ACCOUNT.userId) {
      throw new AuthError(
        403,
        "Demo mode is limited to the fictional demo account",
      );
    }
    return {
      mode: "demo",
      userId: PILOT_DEMO_ACCOUNT.userId,
      actorId: "demo_supervisor",
    };
  }

  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new AuthError(401, "Authentication required");

  let client: SupabaseClient;
  try {
    client = createUserServerClient(match[1]);
  } catch {
    throw new AuthError(503, "Authentication service is not configured");
  }
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new AuthError(401, "Invalid or expired session");
  const workspacePath = /^\/api\/(life|insights|therapy|user|memory-context)(?:\/|$)/.test(
    request.nextUrl.pathname,
  );
  const target =
    requestedUserId ||
    (workspacePath ? request.headers.get("x-mori-patient-id") : null) ||
    data.user.id;
  // requestedUserId !== data.user.id requires an explicit active family grant.
  if (target !== data.user.id) {
    const { data: membership, error: membershipError } = await client
      .from("family_memberships")
      .select("role")
      .eq("owner_id", target)
      .eq("member_id", data.user.id)
      .eq("active", true)
      .maybeSingle();
    if (membershipError || !membership)
      throw new AuthError(
        403,
        "You do not have access to this family workspace",
      );
    const {data:sharingAllowed,error:sharingError}=await client.rpc('family_access',{patient:target,write_access:false});
    if(sharingError||!sharingAllowed)throw new AuthError(403,'Sharing is not enabled for this family workspace.');
    const path = request.nextUrl.pathname;
    if (
      path.includes("/data-requests") ||
      path.includes("/reviews") ||
      path.startsWith("/api/pilot")
    )
      throw new AuthError(
        403,
        "This action requires the account owner or a pilot role",
      );
    const read = request.method === "GET" && !path.endsWith("/therapy/session");
    const contribution =
      membership.role === "contributor" &&
      request.method === "POST" &&
      (path === "/api/life" || /\/memories$/.test(path));
    if (!read && !contribution && membership.role !== "caregiver")
      throw new AuthError(403, "Your family role does not allow this action");
    return {
      mode: "supabase",
      userId: target,
      actorId: data.user.id,
      client,
      workspaceRole: membership.role,
    };
  }
  return {
    mode: "supabase",
    userId: data.user.id,
    actorId: data.user.id,
    client,
  };
}

export function authErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof AuthError)) return null;
  return NextResponse.json({ error: error.message }, { status: error.status });
}

export async function requirePatientRole(
  identity: RequestIdentity,
  patientId: string,
  allowedRoles: Array<
    "caregiver" | "supervisor" | "clinician" | "administrator"
  > = [],
): Promise<void> {
  if (identity.mode === "demo") {
    if (patientId !== identity.userId)
      throw new AuthError(403, "Demo account mismatch");
    return;
  }
  if (identity.actorId === patientId && allowedRoles.length === 0) return;
  const { data, error } = await identity.client
    .from("pilot_memberships")
    .select("role")
    .eq("patient_id", patientId)
    .eq("member_id", identity.actorId)
    .eq("active", true);
  if (error) throw error;
  const readRoles = allowedRoles.length
    ? allowedRoles
    : ["caregiver", "supervisor", "clinician", "administrator"];
  if (!(data ?? []).some((membership) => readRoles.includes(membership.role))) {
    throw new AuthError(403, "Required pilot role not granted");
  }
}
