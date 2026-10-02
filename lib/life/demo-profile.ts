import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { NextRequest, NextResponse } from "next/server";
import { defaultProfile, type LifeProfile } from "./types";

export const DEMO_PROFILE_COOKIE = "mori_demo_profile";

// Fictional demo settings travel with the browser instead of a single worker.
// This cookie conveys profile input only; it never grants access.
export function encodeDemoProfile(profile: LifeProfile): string {
  const encoded = deflateRawSync(Buffer.from(JSON.stringify(profile))).toString("base64url");
  if (encoded.length > 3500) throw new Error("Demo profile is too large. Please shorten the profile details.");
  return encoded;
}

export function readDemoProfile(request: NextRequest): LifeProfile | undefined {
  const value = request.cookies.get(DEMO_PROFILE_COOKIE)?.value;
  if (!value || value.length > 3500) return undefined;
  try {
    const input = JSON.parse(inflateRawSync(Buffer.from(value, "base64url"), { maxOutputLength: 40000 }).toString());
    if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
    const profile = { ...defaultProfile };
    for (const key of Object.keys(profile) as (keyof LifeProfile)[]) {
      if (key === "sessionMinutes") profile[key] = Math.min(20, Math.max(3, Number(input[key]) || 15));
      else if (typeof defaultProfile[key] === "boolean") (profile as any)[key] = input[key] === true;
      else (profile as any)[key] = String(input[key] ?? "").trim().slice(0, 2000);
    }
    return profile;
  } catch { return undefined; }
}

export function setDemoProfileCookie(response: NextResponse, value: string) {
  response.cookies.set(DEMO_PROFILE_COOKIE, value, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/",
  });
}

export function clearDemoProfileCookie(response: NextResponse) {
  response.cookies.set(DEMO_PROFILE_COOKIE, "", {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0,
  });
}
