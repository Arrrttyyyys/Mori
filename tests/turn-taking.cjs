const assert = require("node:assert/strict");
const {
  mergeVoiceTranscript,
  voicePauseDelayMs,
  STANDARD_VOICE_PAUSE_MS,
  REFLECTIVE_VOICE_PAUSE_MS,
  visemeSequenceForText,
} = require("../.test-turn-taking/turn-taking.js");

assert.equal(voicePauseDelayMs("We went to the lake"), STANDARD_VOICE_PAUSE_MS);
assert.equal(voicePauseDelayMs("Let me think"), REFLECTIVE_VOICE_PAUSE_MS);
assert.equal(voicePauseDelayMs("I remember my sister and"), REFLECTIVE_VOICE_PAUSE_MS);
assert.equal(mergeVoiceTranscript("We went", "to the lake"), "We went to the lake");
assert.equal(mergeVoiceTranscript("We went to the lake", "the lake"), "We went to the lake");
assert.deepEqual(visemeSequenceForText("Mori"), ["rest", "round", "open"]);
assert.deepEqual(visemeSequenceForText("five"), ["teeth", "wide", "teeth"]);
console.log("Turn-taking checks passed.");
