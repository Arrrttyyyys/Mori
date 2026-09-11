import { NextRequest, NextResponse } from "next/server";
import {
  requireRequestIdentity,
  authErrorResponse,
} from "@/lib/auth/server-auth";
import { loadLife, loadLifeMemories } from "@/lib/life/store";
import { readObservations, latestDecisions } from "@/lib/life/session-engine";
export async function GET(request: NextRequest) {
  try {
    const identity = await requireRequestIdentity(request);
    const [life, memories, observations, decisions] = await Promise.all([
      loadLife(identity),
      loadLifeMemories(identity),
      readObservations(identity),
      latestDecisions(identity),
    ]);
    const records: Record<string, unknown> = {};
    if (identity.mode === "supabase") {
      for (const table of [
        "therapy_sessions",
        "session_turns",
        "session_summaries",
        "family_notes",
      ]) {
        let offset = 0;
        const all: unknown[] = [];
        while (true) {
          const { data, error } = await identity.client
            .from(table)
            .select("*")
            .eq("owner_id", identity.userId)
            .order("id")
            .range(offset, offset + 499);
          if (error) throw error;
          all.push(...data);
          if (data.length < 500) break;
          offset += 500;
        }
        records[table] = all;
      }
    }
    return new NextResponse(
      JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          life,
          memories,
          observations,
          decisions,
          observationScope:
            "Recent 1000 observations and 100 decisions; sessions exported in full.",
          ...records,
        },
        null,
        2,
      ),
      {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition":
            'attachment; filename="mori-life-archive.json"',
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: "Could not export the archive" },
        { status: 500 },
      )
    );
  }
}
