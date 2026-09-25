import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminServerClient } from "@/lib/supabase/server";

function authorized(request: NextRequest) {
  const configured = process.env.MORI_OPERATIONS_TOKEN || "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const a = Buffer.from(configured); const b = Buffer.from(supplied);
  return Boolean(configured) && a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const admin = createAdminServerClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [events, resources] = await Promise.all([
    admin.from("operational_events").select("event_name,status_code,latency_ms,provider,used_fallback,malformed_responses,occurred_at").gte("occurred_at", since).order("occurred_at", { ascending: false }).limit(1000),
    admin.rpc("mori_resource_snapshot"),
  ]);
  if (events.error || resources.error) return NextResponse.json({ error: "Metrics unavailable" }, { status: 503 });
  const rows = events.data ?? [];
  const model = rows.filter((row) => row.event_name === "model_turn");
  const latencies = model.map((row) => Number(row.latency_ms)).sort((a, b) => a - b);
  return NextResponse.json({
    periodHours: 24,
    apiErrors: rows.filter((row) => row.status_code >= 500).length,
    modelTurns: model.length,
    fallbackCount: model.filter((row) => row.used_fallback).length,
    malformedResponses: model.reduce((sum, row) => sum + Number(row.malformed_responses || 0), 0),
    medianModelLatencyMs: latencies.length ? latencies[Math.floor(latencies.length / 2)] : null,
    p95ModelLatencyMs: latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] : null,
    resources: resources.data,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
