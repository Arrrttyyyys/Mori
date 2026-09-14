import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import {
  requireRequestIdentity,
  authErrorResponse,
} from "@/lib/auth/server-auth";
import { createAdminServerClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  try {
    const identity = await requireRequestIdentity(request);
    if (identity.mode === "demo")
      return NextResponse.json({
        workspaces: [
          {
            id: "demo_patient",
            name: "Margaret (fictional demo)",
            role: "owner",
          },
        ],
        members: [],
      });
    const { data: members, error } = await identity.client
      .from("family_memberships")
      .select("*")
      .or(`owner_id.eq.${identity.actorId},member_id.eq.${identity.actorId}`)
      .eq("active", true);
    if (error) throw error;
    const ids = [
      identity.actorId,
      ...(members ?? [])
        .filter((m) => m.member_id === identity.actorId)
        .map((m) => m.owner_id),
    ];
    const { data: profiles, error: profileError } = await identity.client
      .from("patient_profiles")
      .select("owner_id,preferred_name")
      .in("owner_id", ids);
    if (profileError) throw profileError;
    return NextResponse.json({
      workspaces: ids.map((id) => ({
        id,
        name:
          profiles?.find((p) => p.owner_id === id)?.preferred_name ||
          (id === identity.actorId
            ? "My family workspace"
            : "Shared family workspace"),
        role:
          id === identity.actorId
            ? "owner"
            : members?.find((m) => m.owner_id === id)?.role,
      })),
      members: (members ?? [])
        .filter((m) => m.owner_id === identity.actorId)
        .map((m) => ({ id: m.member_id, role: m.role })),
    });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: "Could not load family access" },
        { status: 500 },
      )
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const identity = await requireRequestIdentity(request);
    const body = await request.json();
    if (identity.mode === "demo")
      return NextResponse.json(
        { error: "Family invitations need a signed-in account." },
        { status: 400 },
      );
    const admin = createAdminServerClient();
    if (body.action === "invite") {
      if (!["viewer", "contributor", "caregiver"].includes(body.role))
        return NextResponse.json(
          { error: "Choose a valid role" },
          { status: 400 },
        );
      const token = randomBytes(24).toString("hex");
      const { error } = await admin
        .from("family_invitations")
        .insert({
          owner_id: identity.actorId,
          role: body.role,
          token_hash: createHash("sha256").update(token).digest("hex"),
        });
      if (error) throw error;
      return NextResponse.json({ code: token, expires: "7 days" });
    }
    if (body.action === "accept") {
      if (
        typeof body.code !== "string" ||
        !/^[a-f0-9]{48}$/.test(body.code.trim())
      )
        return NextResponse.json(
          { error: "Enter a valid invitation code" },
          { status: 400 },
        );
      const { data, error } = await admin.rpc("accept_family_invitation", {
        invitation_hash: createHash("sha256")
          .update(body.code.trim())
          .digest("hex"),
        member: identity.actorId,
      });
      if (error)
        return NextResponse.json(
          { error: "This invitation has expired or was already used." },
          { status: 400 },
        );
      return NextResponse.json({ ownerId: data });
    }
    if (body.action === "revoke") {
      const { error } = await identity.client
        .from("family_memberships")
        .update({ active: false })
        .eq("owner_id", identity.actorId)
        .eq("member_id", body.memberId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (body.action === "withdraw-sharing") {
      const [memberships, invitations, consent] = await Promise.all([
        admin.from("family_memberships").update({ active: false }).eq("owner_id", identity.actorId),
        admin.from("family_invitations").delete().eq("owner_id", identity.actorId),
        admin.from("pilot_consents").upsert({ patient_id: identity.actorId, caregiver_sharing_allowed: false }, { onConflict: "patient_id" }),
      ]);
      const failure = memberships.error || invitations.error || consent.error;
      if (failure) throw failure;
      await admin.from("audit_events").insert({
        patient_id: identity.actorId,
        actor_id: identity.actorId,
        action: "sharing.withdrawn",
        resource_type: "family_workspace",
        metadata: {},
      });
      return NextResponse.json({ ok: true, sharing: false });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: "Could not update family access" },
        { status: 500 },
      )
    );
  }
}
