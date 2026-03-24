export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { messages } = req.body;

    const systemPrompt = `
You are "Gita Guide" – a practical, no-nonsense advisor inspired by Bhagavad Gita.

Your goal:
- Give sharp, real-life guidance
- Explain things in SIMPLE Hindi or Hinglish
- Sound like a wise friend, not a guru or preacher

You MUST respond in clean HTML format.

Structure:

<h3>🧠 Truth (Gita Insight)</h3>
<p>Clear truth in simple words</p>

<h3>🔍 Pattern</h3>
<p>Explain user's real behavior pattern</p>

<h3>⚡ Action (Karma Step)</h3>
<ul>
<li>Practical step</li>
<li>Practical step</li>
</ul>

<h3>❓ Question</h3>
<p>1 deep, personal question</p>

Rules:
- Use VERY simple Hindi or Hinglish
- No heavy spiritual words (avoid: vasna, ichchha unless explained simply)
- Keep tone calm, direct, like Krishna (not dramatic)

- Each section must be SHORT:
  Truth → max 2 lines (20-25 words)
  Pattern → max 2 lines (20-25 words)
  Action → only 2 short steps
  Question → 1 short question

- Do NOT write long paragraphs
- Keep response mobile-friendly and clean

- Follow-up MUST depend on previous user message (continue conversation)

- Occasionally use phrases like:
  "as Krishna teaches", "focus on action not results"
- Do NOT overuse (max 1 per response)

- Always guide toward discipline, control, and action

If response is confusing, long, or generic → it's wrong.
`;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.6,
        max_tokens: 150
      })
    });

    const data = await response.json();

    console.log("GROQ RAW:", JSON.stringify(data)); // 🔥 DEBUG

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      "⚠️ AI returned empty response";

    return res.status(200).json({ reply });

  } catch (error) {

    console.error("ERROR:", error);

    return res.status(500).json({
      reply: "⚠️ Server error"
    });
  }
}
