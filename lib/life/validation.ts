import {
  emptyContext,
  LifeMemory,
  MemoryContext,
  SafetySetting,
} from "./types";
export function parseMemory(body: any) {
  const title = String(body.title ?? "")
    .trim()
    .slice(0, 200);
  if (!title) throw new Error("Give this memory a title");
  const safety: SafetySetting = body.safety ?? "review";
  if (
    ![
      "review",
      "preferred",
      "safe",
      "neutral",
      "sensitive",
      "avoid",
      "temporary",
    ].includes(safety)
  )
    throw new Error("Choose a valid safety setting");
  const avoidUntil = body.avoidUntil ? String(body.avoidUntil) : null;
  if (
    safety === "temporary" &&
    (!avoidUntil || !Number.isFinite(Date.parse(avoidUntil)))
  )
    throw new Error("Choose when the temporary restriction ends");
  const list = (value: unknown): string[] =>
    Array.isArray(value)
      ? Array.from(
          new Set(
            value
              .filter((x) => typeof x === "string")
              .map((x) => x.trim().slice(0, 200))
              .filter(Boolean),
          ),
        ).slice(0, 50)
      : [];
  const context: MemoryContext = {
    ...emptyContext,
    personIds: list(body.context?.personIds),
    albumIds: list(body.context?.albumIds),
    tags: list(body.context?.tags),
    year: String(body.context?.year ?? "").slice(0, 30),
    source: String(body.context?.source ?? "family provided").slice(0, 200),
    certainty: ["confirmed", "approximate", "unverified"].includes(
      body.context?.certainty,
    )
      ? body.context.certainty
      : "unverified",
  };
  const mediaKind: LifeMemory["mediaKind"] = body.mediaKind ?? "photo";
  if (!["photo", "audio", "video", "story"].includes(mediaKind))
    throw new Error("Unsupported memory type");
  return {
    title,
    memory_date: String(body.date ?? "").slice(0, 200),
    place: String(body.place ?? "").slice(0, 500),
    story: String(body.memoryHint ?? "").slice(0, 6000),
    context,
    safety,
    avoid_until: avoidUntil,
    media_kind: mediaKind,
  };
}
