const { getClient } = require("./aiClient");

const model = process.env.OPENROUTER_MODEL || "openrouter/free";

async function summarizeText(text) {
  const completion = await getClient().chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are a helpful assistant that summarizes text concisely." },
      { role: "user", content: `Summarize this:\n\n${text}` },
    ],
  });
  return completion.choices[0].message.content;
}

module.exports = { summarizeText };
