const { createCompletion } = require("./completion");

async function chatWithAssistant(messages, context) {
  const system = "You are UniAI, a friendly study assistant inside a university social network. Answer concisely (under 150 words), in the user's language. Use plain text only: no markdown, no asterisks, no headings; use short lines or numbered lines."
    + (context ? `\n\nThe user is asking about this post:\n"""\n${context}\n"""` : "");
  const completion = await createCompletion([{ role: "system", content: system }, ...messages]);
  return completion.choices[0].message.content;
}

module.exports = { chatWithAssistant };
