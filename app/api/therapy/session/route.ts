import { claimSession } from "@/lib/life/session-lease";
import { requireSessionConsent } from "@/lib/life/consent";
import { NextRequest, NextResponse } from "next/server";
import { SessionOrchestrator } from "@/lib/therapy/session-orchestrator";
import { SessionStore } from "@/lib/therapy/session-store";
import { TherapySession } from "@/lib/therapy/types";
import { MemoryLibraryItem } from "@/lib/therapy/types";
import {
  addReflection,
  addSessionSummary,
  getMemories,
  getFamilySpace,
} from "@/lib/user-data-store";
import { prepareSession } from "@/lib/life/session-engine";
import { loadLife } from "@/lib/life/store";
import { audit, createIncident, getControl } from "@/lib/pilot";
import {
  authErrorResponse,
  requireRequestIdentity,
  type RequestIdentity,
} from "@/lib/auth/server-auth";
import { SupabaseSessionStore } from "@/lib/therapy/supabase-session-store";
import { createAdminServerClient } from "@/lib/supabase/server";
import { consumeDemoQuota, recordOperationalEvent } from "@/lib/operations/monitoring";

const sessionStore = new SessionStore();
const orchestrator = new SessionOrchestrator();
const finalizedSessions = new Set<string>();

async function finalizeSession(
  session: TherapySession,
  identity: RequestIdentity,
) {
  if (finalizedSessions.has(session.session_id) || session.turns.length === 0)
    return;
  if (identity.mode === "supabase") {
    const admin = createAdminServerClient();
    const lastMessages = session.turns
      .map((turn) => turn.user_message.trim())
      .filter(Boolean)
      .slice(-3)
      .join(" ");
    const topic =
      session.topics_discussed.at(-1) ?? "A gentle conversation with Mori";
    const summary = lastMessages
      ? `The conversation centered on ${topic}. The person shared: “${lastMessages.slice(0, 260)}${lastMessages.length > 260 ? "…" : ""}”`
      : "The person spent a quiet moment with Mori.";
    const { error } = await admin.from("session_summaries").upsert(
      {
        session_id: session.session_id,
        owner_id: identity.userId,
        topic,
        summary,
      },
      { onConflict: "session_id" },
    );
    if (error) throw error;
    finalizedSessions.add(session.session_id);
    return;
  }
  const memories = getMemories(identity.userId);
  const selected = memories.find(
    (memory) => String(memory.id) === session.current_photo_id,
  );
  const userDetails = session.turns
    .map((turn) => turn.user_message.trim())
    .filter(Boolean)
    .slice(-3)
    .join(" ");
  addSessionSummary(session.user_id, {
    topic: selected?.title ?? "A gentle conversation with Mori",
    summary: userDetails
      ? `The conversation centered on ${selected?.title ?? "a familiar topic"}. The person shared: “${userDetails.slice(0, 260)}${userDetails.length > 260 ? "…" : ""}”`
      : "The person spent a quiet moment with Mori.",
  });
  finalizedSessions.add(session.session_id);
  addReflection(
    session.user_id,
    selected
      ? `“${selected.title}” was used as a conversation stimulus. Review the adaptive-session signals and add caregiver feedback before the next session.`
      : "Mori stayed present-focused because no approved memory was suitable.",
  );
}

async function persistentControl(
  identity: Extract<RequestIdentity, { mode: "supabase" }>,
  sessionId: string,
) {
  const admin = createAdminServerClient();
  const { data, error } = await admin
    .from("supervisor_actions")
    .select("action")
    .eq("patient_id", identity.userId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data?.action === "stop") return "stopped";
  if (data?.action && data.action !== "resume" && data.action !== "acknowledge")
    return "paused";
  return "active";
}

