import { createAdminServerClient } from "@/lib/supabase/server";
import { loadLifeMemories, loadLife, demoDetails } from "@/lib/life/store";
import { parseMemory } from "@/lib/life/validation";
import { NextRequest, NextResponse } from "next/server";
import { deleteMemory } from "@/lib/user-data-store";
import {
  authErrorResponse,
  requireRequestIdentity,
} from "@/lib/auth/server-auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { userId: string; memoryId: string } },
) {
  try {
    const identity = await requireRequestIdentity(_request, params.userId);
    if (identity.mode === "demo") {
      const memoryId = parseInt(params.memoryId, 10);
      if (isNaN(memoryId))
        return NextResponse.json(
          { error: "Invalid demo memory id" },
          { status: 400 },
        );
      if (!deleteMemory(identity.userId, memoryId))
        return NextResponse.json(
          { error: "Memory not found" },
          { status: 404 },
        );
      return NextResponse.json({ ok: true });
    }
    const { data: memory, error: findError } = await identity.client
      .from("memories")
      .select("storage_path")
      .eq("id", params.memoryId)
      .eq("owner_id", identity.userId)
      .maybeSingle();
    if (findError) throw findError;
    if (!memory)
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    const { error } = await identity.client
      .from("memories")
      .delete()
      .eq("id", params.memoryId)
      .eq("owner_id", identity.userId);
    if (error) throw error;
    if (memory.storage_path) {
      const { error: storageError } = await createAdminServerClient()
        .storage.from("memories")
        .remove([memory.storage_path]);
      if (storageError) throw storageError;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Delete memory error:", error);
    return NextResponse.json(
      { error: "Failed to delete memory" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string; memoryId: string } },
) {
  try {
    const identity = await requireRequestIdentity(request, params.userId);
    const memories = await loadLifeMemories(identity);
    const current = memories.find((m) => String(m.id) === params.memoryId);
    if (!current)
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    const body = await request.json();
    let values;
    try {
      values = parseMemory({
        ...current,
        ...body,
        mediaKind: current.mediaKind,
      });
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 },
      );
    }
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
    if (identity.mode === "demo")
      demoDetails().set(params.memoryId, {
        ...current,
        ...body,
        context: values.context,
        safety: values.safety,
        avoidUntil: values.avoid_until ?? undefined,
        people,
        year: values.context.year,
      });
    else {
      const { error } = await identity.client
        .from("memories")
        .update({ ...values, people })
        .eq("owner_id", identity.userId)
        .eq("id", params.memoryId);
      if (error) throw error;
    }
    return NextResponse.json({
      memory: (await loadLifeMemories(identity)).find(
        (m) => String(m.id) === params.memoryId,
      ),
    });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Could not update memory" }, { status: 500 })
    );
  }
}
