import { NextRequest, NextResponse } from "next/server";
import {
  requireRequestIdentity,
  authErrorResponse,
} from "@/lib/auth/server-auth";
import { loadLifeMemories, loadLife } from "@/lib/life/store";
import { readObservations, latestDecisions } from "@/lib/life/session-engine";
export async function GET(request: NextRequest) {
  try {
    const identity = await requireRequestIdentity(request);
    const [memories, history, decisions, life] = await Promise.all([
      loadLifeMemories(identity),
      readObservations(identity),
      latestDecisions(identity),
      loadLife(identity),
    ]);
    const summaries = memories
      .map((m) => {
        const items = history.filter((o) => o.stimulusId === String(m.id));
        return {
          id: m.id,
          title: m.title,
          image: m.image,
          mediaKind: m.mediaKind,
          safety: m.safety,
          observations: items.length,
          engagingTurns: items.filter((o) => o.engagement >= 0.5).length,
          distressSignals: items.filter((o) => o.distress >= 0.7).length,
          lastSeen: items.at(-1)?.observedAt,
          topics: m.tags,
          people: m.context.personIds,
        };
      })
      .filter((m) => m.observations > 0)
      .sort((a, b) => b.engagingTurns - a.engagingTurns);
    const sessions =
      identity.mode === "demo"
        ? null
        : await identity.client
            .from("therapy_sessions")
            .select("id,status,started_at,closed_at")
            .eq("owner_id", identity.userId)
            .order("started_at", { ascending: false })
            .limit(100);
    if (sessions?.error) throw sessions.error;
    const recommendation = summaries.find(
      (m) =>
        ["preferred", "safe", "neutral"].includes(m.safety) &&
        m.engagingTurns > 0 &&
        !m.distressSignals,
    );
    return NextResponse.json({
      memories: summaries,
      decisions: decisions.map((d) => ({
        ...d,
        selectedMemory: d.selectedMemory
          ? (memories.find(
              (m) => String(m.id) === String(d.selectedMemory.id),
            ) ?? null)
          : null,
      })),
      sessions: sessions?.data ?? [],
      candidateStories: life.records.filter(
        (r) => r.kind === "story" && r.data.status === "unverified",
      ).length,
      recommendation: recommendation
        ? `Consider ${recommendation.title} for your next visit. It was associated with longer replies in ${recommendation.engagingTurns} observed turns.`
        : "Choose a familiar, approved memory that feels comfortable today.",
      scope:
        "Up to 1,000 recent turn observations and 100 sessions. Text-derived observations are uncertain and are not clinical measurements.",
    });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Could not load insights" }, { status: 500 })
    );
  }
}
