const client = require("./aiClient");

async function summarizeText(text) {
  const completion = await client.chat.completions.create({
    model: "openrouter/free",
    messages: [
      { role: "system", content: "You are a helpful assistant that summarizes text concisely." },
      { role: "user", content: `Summarize this:\n\n${text}` },
    ],
  });
  return completion.choices[0].message.content;
}

module.exports = { summarizeText };