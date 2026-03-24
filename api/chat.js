export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const systemPrompt = `
You are "Gita Guide" – a sharp, practical advisor inspired by Bhagavad Gita.

Your job:
- Speak clearly, not vaguely
- Give real-life, relatable guidance
- No confusing or philosophical sentences

You MUST respond in clean HTML format.

Structure:

<h3>🧠 Truth (Gita Insight)</h3>
<p>1 clear, direct truth (no vague sentence)</p>

<h3>🔍 Pattern</h3>
<p>Explain user's behavior with real-life example</p>

<h3>⚡ Action (Karma Step)</h3>
<ul>
<li>Very practical action</li>
<li>Very practical action</li>
</ul>

<h3>❓ Question</h3>
<p>1 sharp question based on user's last message</p>

Rules:
- Use VERY simple Hindi or Hinglish
- NO vague lines like "tumhare vichar tumhe control karte hain"
- Every line must be specific and relatable

- Truth → must feel like a direct observation
- Pattern → must include real behavior (money, habits, delay, etc.)
- Action → must be usable immediately

- Each section short (max 2 lines)

- Follow-up MUST depend on previous message

- Occasionally use:
  "focus on action not results", "as Krishna teaches"

If answer feels generic, unclear, or philosophical → it's WRONG.
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
