import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const DEMO_ACCESS_COOKIE = "mori_demo_access";
const MAX_AGE_SECONDS = 60 * 60 * 4;

function secret() {
  return process.env.MORI_DEMO_COOKIE_SECRET || process.env.MORI_DEMO_ACCESS_CODE || "";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function demoIsConfigured() {
  return process.env.NODE_ENV !== "production" || Boolean(process.env.MORI_DEMO_ACCESS_CODE && secret());
}

export function verifyDemoCode(input: string) {
  if (!demoIsConfigured()) return false;
  if (process.env.NODE_ENV !== "production" && !process.env.MORI_DEMO_ACCESS_CODE) return true;
  const expected = Buffer.from(process.env.MORI_DEMO_ACCESS_CODE || "");
  const actual = Buffer.from(input);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function setDemoAccessCookie(response: NextResponse) {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `${expires}.${crypto.randomUUID()}`;
  response.cookies.set(DEMO_ACCESS_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearDemoAccessCookie(response: NextResponse) {
  response.cookies.set(DEMO_ACCESS_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export function hasValidDemoAccess(request: NextRequest) {
  const value = request.cookies.get(DEMO_ACCESS_COOKIE)?.value;
  if (!value || !secret()) return process.env.NODE_ENV !== "production" && !process.env.MORI_DEMO_ACCESS_CODE;
  const parts = value.split(".");
  if (parts.length !== 3 || Number(parts[0]) <= Math.floor(Date.now() / 1000)) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(parts[2]);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
