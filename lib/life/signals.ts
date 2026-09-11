import type {
  ConversationState,
  StimulusObservation,
} from "@/lib/memory-engine/types";
import type { TherapySession } from "@/lib/therapy/types";
export function inferSignals(message: string) {
  const text = message.toLowerCase().replace(/[’]/g, "'");
  const distress =
    /\b(afraid|scared|upset|angry|leave me|don't want|dont want|stop)\b/.test(
      text,
    )
      ? 0.82
      : 0.05;
  const uncertain =
    /\b(don't remember|do not remember|dont remember|can't remember|cannot remember|no idea|not sure|don't recognize)\b/.test(
      text,
    );
  const recognition = uncertain
    ? 0.2
    : /\b(i remember|i recognize|that's my|that is my|our |used to|we would)\b/.test(
          text,
        )
      ? 0.8
      : null;
  const confusion =
    uncertain ||
    /\b(confused|don't know|dont know|who is|where am)\b/.test(text)
      ? 0.68
      : 0.12;
  const engagement = Math.min(
    1,
    0.15 + message.trim().split(/\s+/).filter(Boolean).length / 50,
  );
  const emotionalValence =
    distress > 0.5
      ? -0.75
      : /\b(love|happy|wonderful|beautiful|fun|laugh|favorite|favourite)\b/.test(
            text,
          )
        ? 0.7
        : 0.1;
  const fatigue = /\b(tired|sleepy|exhausted|rest)\b/.test(text);
  return {
    engagement,
    recognition,
    confusion,
    distress,
    emotionalValence,
    fatigue,
  };
}
export function turnObservation(
  session: TherapySession,
  message: string,
): StimulusObservation | null {
  if (!session.current_photo_id) return null;
  return {
    stimulusId: session.current_photo_id,
    observedAt: new Date(),
    ...inferSignals(message),
    durationSeconds: Math.max(
      0,
      Math.min(
        300,
        Math.round((Date.now() - session.last_activity.getTime()) / 1000),
      ),
    ),
  };
}
export function liveState(
  session: TherapySession,
  message: string,
): ConversationState {
  return {
    ...inferSignals(message),
    recentStimulusIds: session.turns
      .slice(-6)
      .flatMap((t) => (t.photo_id ? [t.photo_id] : [])),
    sessionStartedAt: session.started_at,
    turnCount: session.turns.length,
  };
}
