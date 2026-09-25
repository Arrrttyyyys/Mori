import "server-only";

import { createHash, createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { createAdminServerClient } from "@/lib/supabase/server";

export type OperationalEvent = {
  eventName: "api_error" | "model_turn" | "demo_access" | "demo_reset";
  route: string;
  statusCode: number;
  latencyMs?: number;
  provider?: string;
  usedFallback?: boolean;
  malformedResponses?: number;
  identityMode?: "demo" | "supabase" | "anonymous";
  clientKeyHash?: string;
};

const memoryWindows = new Map<string, { count: number; expires: number }>();

function hashSecret() {
  return process.env.MORI_MONITORING_HASH_SALT || process.env.MORI_DEMO_COOKIE_SECRET || process.env.MORI_DEMO_ACCESS_CODE || "local-development";
}

export function clientKeyHash(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const source = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHmac("sha256", hashSecret()).update(source).digest("hex");
}

export async function recordOperationalEvent(event: OperationalEvent) {
  const safe = {
    event_name: event.eventName,
    route: event.route.slice(0, 160),
    status_code: event.statusCode,
    latency_ms: Math.max(0, Math.round(event.latencyMs ?? 0)),
    provider: event.provider?.slice(0, 40) ?? null,
    used_fallback: Boolean(event.usedFallback),
    malformed_responses: Math.max(0, event.malformedResponses ?? 0),
    identity_mode: event.identityMode ?? "anonymous",
    client_key_hash: event.clientKeyHash ?? null,
  };
  try {
    const { error } = await createAdminServerClient().from("operational_events").insert(safe);
    if (error) throw error;
  } catch {
    console.info("Mori operational event", safe);
  }
}

function localConsume(key: string, seconds: number, maximum: number) {
  const now = Date.now();
  const current = memoryWindows.get(key);
  const next = !current || current.expires <= now ? { count: 1, expires: now + seconds * 1000 } : { ...current, count: current.count + 1 };
  memoryWindows.set(key, next);
  return { allowed: next.count <= maximum, remaining: Math.max(0, maximum - next.count), retryAfter: Math.max(1, Math.ceil((next.expires - now) / 1000)) };
}

export async function consumeDemoQuota(request: NextRequest, action: "access" | "session" | "turn" | "reset") {
  const client = clientKeyHash(request);
  const policies = {
    access: { seconds: 900, maximum: 10, daily: 30 },
    session: { seconds: 3600, maximum: 8, daily: 20 },
    turn: { seconds: 60, maximum: 8, daily: Number(process.env.MORI_DEMO_DAILY_TURN_LIMIT || 60) },
    reset: { seconds: 3600, maximum: 4, daily: 8 },
  } as const;
  const policy = policies[action];
  try {
    const { data, error } = await createAdminServerClient().rpc("consume_mori_demo_quota", {
      p_client_key: client,
      p_action: action,
      p_window_seconds: policy.seconds,
      p_window_limit: policy.maximum,
      p_daily_limit: policy.daily,
    });
    if (error) throw error;
    const value = data as { allowed?: boolean; remaining?: number; retry_after?: number };
    return { allowed: Boolean(value.allowed), remaining: Number(value.remaining ?? 0), retryAfter: Number(value.retry_after ?? policy.seconds), clientKeyHash: client };
  } catch {
    const window = localConsume(`${client}:${action}`, policy.seconds, policy.maximum);
    const dailyBucket = new Date().toISOString().slice(0, 10);
    const daily = localConsume(`${client}:${action}:${dailyBucket}`, 86400, policy.daily);
    return { allowed: window.allowed && daily.allowed, remaining: Math.min(window.remaining, daily.remaining), retryAfter: window.allowed ? daily.retryAfter : window.retryAfter, clientKeyHash: client };
  }
}

export function anonymousSubjectHash(value: string) {
  return createHash("sha256").update(`${hashSecret()}:${value}`).digest("hex");
}
