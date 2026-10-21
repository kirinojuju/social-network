// Try one or more OpenRouter models on Thai summarize/chat prompts and time them.
//
//   cd backend
//   node scripts/try-model.js                          -> only minimax/minimax-m3.1-flash:free (4 requests)
//   node scripts/try-model.js google/gemma-4-31b-it:free,nvidia/nemotron-3-ultra-550b-a55b:free
//
// Needs OPENROUTER_API_KEY in backend/.env. Free models allow ~20 requests/minute and a small
// daily quota (50/day without credits), so each model here costs 4 requests of that quota.
require("dotenv").config();
const OpenAI = require("openai");

if (!process.env.OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY is not set (copy .env.example to .env and fill it in)");
  process.exit(1);
}

const models = (process.argv[2] || "minimax/minimax-m3.1-flash:free").split(",").map(s => s.trim()).filter(Boolean);
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  timeout: 60000,
  maxRetries: 0,
});

// Same system prompts the app uses (backend/ai/summarize.js and chat.js)
const SUMMARIZE_SYSTEM = "You are a helpful assistant that summarizes text concisely in plain text, without markdown formatting.";
const CHAT_SYSTEM = "You are UniAI, a friendly study assistant inside a university social network. Answer concisely (under 150 words), in the user's language. Use plain text only: no markdown, no asterisks, no headings; use short lines or numbered lines.";

const POST = "วันนี้ไปเดินตลาดวโรรสที่เชียงใหม่ มีของกินเยอะมาก ทั้งไส้อั่ว ข้าวซอย และขนมจีน แนะนำให้ไปตอนเช้าเพราะคนไม่เยอะ ร้านส่วนใหญ่ปิดก่อนบ่ายสามโมง ส่วนของฝากที่ซื้อกลับมาคือแคบหมูกับน้ำพริกหนุ่ม ราคาไม่แพงเลย";

const cases = [
  { name: "สรุปโพสต์ (ไทย)", messages: [{ role: "system", content: SUMMARIZE_SYSTEM }, { role: "user", content: `Summarize this:\n\n${POST}` }] },
  { name: "ถามเรื่องโพสต์", messages: [{ role: "system", content: `${CHAT_SYSTEM}\n\nThe user is asking about this post:\n"""\n${POST}\n"""` }, { role: "user", content: "โพสต์นี้แนะนำให้ไปตอนไหน เพราะอะไร" }] },
  { name: "ความจำ 1/2", messages: [{ role: "system", content: CHAT_SYSTEM }, { role: "user", content: "สวัสดี ผมชื่อบีช เรียนปี 2" }] },
  { name: "ความจำ 2/2 (ส่งประวัติ)", messages: [{ role: "system", content: CHAT_SYSTEM }, { role: "user", content: "สวัสดี ผมชื่อบีช เรียนปี 2" }, { role: "assistant", content: "สวัสดีครับบีช ยินดีที่ได้รู้จัก" }, { role: "user", content: "ผมชื่ออะไร และเรียนปีอะไร" }] },
];

async function run(model) {
  console.log(`\n=== ${model} ===`);
  for (const c of cases) {
    const t0 = Date.now();
    try {
      const res = await client.chat.completions.create({ model, messages: c.messages });
      const ms = Date.now() - t0;
      const choice = res.choices[0];
      const text = (choice.message.content || "").trim();
      const reasoning = (choice.message.reasoning || "").length;
      console.log(`\n[${c.name}] ${ms} ms | finish=${choice.finish_reason} | tokens out=${res.usage?.completion_tokens ?? "?"}${reasoning ? ` | reasoning chars=${reasoning}` : ""}`);
      console.log(text ? text.slice(0, 400) : "(คำตอบว่าง: ถ้าเกิดบ่อย แปลว่าโมเดลใช้โควตาไปกับการคิด)");
    } catch (err) {
      console.log(`\n[${c.name}] ล้มเหลวหลัง ${Date.now() - t0} ms: ${err.status || ""} ${err.message}`.slice(0, 300));
    }
    await new Promise(r => setTimeout(r, 3500)); // stay well under 20 requests/minute
  }
}

(async () => {
  for (const m of models) await run(m);
})();
