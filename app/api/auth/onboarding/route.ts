import { NextRequest, NextResponse } from "next/server";
import {
  authErrorResponse,
  requireRequestIdentity,
} from "@/lib/auth/server-auth";
import { isAccountRelationship } from "@/lib/auth/account-role";
import { createAdminServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const identity = await requireRequestIdentity(request);
    if (identity.mode !== "supabase") {
      return NextResponse.json(
        { error: "The guided demo does not require account onboarding." },
        { status: 400 },
      );
    }
    const body = await request.json().catch(() => ({}));
    if (!isAccountRelationship(body.relationship)) {
      return NextResponse.json(
        { error: "Choose how you plan to use Mori." },
        { status: 400 },
      );
    }
    const { data, error } = await createAdminServerClient().auth.admin.updateUserById(
      identity.userId,
      { user_metadata: { relationship_to_mori: body.relationship } },
    );
    if (error || !data.user) throw error || new Error("Could not save");
    return NextResponse.json({ user: data.user });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: "We could not save that choice. Please try again." },
        { status: 500 },
      )
    );
  }
}
