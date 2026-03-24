module.exports = async function handler(req, res) {

if (req.method !== "POST") {
return res.status(405).json({ error: "Method not allowed" });
}

try {

// 🧠 SAFE BODY PARSE (important)
let body = req.body;

if (!body || typeof body === "string") {
  body = JSON.parse(body || "{}");
}

const messages = body.messages || [];

// 🧠 Gita principles
const gitaPrinciples = [
  "Focus on action, not results",
  "Control your mind, not external situations",
  "Attachment creates suffering",
  "Discipline creates freedom",
  "Clarity comes from action, not overthinking",
  "Fear comes from attachment to outcome",
  "Consistency beats intensity",
  "Awareness breaks negative patterns"
];

const randomPrinciple =
  gitaPrinciples[Math.floor(Math.random() * gitaPrinciples.length)];

// 🧠 SYSTEM PROMPT
const systemPrompt = `

You are "Gita Guide" — a sharp, practical advisor inspired by Bhagavad Gita.

Rules:

- Give clear, direct insight
- No long paragraphs
- Max 4-5 lines per section
- Keep each line short
- No over-explaining

Structure:

<h3>🧠 Truth (Gita Insight)</h3>
<p>Clear insight using this idea: "${randomPrinciple}"</p><h3>🔍 Pattern</h3>
<p>Explain what's really happening</p><h3>⚡ Action (Karma Step)</h3>
<ul>
<li>Action 1</li>
<li>Action 2</li>
</ul><h3>❓ Question</h3>
<p>Ask ONE deep, personal question</p>IMPORTANT:

- MUST ask a question

- Keep it sharp, not motivational
  `;
  
  // 🚀 GROQ API CALL
  const response = await fetch(
  "https://api.groq.com/openai/v1/chat/completions",
  {
  method: "POST",
  headers: {
  "Content-Type": "application/json",
  Authorization: "Bearer ${process.env.GROQ_API_KEY}"
  },
  body: JSON.stringify({
  model: "llama-3.1-8b-instant",
  messages: [
  { role: "system", content: systemPrompt },
  ...messages
  ],
  temperature: 0.7,
  max_tokens: 800
  })
  }
  );
  
  // 🛑 HANDLE BAD RESPONSE
  if (!response.ok) {
  const errorText = await response.text();
  console.error("GROQ ERROR:", errorText);
  return res.status(500).json({
  reply: "⚠️ API error. Check key or quota."
  });
  }
  
  const data = await response.json();
  
  // 🛑 SAFE RESPONSE
  const reply =
  data?.choices?.[0]?.message?.content ||
  "⚠️ AI not responding. Try again.";
  
  return res.status(200).json({ reply });
  
  } catch (error) {
  console.error("SERVER ERROR:", error);
  return res.status(500).json({
  reply: "⚠️ Server error. Check logs."
  });
  }
  };
