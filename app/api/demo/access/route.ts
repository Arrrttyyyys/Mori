import { NextRequest, NextResponse } from "next/server";
import { clearDemoAccessCookie, demoIsConfigured, hasValidDemoAccess, setDemoAccessCookie, verifyDemoCode } from "@/lib/operations/demo-access";
import { consumeDemoQuota, recordOperationalEvent } from "@/lib/operations/monitoring";

export async function GET(request: NextRequest) {
  return NextResponse.json({ enabled: demoIsConfigured(), authorized: hasValidDemoAccess(request) });
}

export async function POST(request: NextRequest) {
  const quota = await consumeDemoQuota(request, "access");
  if (!quota.allowed) return NextResponse.json({ error: "Too many demo access attempts. Please try again later." }, { status: 429, headers: { "Retry-After": String(quota.retryAfter) } });
  const body = await request.json().catch(() => ({}));
  if (!verifyDemoCode(typeof body.code === "string" ? body.code : "")) {
    await recordOperationalEvent({ eventName: "demo_access", route: "/api/demo/access", statusCode: 403, identityMode: "anonymous", clientKeyHash: quota.clientKeyHash });
    return NextResponse.json({ error: "The demo access code is not valid." }, { status: 403 });
  }
  const response = NextResponse.json({ authorized: true });
  setDemoAccessCookie(response);
  await recordOperationalEvent({ eventName: "demo_access", route: "/api/demo/access", statusCode: 200, identityMode: "anonymous", clientKeyHash: quota.clientKeyHash });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authorized: false });
  clearDemoAccessCookie(response);
  return response;
}
