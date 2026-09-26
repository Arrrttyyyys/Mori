import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { setAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: "Request origin could not be verified" },
      { status: 403 },
    );
  }
  const body = await request.json().catch(() => ({}));
  if (
    typeof body.accessToken !== "string" ||
    typeof body.refreshToken !== "string"
  ) {
    return NextResponse.json(
      { error: "The confirmation link is incomplete or has expired." },
      { status: 400 },
    );
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "Authentication is not configured" },
      { status: 503 },
    );
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.setSession({
    access_token: body.accessToken,
    refresh_token: body.refreshToken,
  });
  if (error || !data.session || !data.user) {
    return NextResponse.json(
      { error: "This confirmation link is invalid or has expired." },
      { status: 401 },
    );
  }
  const response = NextResponse.json({ user: data.user });
  setAuthCookies(response, data.session);
  return response;
}
