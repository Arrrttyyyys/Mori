export type SafetySetting =
  | "review"
  | "preferred"
  | "safe"
  | "neutral"
  | "sensitive"
  | "avoid"
  | "temporary";
export type Certainty = "confirmed" | "approximate" | "unverified";
export interface LifeProfile {
  sessionConsent: boolean;
  photosAllowed: boolean;
  audioAllowed: boolean;
  transcriptAllowed: boolean;
  preferredName: string;
  birthYear: string;
  language: string;
  languages: string;
  career: string;
  places: string;
  interests: string;
  music: string;
  communication: string;
  comfortingTopics: string;
  avoidTopics: string;
  sessionMinutes: number;
}
export const defaultProfile: LifeProfile = {
  sessionConsent: false,
  photosAllowed: true,
  audioAllowed: true,
  transcriptAllowed: true,
  preferredName: "",
  birthYear: "",
  language: "en-US",
  languages: "",
  career: "",
  places: "",
  interests: "",
  music: "",
  communication: "",
  comfortingTopics: "",
  avoidTopics: "",
  sessionMinutes: 15,
};
export interface LifeRecord {
  id: string;
  kind: "person" | "album" | "note" | "story" | "plan";
  data: {
    scheduledFor?: string;
    sessionMode?: string;
    completed?: boolean;
    name?: string;
    relationship?: string;
    aliases?: string;
    description?: string;
    text?: string;
    expiresAt?: string;
    status?: "unverified" | "confirmed" | "dismissed";
    source?: string;
    sessionId?: string;
    memoryId?: string;
  };
  created_at?: string;
}
export interface MemoryContext {
  personIds: string[];
  albumIds: string[];
  tags: string[];
  certainty: Certainty;
  source: string;
  year: string;
}
export interface LifeMemory {
  id: string | number;
  image: string;
  title: string;
  date: string;
  people?: string[];
  place?: string;
  memoryHint?: string;
  year?: string;
  context: MemoryContext;
  safety: SafetySetting;
  avoidUntil?: string;
  mediaKind: "photo" | "audio" | "video" | "story";
  consentStatus: "allowed" | "review" | "blocked";
  caregiverPriority: number;
  tags: string[];
}
export interface LifeData {
  profile: LifeProfile;
  records: LifeRecord[];
}
export const emptyContext: MemoryContext = {
  personIds: [],
  albumIds: [],
  tags: [],
  certainty: "unverified",
  source: "family provided",
  year: "",
};
export function memoryAllowed(
  memory: Pick<LifeMemory, "safety" | "avoidUntil">,
  now = Date.now(),
): boolean {
  return (
    ["preferred", "safe", "neutral"].includes(memory.safety) ||
    (memory.safety === "temporary" &&
      Boolean(memory.avoidUntil) &&
      Number.isFinite(Date.parse(memory.avoidUntil!)) &&
      Date.parse(memory.avoidUntil!) <= now)
  );
}
