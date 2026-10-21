const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createCompletion, modelChain, DEFAULT_MODELS, resetCooldowns } = require('../ai/completion');

const answer = text => ({ choices: [{ message: { content: text } }] });
const httpError = status => Object.assign(new Error('http ' + status), { status });

// A fake OpenRouter client: `plan` maps a model id to a value (returned) or an Error (thrown).
function fakeClient(plan) {
  const calls = [];
  return {
    calls,
    chat: { completions: { create: async (body, options) => {
      calls.push({ model: body.model, timeout: options.timeout });
      const outcome = plan[body.model];
      if (outcome instanceof Error) throw outcome;
      return outcome;
    } } },
  };
}
const run = (plan, extra = {}) => {
  const client = fakeClient(plan);
  const logs = [];
  return createCompletion([{ role: 'user', content: 'hi' }], { client, models: ['A', 'B', 'C', 'D'], log: m => logs.push(m), ...extra })
    .then(result => ({ result, client, logs }), error => ({ error, client, logs }));
};

beforeEach(() => resetCooldowns());

test('uses the first model when it answers', async () => {
  const { result, client } = await run({ A: answer('from A'), B: answer('from B') });
  assert.equal(result.choices[0].message.content, 'from A');
  assert.deepEqual(client.calls.map(c => c.model), ['A']);
});

test('passes the per-attempt timeout to every request', async () => {
  const { client } = await run({ A: answer('ok') }, { timeoutMs: 1234 });
  assert.equal(client.calls[0].timeout, 1234);
});

test('falls back when the first model is rate limited, slow, or removed', async () => {
  const slow = Object.assign(new Error('Request timed out.'), { name: 'APIConnectionTimeoutError' });
  const { result, client, logs } = await run({ A: httpError(429), B: slow, C: answer('from C') });
  assert.equal(result.choices[0].message.content, 'from C');
  assert.deepEqual(client.calls.map(c => c.model), ['A', 'B', 'C']);
  assert.equal(logs.length, 2);
  assert.ok(logs.every(line => !line.includes('hi')), 'logs must not contain user text');
});

test('treats an empty answer as a failure', async () => {
  const { result } = await run({ A: answer('   '), B: answer('from B') });
  assert.equal(result.choices[0].message.content, 'from B');
});

test('a bad API key is thrown immediately without trying other models', async () => {
  const { error, client } = await run({ A: httpError(401), B: answer('from B') });
  assert.equal(error.status, 401);
  assert.deepEqual(client.calls.map(c => c.model), ['A']);
});

test('stops after maxAttempts and throws the last error', async () => {
  const { error, client } = await run({ A: httpError(429), B: httpError(500), C: httpError(502), D: answer('never') }, { maxAttempts: 3 });
  assert.equal(error.status, 502);
  assert.deepEqual(client.calls.map(c => c.model), ['A', 'B', 'C']);
});

test('skips a failed model for a minute, then tries it again', async () => {
  let clock = 1000;
  const now = () => clock;
  await run({ A: httpError(429), B: answer('from B') }, { now });
  const second = await run({ A: answer('from A'), B: answer('from B') }, { now });
  assert.deepEqual(second.client.calls.map(c => c.model), ['B']);
  clock += 61 * 1000;
  const third = await run({ A: answer('from A'), B: answer('from B') }, { now });
  assert.deepEqual(third.client.calls.map(c => c.model), ['A']);
});

test('still tries the models when every one is cooling down', async () => {
  const now = () => 1000;
  await run({ A: httpError(500), B: httpError(500), C: httpError(500), D: httpError(500) }, { now, maxAttempts: 4 });
  const again = await run({ A: answer('from A') }, { now });
  assert.equal(again.result.choices[0].message.content, 'from A');
});

test('model chain: MiniMax is the default and env settings override it', () => {
  assert.equal(DEFAULT_MODELS[0], 'minimax/minimax-m3.1-flash:free');
  assert.deepEqual(modelChain({}), DEFAULT_MODELS);
  assert.deepEqual(modelChain({ OPENROUTER_MODEL: 'x/y:free' }), ['x/y:free', ...DEFAULT_MODELS]);
  assert.deepEqual(modelChain({ OPENROUTER_MODEL: 'a', OPENROUTER_FALLBACK_MODELS: ' b , c,,a ' }), ['a', 'b', 'c']);
});
