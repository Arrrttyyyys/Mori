export const STANDARD_VOICE_PAUSE_MS = 4_000;
export const REFLECTIVE_VOICE_PAUSE_MS = 8_000;

export type MoriViseme = "rest" | "open" | "wide" | "round" | "teeth";

const HESITATION_CUE =
  /(?:^|\b)(?:um+|uh+|hmm+|let me think|give me (?:a|one) moment|one moment|hold on|i(?:'m| am) thinking|i(?:'m| am) trying to remember|trying to remember|where was i)(?:\b|$)/i;

const UNFINISHED_ENDING =
  /\b(?:and|but|because|so|then|when|while|that|the|a|an|to|of|with|for|from)$/i;

export function voicePauseDelayMs(transcript: string) {
  const normalized = transcript.trim();
  if (HESITATION_CUE.test(normalized) || UNFINISHED_ENDING.test(normalized)) {
    return REFLECTIVE_VOICE_PAUSE_MS;
  }
  return STANDARD_VOICE_PAUSE_MS;
}

export function mergeVoiceTranscript(current: string, addition: string) {
  const next = addition.trim();
  if (!next) return current.trim();
  const existing = current.trim();
  if (!existing) return next;
  if (existing.toLocaleLowerCase().endsWith(next.toLocaleLowerCase())) {
    return existing;
  }
  return `${existing} ${next}`;
}

export function visemeSequenceForText(text: string): MoriViseme[] {
  const normalized = text.toLocaleLowerCase().replace(/[^a-z]/g, "");
  if (!normalized) return ["open"];

  const sequence: MoriViseme[] = [];
  const sounds: Array<[RegExp, MoriViseme]> = [
    [/[bmp]/, "rest"],
    [/[fv]/, "teeth"],
    [/[ouqw]/, "round"],
    [/[eiy]/, "wide"],
    [/[a]/, "open"],
  ];

  for (const character of normalized) {
    const viseme = sounds.find(([pattern]) => pattern.test(character))?.[1] ?? "open";
    if (sequence[sequence.length - 1] !== viseme) sequence.push(viseme);
    if (sequence.length === 3) break;
  }

  return sequence.length ? sequence : ["open"];
}