// Get or create session
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");
    const requestedUserId = searchParams.get("user_id") ?? undefined;
    const identity = await requireRequestIdentity(request, requestedUserId);

    if (sessionId) {
      const session =
        identity.mode === "demo"
          ? sessionStore.getSession(sessionId)
          : await new SupabaseSessionStore(
              identity.client,
              identity.userId,
            ).getSession(sessionId);
      if (session) {
        return NextResponse.json({ session });
      }
    }

    if (identity.mode === "demo") {
      const quota = await consumeDemoQuota(request, "session");
      if (!quota.allowed)
        return NextResponse.json(
          { error: "The demo session limit has been reached. Please try again later." },
          { status: 429, headers: { "Retry-After": String(quota.retryAfter) } },
        );
    }

    await requireSessionConsent(identity);
    // Create new session
    const newSession =
      identity.mode === "demo"
        ? sessionStore.createSession(identity.userId)
        : await new SupabaseSessionStore(
            identity.client,
            identity.userId,
          ).createSession();
    return NextResponse.json({ session: newSession });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Session creation failed.");
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}

// Process a turn in the session
export async function POST(request: NextRequest) {
  let release: (() => Promise<void>) | null = null;
  const startedAt = Date.now();
  let identityMode: "demo" | "supabase" | "anonymous" = "anonymous";
  let metricClientKey: string | undefined;
  try {
    const identity = await requireRequestIdentity(request);
    identityMode = identity.mode;
    if (identity.mode === "demo") {
      const quota = await consumeDemoQuota(request, "turn");
      metricClientKey = quota.clientKeyHash;
      if (!quota.allowed)
        return NextResponse.json(
          { error: "This demo has reached its usage limit. Please try again later." },
          { status: 429, headers: { "Retry-After": String(quota.retryAfter) } },
        );
    }
    await requireSessionConsent(identity);
    const body = await request.json();
    const { session_id, user_message } = body;

    if (
      typeof session_id !== "string" ||
      typeof user_message !== "string" ||
      !user_message.trim() ||
      user_message.length > 10000
    ) {
      return NextResponse.json(
        { error: "session_id and user_message are required" },
        { status: 400 },
      );
    }

    release = await claimSession(identity, session_id);
    if (!release)
      return NextResponse.json(
        { error: "This session is busy or has ended. Please wait a moment." },
        { status: 409 },
      );
    const persistentStore =
      identity.mode === "supabase"
        ? new SupabaseSessionStore(identity.client, identity.userId)
        : null;
    const session =
      identity.mode === "demo"
        ? sessionStore.getSession(session_id)
        : await persistentStore!.getSession(session_id);
    if (!session) {
      // Try to create a new session if it doesn't exist
      const newSession =
        identity.mode === "demo"
          ? sessionStore.createSession(identity.userId)
          : await persistentStore!.createSession();
      return NextResponse.json(
        {
          error: "Session not found, please refresh and try again",
          new_session_id: newSession.session_id,
        },
        { status: 404 },
      );
    }

    const pilotControl =
      identity.mode === "demo"
        ? getControl(identity.userId, session.session_id)
        : await persistentControl(identity, session.session_id);
    if (pilotControl !== "active") {
      return NextResponse.json(
        {
          error:
            pilotControl === "stopped"
              ? "This session was stopped by the supervisor."
              : "This session is paused by the supervisor.",
          pilot_control: pilotControl,
        },
        { status: 409 },
      );
    }

    if (session.status === "closed")
      return NextResponse.json(
        { error: "This session has ended." },
        { status: 409 },
      );
    const prepared = await prepareSession(
      identity,
      session,
      user_message,
      typeof body.mode === "string" ? body.mode.slice(0, 40) : "guided",
    );
    const selectedMemory = prepared.selected;
    const directMoriQuestion =
      /\b(how are you|how about you|tell me about yourself|what can you do)\b/i.test(
        user_message,
      );
    const explicitChangeRequest =
      /\b(another|different|change|switch|next)\s+(photo|picture|memory|topic)\b/i.test(
        user_message,
      );
    // The model receives only safe recent turns and an approved, bounded context.
    const safeSession = {
      ...session,
      turns: session.turns.filter(
        (t) =>
          prepared.safeText(t.user_message) &&
          prepared.safeText(t.therapist_response.spoken_response) &&
          prepared.safeText(t.therapist_response.next_question),
      ),
      topics_discussed: session.topics_discussed.filter(prepared.safeText),
      current_photo_id: selectedMemory ? String(selectedMemory.id) : null,
    };
    const extraContext = {
      memory_library: prepared.relevant.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
      })),
      session_plan: JSON.stringify(prepared.plan),
    };
    const response = await orchestrator.processTurn(
      safeSession,
      user_message,
      selectedMemory
        ? {
            photo_id: String(selectedMemory.id),
            people:
              selectedMemory.context.certainty === "confirmed"
                ? selectedMemory.people
                : undefined,
            place:
              selectedMemory.context.certainty === "confirmed"
                ? selectedMemory.place
                : undefined,
            year:
              selectedMemory.context.certainty === "confirmed"
                ? selectedMemory.year
                : undefined,
            memory_hint:
              selectedMemory.context.certainty === "confirmed"
                ? selectedMemory.memoryHint
                : undefined,
          }
        : undefined,
      extraContext,
    );
    const diagnostics = orchestrator.getLastGenerationDiagnostics();
    await recordOperationalEvent({
      eventName: "model_turn",
      route: "/api/therapy/session",
      statusCode: 200,
      latencyMs: Date.now() - startedAt,
      provider: diagnostics.provider,
      usedFallback: diagnostics.usedFallback,
      malformedResponses: diagnostics.malformedResponses,
      identityMode,
      clientKeyHash: metricClientKey,
    });
    const newTurn = safeSession.turns.at(-1);
    if (newTurn) session.turns.push(newTurn);
    session.last_activity = safeSession.last_activity;
    session.emotional_states = safeSession.emotional_states;
    session.close_offer_turn = safeSession.close_offer_turn;
    session.status = safeSession.status;
    session.current_photo_id = selectedMemory
      ? String(selectedMemory.id)
      : null;
    if (
      !prepared.safeText(
        response.spoken_response + " " + response.next_question,
      )
    ) {
      response.spoken_response = "We can take our time together.";
      response.next_question = "Would you like a quiet moment?";
    }
    // Selection and policy, never model output, control displayed media.
    response.show_photo = false;
    response.photo_id = null;

    if (response.safety?.supervisor_attention) {
      if (identity.mode === "demo") {
        createIncident(
          identity.userId,
          session.session_id,
          response.safety.risk_level === "high" ? "critical" : "medium",
          response.safety.flags[0] || "safety_signal",
          "Mori detected language requiring supervisor review.",
        );
        audit(
          identity.userId,
          "mori_safety_monitor",
          "safety.detected",
          "therapy_session",
          session.session_id,
          { risk: response.safety.risk_level },
        );
      } else {
        const admin = createAdminServerClient();
        await Promise.all([
          admin.from("pilot_incidents").insert({
            patient_id: identity.userId,
            session_id: session.session_id,
            severity:
              response.safety.risk_level === "high" ? "critical" : "medium",
            category: response.safety.flags[0] || "safety_signal",
            description: "Mori detected language requiring supervisor review.",
          }),
          admin.from("audit_events").insert({
            patient_id: identity.userId,
            actor_id: null,
            action: "safety.detected",
            resource_type: "therapy_session",
            resource_id: session.session_id,
            metadata: { risk: response.safety.risk_level },
          }),
        ]);
      }
    }

    if (
      selectedMemory &&
      response.session_action !== "close" &&
      !response.safety?.supervisor_attention &&
      !directMoriQuestion
    ) {
      if (explicitChangeRequest && session.turns.length > 1) {
        response.spoken_response = `That sounds meaningful. I have another approved family memory here called “${selectedMemory.title}.”`;
        response.next_question = "Would you like to look at it together?";
        response.emotional_state = "calm";
      }
      response.show_photo = true;
      response.photo_id = String(selectedMemory.id);
      session.current_photo_id = String(selectedMemory.id);
      if (!session.topics_discussed.includes(selectedMemory.title)) {
        session.topics_discussed.push(selectedMemory.title);
      }
    } else if (response.safety?.supervisor_attention || directMoriQuestion) {
      response.show_photo = false;
      response.photo_id = null;
      if (response.safety?.supervisor_attention)
        session.current_photo_id = null;
      const latestTurn = session.turns[session.turns.length - 1];
      if (latestTurn) latestTurn.photo_id = null;
    }
    const persistedTurn = session.turns.at(-1);
    if (persistedTurn)
      persistedTurn.photo_id = response.show_photo ? response.photo_id : null;
    // Update session
    if (identity.mode === "demo") sessionStore.updateSession(session);
    else await persistentStore!.updateSession(session);

    // Check if session should close
    if (
      orchestrator.shouldCloseSession(session) ||
      response.session_action === "close" ||
      Date.now() - session.started_at.getTime() >
        prepared.life.profile.sessionMinutes * 60000
    ) {
      if (identity.mode === "demo") sessionStore.closeSession(session_id);
      else await persistentStore!.closeSession(session_id);
      await finalizeSession(session, identity);
      const closureResponse = orchestrator.getSessionClosureResponse();
      return NextResponse.json({
        response: closureResponse,
        session: session,
      });
    }

    return NextResponse.json({
      response,
      session: session,
      selected_memory: selectedMemory
        ? {
            id: selectedMemory.id,
            title: selectedMemory.title,
            image: selectedMemory.image,
            date: selectedMemory.date,
            mediaKind: selectedMemory.mediaKind,
          }
        : null,
      adaptive: prepared.trace,
      language: prepared.life.profile.language,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    const statusCode = authResponse?.status ?? 500;
    await recordOperationalEvent({ eventName: "api_error", route: "/api/therapy/session", statusCode, latencyMs: Date.now() - startedAt, identityMode, clientKeyHash: metricClientKey });
    if (authResponse) return authResponse;
    console.error("Turn processing failed.");
    return NextResponse.json(
      { error: "Failed to process turn" },
      { status: 500 },
    );
  } finally {
    if (release) await release();
  }
}

