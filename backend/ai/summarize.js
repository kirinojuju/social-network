const { createCompletion } = require("./completion");

async function summarizeText(text) {
  const completion = await createCompletion([
    { role: "system", content: "You are a helpful assistant that summarizes text concisely in plain text, without markdown formatting." },
    { role: "user", content: `Summarize this:\n\n${text}` },
  ]);
  return completion.choices[0].message.content;
}

module.exports = { summarizeText };
