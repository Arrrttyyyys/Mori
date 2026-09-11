const assert = require('node:assert/strict');
const { TherapyBrain, THERAPY_SYSTEM_PROMPT } = require('/tmp/mori-local-test/therapy-brain.js');
(async () => {
  process.env.MORI_AI_PROVIDER = 'local';
  process.env.MORI_LOCAL_URL = 'http://127.0.0.1:8080';
  process.env.OPENAI_API_KEY = 'fictional-test-key';
  const brain = new TherapyBrain();
  let calls = 0;
  global.fetch = async (url, options) => {
    calls++;
    assert.equal(String(url), 'http://127.0.0.1:8080/v1/chat/completions');
    assert.equal(options.headers.Authorization, undefined);
    const body = JSON.parse(options.body);
    assert.equal(body.chat_template_kwargs.enable_thinking, false);
    assert.equal(body.messages[1].content, 'Hello');
    assert.equal(body.max_tokens, 220);
    return { ok: true, json: async () => ({ choices: [{ message: { content: '```json\n{"spoken_response":"Hello"}\n```' } }] }) };
  };
  assert.equal(await brain.callLLM(THERAPY_SYSTEM_PROMPT + '\nHello', 'Hello'), '{"spoken_response":"Hello"}');
  assert.equal(calls, 1);
  global.fetch = async () => { calls++; throw new Error('Offline'); };
  await assert.rejects(brain.callLLM('Hello', 'Hello'), /Offline/);
  assert.equal(calls, 2, 'No cloud retry in local mode');
  process.env.MORI_LOCAL_URL = 'https://example.com';
  await assert.rejects(brain.callLLM('Hello', 'Hello'), /loopback/);
  assert.equal(calls, 2, 'Reject remote address before fetching');
  console.log('Local provider checks passed: routing, compact prompt, output cleanup, and no cloud fallback.');
})().catch(error => { console.error(error); process.exitCode = 1; });
