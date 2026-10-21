const { getClient } = require("./aiClient");

// Tried in order. The first one is the default; the rest are used when it fails or is slow.
const DEFAULT_MODELS = [
  "minimax/minimax-m3.1-flash:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "openrouter/free",
];
const COOLDOWN_MS = 60 * 1000;
const cooldownUntil = new Map();

// OPENROUTER_MODEL = default model, OPENROUTER_FALLBACK_MODELS = comma-separated backups.
function modelChain(env = process.env) {
  const primary = (env.OPENROUTER_MODEL || "").trim() || DEFAULT_MODELS[0];
  const backups = env.OPENROUTER_FALLBACK_MODELS ? env.OPENROUTER_FALLBACK_MODELS.split(",") : DEFAULT_MODELS;
  return [...new Set([primary, ...backups.map(id => id.trim()).filter(Boolean)])];
}

function positiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Asks the models in order until one gives a non-empty answer. A model that fails (rate limit or
// daily quota, server error, timeout, removed model, empty answer) is skipped for a minute.
// A bad API key (401/403) would fail for every model, so it is thrown straight away.
async function createCompletion(messages, {
  client,
  models = modelChain(),
  timeoutMs = positiveInt(process.env.OPENROUTER_TIMEOUT_MS, 15000),
  maxAttempts = positiveInt(process.env.OPENROUTER_MAX_ATTEMPTS, 3),
  now = Date.now,
  log = console.warn,
} = {}) {
  const ai = client || getClient();
  const ready = models.filter(model => (cooldownUntil.get(model) || 0) <= now());
  const order = (ready.length ? ready : models).slice(0, maxAttempts);
  let lastError;
  for (const model of order) {
    try {
      const completion = await ai.chat.completions.create({ model, messages }, { timeout: timeoutMs });
      const text = completion?.choices?.[0]?.message?.content;
      if (typeof text !== "string" || !text.trim()) throw new Error("empty answer");
      return completion;
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) throw err;
      lastError = err;
      cooldownUntil.set(model, now() + COOLDOWN_MS);
      log(`[ai] ${model} failed (${err?.status || err?.name || err?.message}); trying the next model`);
    }
  }
  throw lastError;
}

module.exports = { createCompletion, modelChain, DEFAULT_MODELS, resetCooldowns: () => cooldownUntil.clear() };
