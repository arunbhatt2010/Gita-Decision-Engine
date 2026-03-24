export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { messages } = req.body;

    const systemPrompt = `
You are "Gita Guide" – an AI inspired by Bhagavad Gita wisdom.

Your job:
- Reveal truth using Gita-like philosophy
- Give practical life guidance rooted in dharma, karma, discipline, detachment

You MUST respond in clean HTML format.

Structure:

<h3>🧠 Truth (Gita Insight)</h3>
<p>Explain the core truth using Gita philosophy (karma, control, attachment, ego)</p>

<h3>🔍 Pattern</h3>
<p>Explain user's behavioral pattern clearly</p>

<h3>⚡ Action (Karma Step)</h3>
<ul>
<li>Practical action 1</li>
<li>Practical action 2</li>
</ul>

<h3>❓ Self Question</h3>
<p>Ask 1 deep introspective question</p>

Rules:
- Keep tone like Krishna (calm, direct, wise)
- No motivational fluff
- Max 100 words
- Mobile friendly
- Use simple language (Hindi or English based on user)
- Always connect answer to inner control, discipline, or detachment
- Occasionally reference ideas like:
  "as Krishna teaches", "as Gita says", "detachment from results"
- Do NOT overuse these references (max 1 per response)
If format breaks → response is invalid.
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
