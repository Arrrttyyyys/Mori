import { NextRequest, NextResponse } from "next/server";
import {
  authErrorResponse,
  requireRequestIdentity,
} from "@/lib/auth/server-auth";
import { loadLife, saveProfile, saveRecord, demoLife } from "@/lib/life/store";
import { defaultProfile, LifeProfile, LifeRecord } from "@/lib/life/types";
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      await loadLife(await requireRequestIdentity(request)),
    );
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        {
          error:
            "Could not load life information. Check the connected-life migration.",
        },
        { status: 500 },
      )
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const identity = await requireRequestIdentity(request);
    const body = await request.json();
    if (
      identity.mode === "supabase" &&
      identity.workspaceRole === "contributor" &&
      !(
        body.action === "record" &&
        !body.record?.id &&
        ["note", "story"].includes(body.record?.kind)
      )
    )
      return NextResponse.json(
        { error: "Contributors can add new notes and unverified stories." },
        { status: 403 },
      );
    if (body.action === "profile") {
      const profile = { ...defaultProfile };
      for (const key of Object.keys(profile) as (keyof LifeProfile)[]) {
        if (key === "sessionMinutes") {
          profile[key] = Math.min(
            20,
            Math.max(3, Number(body.profile?.[key]) || 15),
          );
        } else if (
          key === "sessionConsent" ||
          key === "photosAllowed" ||
          key === "audioAllowed" ||
          key === "transcriptAllowed"
        ) {
          profile[key] = (body.profile?.[key] ?? defaultProfile[key]) === true;
        } else {
          profile[key] = String(body.profile?.[key] ?? "")
            .trim()
            .slice(0, 2000);
        }
      }
      await saveProfile(identity, profile);
    } else if (body.action === "record") {
      const input = body.record;
      if (
        !input ||
        !["person", "album", "note", "story", "plan"].includes(input.kind)
      )
        return NextResponse.json(
          { error: "Choose a valid record type" },
          { status: 400 },
        );
      const life = await loadLife(identity);
      const existing = input.id
        ? life.records.find((x) => x.id === input.id)
        : null;
      if (input.id && !existing)
        return NextResponse.json(
          { error: "Record not found" },
          { status: 404 },
        );
      const data: LifeRecord["data"] = {};
      for (const key of [
        "name",
        "relationship",
        "aliases",
        "description",
        "text",
        "expiresAt",
      ] as const)
        if (typeof input.data?.[key] === "string")
          data[key] = input.data[key].trim().slice(0, 4000);
      if (!data.name && !data.text)
        return NextResponse.json(
          { error: "A name or story is required" },
          { status: 400 },
        );
      if (data.expiresAt && !Number.isFinite(Date.parse(data.expiresAt)))
        return NextResponse.json(
          { error: "Choose a valid expiry date" },
          { status: 400 },
        );
      if (input.kind === "story") {
        data.status = ["confirmed", "dismissed", "unverified"].includes(
          input.data?.status,
        )
          ? input.data.status
          : "unverified";
        data.source = existing?.data.source ?? "family provided";
        data.sessionId = existing?.data.sessionId;
        data.memoryId = existing?.data.memoryId;
      }
      if (
        identity.mode === "supabase" &&
        identity.workspaceRole === "contributor" &&
        input.kind === "story"
      )
        data.status = "unverified";
      if (input.kind === "plan") {
        if (!Number.isFinite(Date.parse(input.data?.scheduledFor)))
          return NextResponse.json(
            { error: "Choose a date and time for this session." },
            { status: 400 },
          );
        data.scheduledFor = new Date(input.data.scheduledFor).toISOString();
        data.sessionMode = [
          "guided",
          "calming",
          "family",
          "childhood",
          "career",
          "music",
          "places",
          "celebrations",
        ].includes(input.data?.sessionMode)
          ? input.data.sessionMode
          : "guided";
        data.completed = input.data?.completed === true;
      }
      await saveRecord(identity, {
        id: existing?.id ?? crypto.randomUUID(),
        kind: existing?.kind ?? input.kind,
        data,
      });
    } else if (body.action === "delete") {
      const life = await loadLife(identity);
      if (!life.records.some((x) => x.id === body.id))
        return NextResponse.json(
          { error: "Record not found" },
          { status: 404 },
        );
      if (identity.mode === "demo")
        demoLife().records = demoLife().records.filter((x) => x.id !== body.id);
      else {
        const { error } = await identity.client
          .from("life_records")
          .delete()
          .eq("id", body.id)
          .eq("owner_id", identity.userId);
        if (error) throw error;
      }
    } else
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    return NextResponse.json(await loadLife(identity));
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: "Could not save life information" },
        { status: 500 },
      )
    );
  }
}
