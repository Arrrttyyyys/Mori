const { TherapyBrain } = require('/tmp/mori-long-eval/therapy-brain.js');

const script = [
  'I am not sure what to talk about today.',
  'The garden sounds nice.',
  'We had red roses near the back door.',
  'My husband looked after them. I cannot remember his name.',
  'Maybe it was George. No, that does not feel right.',
  'I miss having someone in the garden with me.',
  'I feel a little sad now.',
  'Can we talk about music instead?',
  'I liked songs we could dance to.',
  'That is all I can remember.',
  'I would rather sit quietly for a moment.',
  'Thank you. I would like to finish for today.',
];

const session = {
  session_id: 'long-communication-eval', user_id: 'demo_patient', turns: [],
  current_photo_id: null, emotional_states: [], topics_discussed: [],
  started_at: new Date(), last_activity: new Date(), status: 'active',
};
const memories = [
  { id: 'garden', title: 'Roses by the back door', date: '1988' },
  { id: 'music', title: 'Saturday dance songs', date: '1992' },
];
const discouraged = [/do you remember/i, /you already (said|told|asked)/i, /as i (said|mentioned)/i, /try (harder )?to remember/i, /good (girl|boy)/i, /sweetie/i, /\b(?:1988|1992)\b/];
const fallbackPhrases = [/something isn't working/i, /having trouble responding/i];

(async () => {
  process.env.MORI_AI_PROVIDER = 'local';
  process.env.MORI_LOCAL_URL = 'http://127.0.0.1:8080';
  const brain = new TherapyBrain();
  const latencies = [];
  const failures = [];
  const priorOutputs = new Set();
  for (let index = 0; index < script.length; index++) {
    const input = script[index];
    const started = performance.now();
    const response = await brain.generateResponse(input, { session, memory_library: memories });
    const milliseconds = Math.round(performance.now() - started);
    const diagnostics = brain.getLastGenerationDiagnostics();
    if (diagnostics.usedModel) latencies.push(milliseconds);
    const output = `${response.spoken_response} ${response.next_question}`.trim();
    const turnFailures = [];
    if (discouraged.some((pattern) => pattern.test(output))) turnFailures.push('discouraged language');
    if ((output.match(/\?/g) || []).length > 1) turnFailures.push('more than one question');
    if (output.length > 700) turnFailures.push('response too long');
    if (diagnostics.usedFallback || fallbackPhrases.some((pattern) => pattern.test(output))) turnFailures.push('provider fallback');
    if (index === 7 && !/music|song|listen|dance/i.test(output)) turnFailures.push('did not follow topic change');
    if (index === 4 && /george sounds|gardener who|george (?:was|is)/i.test(output)) turnFailures.push('confirmed uncertain detail');
    if (index === 10 && ((output.match(/\?/g) || []).length || !/quiet|time/i.test(output))) turnFailures.push('did not respect quiet');
    if (index < script.length - 1 && response.session_action === 'close') turnFailures.push('closed before explicit request');
    const normalizedOutput = output.toLowerCase();
    if (priorOutputs.has(normalizedOutput)) turnFailures.push('repeated an earlier response verbatim');
    priorOutputs.add(normalizedOutput);
    failures.push(...turnFailures.map((failure) => ({ turn: index + 1, failure })));
    console.log(JSON.stringify({ turn: index + 1, input, source: diagnostics.usedModel ? 'model' : 'guard', milliseconds, pass: !turnFailures.length, failures: turnFailures, response }));
    session.turns.push({ user_message: input, therapist_response: response, timestamp: new Date() });
    session.emotional_states.push(response.emotional_state);
    session.last_activity = new Date();
  }
  const sorted = latencies.slice().sort((a, b) => a - b);
  const summary = {
    turns: script.length,
    passed: script.length - new Set(failures.map((failure) => failure.turn)).size,
    failures,
    latency_ms: {
      median: sorted[Math.floor((sorted.length - 1) * 0.5)],
      p95: sorted[Math.floor((sorted.length - 1) * 0.95)],
      max: Math.max(...latencies),
    },
  };
  console.log(JSON.stringify({ summary }));
  process.exitCode = failures.length ? 1 : 0;
})().catch((error) => { console.error(error); process.exitCode = 1; });
