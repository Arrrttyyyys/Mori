import "server-only";
import type { RequestIdentity } from "@/lib/auth/server-auth";
import type {
  LongitudinalMemoryState,
  StimulusObservation,
} from "@/lib/memory-engine/types";
import { LongitudinalMemoryModel } from "@/lib/memory-engine/longitudinal-memory-model";
import { createAdminServerClient } from "@/lib/supabase/server";
const shared = globalThis as typeof globalThis & {
  moriLearned?: Map<string, Map<string, LongitudinalMemoryState>>;
};
export async function readLearning(
  identity: RequestIdentity,
): Promise<Map<string, LongitudinalMemoryState>> {
  if (identity.mode === "demo") {
    const states = (shared.moriLearned ??= new Map());
    if (!states.has(identity.userId)) states.set(identity.userId, new Map());
    return states.get(identity.userId)!;
  }
  const { data, error } = await identity.client
    .from("longitudinal_memory_states")
    .select("*")
    .eq("owner_id", identity.userId);
  if (error) throw error;
  return new Map(
    (data ?? []).map((r) => [
      r.stimulus_id,
      {
        stimulusId: r.stimulus_id,
        exposureCount: r.exposure_count,
        recognitionStrength: r.recognition_strength,
        engagementStrength: r.engagement_strength,
        positiveAffectStrength: r.positive_affect_strength,
        confusionRisk: r.confusion_risk,
        distressRisk: r.distress_risk,
        confidence: r.confidence,
        lastUpdatedAt: new Date(r.last_updated_at),
      },
    ]),
  );
}
export async function updateLearning(
  identity: RequestIdentity,
  learned: Map<string, LongitudinalMemoryState>,
  observation: StimulusObservation,
) {
  const state = new LongitudinalMemoryModel().update(
    learned.get(observation.stimulusId) ?? null,
    observation,
  );
  learned.set(state.stimulusId, state);
  if (identity.mode === "demo") return;
  const { error } = await createAdminServerClient()
    .from("longitudinal_memory_states")
    .upsert({
      owner_id: identity.userId,
      stimulus_id: state.stimulusId,
      exposure_count: state.exposureCount,
      recognition_strength: state.recognitionStrength,
      engagement_strength: state.engagementStrength,
      positive_affect_strength: state.positiveAffectStrength,
      confusion_risk: state.confusionRisk,
      distress_risk: state.distressRisk,
      confidence: state.confidence,
      last_updated_at: state.lastUpdatedAt.toISOString(),
    });
  if (error) throw error;
}