// Close session
export async function DELETE(request: NextRequest) {
  let release: (() => Promise<void>) | null = null;
  try {
    const identity = await requireRequestIdentity(request);
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 },
      );
    }

    release = await claimSession(identity, sessionId);
    if (!release) {
      const existing =
        identity.mode === "demo"
          ? sessionStore.getSession(sessionId)
          : await new SupabaseSessionStore(
              identity.client,
              identity.userId,
            ).getSession(sessionId);
      if (existing?.status === "closed")
        return NextResponse.json({ message: "Session already closed" });
      return NextResponse.json(
        {
          error:
            "A reply is still being saved. Please try finishing again in a moment.",
        },
        { status: 409 },
      );
    }
    const persistentStore =
      identity.mode === "supabase"
        ? new SupabaseSessionStore(identity.client, identity.userId)
        : null;
    const session =
      identity.mode === "demo"
        ? sessionStore.getSession(sessionId)
        : await persistentStore!.getSession(sessionId);
    if (identity.mode === "demo") sessionStore.closeSession(sessionId);
    else await persistentStore!.closeSession(sessionId);
    if (session) await finalizeSession(session, identity);
    const orchestrator = new SessionOrchestrator();
    const closureResponse = orchestrator.getSessionClosureResponse();

    return NextResponse.json({
      message: "Session closed",
      closure_response: closureResponse,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Session closure failed.");
    return NextResponse.json(
      { error: "Failed to close session" },
      { status: 500 },
    );
  } finally {
    if (release) await release();
  }
}
