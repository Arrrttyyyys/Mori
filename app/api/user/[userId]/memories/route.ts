import { NextRequest, NextResponse } from "next/server";
import { addMemory } from "@/lib/user-data-store";
import {
  authErrorResponse,
  requireRequestIdentity,
} from "@/lib/auth/server-auth";
import { loadLifeMemories, loadLife, demoDetails } from "@/lib/life/store";
import { parseMemory } from "@/lib/life/validation";
export async function GET(
  request: NextRequest,
  { params: routeParams }: { params: Promise<{ userId: string }> },
) {
  try {
    const params = await routeParams;
    return NextResponse.json({
      memories: await loadLifeMemories(
        await requireRequestIdentity(request, params.userId),
      ),
    });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Could not load memories" }, { status: 500 })
    );
  }
}
export async function POST(
  request: NextRequest,
  { params: routeParams }: { params: Promise<{ userId: string }> },
) {
  try {
    const params = await routeParams;
    const identity = await requireRequestIdentity(request, params.userId);
    const body = await request.json();
    let values;
    try {
      values = parseMemory(body);
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 },
      );
    }
    if (
      identity.mode === "supabase" &&
      identity.workspaceRole === "contributor"
    )
      values.safety = "review";
    const life = await loadLife(identity);
    if (
      values.context.personIds.some(
        (id) => !life.records.some((x) => x.id === id && x.kind === "person"),
      ) ||
      values.context.albumIds.some(
        (id) => !life.records.some((x) => x.id === id && x.kind === "album"),
      )
    )
      return NextResponse.json(
        { error: "Choose people and albums from this life map" },
        { status: 400 },
      );
    const people = life.records
      .filter((x) => values.context.personIds.includes(x.id))
      .map((x) =>
        [x.data.name, x.data.relationship].filter(Boolean).join(" — "),
      );
    let id: string | number;
    if (identity.mode === "demo") {
      const memory = addMemory(identity.userId, {
        image: body.image ?? "",
        title: values.title,
        date: values.memory_date,
      });
      id = memory.id;
      demoDetails().set(String(id), {
        ...body,
        id,
        context: values.context,
        safety: values.safety,
        avoidUntil: values.avoid_until ?? undefined,
        people,
        year: values.context.year,
      });
    } else {
      const path = body.storage_path;
      if (
        values.media_kind !== "story" &&
        (typeof path !== "string" || !path.startsWith(`${identity.actorId}/`))
      )
        return NextResponse.json(
          { error: "Upload a file before saving this memory" },
          { status: 400 },
        );
      const { data, error } = await identity.client
        .from("memories")
        .insert({
          ...values,
          owner_id: identity.userId,
          people,
          storage_path: values.media_kind === "story" ? null : path,
        })
        .select("id")
        .single();
      if (error) throw error;
      id = data.id;
    }
    const memories = await loadLifeMemories(identity);
    return NextResponse.json(
      { memory: memories.find((x) => x.id === id), memories },
      { status: 201 },
    );
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Could not save memory" }, { status: 500 })
    );
  }
}
