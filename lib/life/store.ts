import "server-only";
import type { RequestIdentity } from "@/lib/auth/server-auth";
import {
  defaultProfile,
  emptyContext,
  memoryAllowed,
  LifeData,
  LifeMemory,
  LifeProfile,
  LifeRecord,
} from "./types";
import { getMemories } from "@/lib/user-data-store";
const globalStore = globalThis as typeof globalThis & {
  moriLife?: LifeData;
  moriDemoMemoryDetails?: Map<string, Partial<LifeMemory>>;
};
export function demoLife(): LifeData {
  return (globalStore.moriLife ??= {
    profile: { ...defaultProfile, preferredName: "Margaret" },
    records: [],
  });
}
export const demoDetails = () =>
  (globalStore.moriDemoMemoryDetails ??= new Map<
    string,
    Partial<LifeMemory>
  >());
export async function loadLife(identity: RequestIdentity): Promise<LifeData> {
  if (identity.mode === "demo") return structuredClone(demoLife());
  const [profile, records] = await Promise.all([
    identity.client
      .from("patient_profiles")
      .select("*")
      .eq("owner_id", identity.userId)
      .maybeSingle(),
    identity.client
      .from("life_records")
      .select("*")
      .eq("owner_id", identity.userId)
      .order("created_at", { ascending: false }),
  ]);
  if (profile.error) throw profile.error;
  if (records.error) throw records.error;
  return {
    profile: {
      ...defaultProfile,
      ...profile.data?.personal_history,
      preferredName: profile.data?.preferred_name ?? "",
      language: profile.data?.communication_language ?? "en-US",
    },
    records: records.data ?? [],
  };
}
export async function saveProfile(
  identity: RequestIdentity,
  profile: LifeProfile,
) {
  if (identity.mode === "demo") {
    demoLife().profile = profile;
    return;
  }
  const { error } = await identity.client.from("patient_profiles").upsert({
    owner_id: identity.userId,
    preferred_name: profile.preferredName,
    communication_language: profile.language,
    personal_history: profile,
    comforting_topics: profile.comfortingTopics
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    sensitive_topics: profile.avoidTopics
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  });
  if (error) throw error;
}
export async function saveRecord(
  identity: RequestIdentity,
  record: LifeRecord,
) {
  if (identity.mode === "demo") {
    const life = demoLife();
    const index = life.records.findIndex((x) => x.id === record.id);
    if (index < 0) life.records.unshift(record);
    else life.records[index] = record;
    return;
  }
  const { error } = await identity.client.from("life_records").upsert({
    id: record.id,
    owner_id: identity.userId,
    kind: record.kind,
    data: record.data,
  });
  if (error) throw error;
}
export async function loadLifeMemories(
  identity: RequestIdentity,
): Promise<LifeMemory[]> {
  const life = await loadLife(identity);
  const linkedPeople = (ids: string[]) =>
    life.records
      .filter((r) => r.kind === "person" && ids.includes(r.id))
      .map((r) =>
        [r.data.name, r.data.relationship].filter(Boolean).join(" — "),
      );
  const cleanContext = (input: Partial<LifeMemory["context"]>) => ({
    ...emptyContext,
    ...input,
    personIds: (input.personIds ?? []).filter((id) =>
      life.records.some((r) => r.id === id && r.kind === "person"),
    ),
    albumIds: (input.albumIds ?? []).filter((id) =>
      life.records.some((r) => r.id === id && r.kind === "album"),
    ),
  });
  if (identity.mode === "demo")
    return getMemories(identity.userId).map((m) => {
      const details = demoDetails().get(String(m.id));
      const safety =
        details?.safety ?? (m.consentStatus === "allowed" ? "safe" : "review");
      const context = cleanContext(details?.context ?? {});
      return {
        ...m,
        mediaKind: "photo",
        caregiverPriority: m.caregiverPriority ?? 0.5,
        ...details,
        context,
        tags: details?.context?.tags ?? m.tags ?? [],
        people: details?.context?.personIds.length
          ? linkedPeople(details.context.personIds)
          : m.people,
        safety,
        consentStatus: memoryAllowed({
          safety,
          avoidUntil: details?.avoidUntil,
        })
          ? "allowed"
          : safety === "avoid"
            ? "blocked"
            : "review",
      } as LifeMemory;
    });
  const { data, error } = await identity.client
    .from("memories")
    .select("*")
    .eq("owner_id", identity.userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return Promise.all(
    (data ?? []).map(async (row) => {
      const context = cleanContext(row.context ?? {});
      const permitted = memoryAllowed({
        safety: row.safety,
        avoidUntil: row.avoid_until,
      });
      const signed = row.storage_path
        ? await identity.client.storage
            .from("memories")
            .createSignedUrl(row.storage_path, 3600)
        : null;
      return {
        id: row.id,
        image: signed?.data?.signedUrl ?? row.image_url ?? "",
        title: row.title,
        date: row.memory_date ?? "",
        people: row.context?.personIds?.length
          ? linkedPeople(row.context.personIds)
          : (row.people ?? []),
        place: row.place ?? "",
        memoryHint: row.story ?? "",
        year: context.year,
        context,
        safety: row.safety,
        avoidUntil: row.avoid_until,
        mediaKind: row.media_kind,
        consentStatus: permitted
          ? "allowed"
          : row.safety === "avoid"
            ? "blocked"
            : "review",
        caregiverPriority: row.safety === "preferred" ? 1 : 0.5,
        tags: context.tags,
      } as LifeMemory;
    }),
  );
}
