const OpenAI = require("openai");

let client;

// Created lazily so the server can start (and tests can run) without an API key.
function getClient() {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not set");
  client ||= new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  return client;
}

module.exports = { getClient };
