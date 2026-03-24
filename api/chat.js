module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

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

    const systemPrompt = `
You are "Gita Guide" — decisive, blunt, and clear.

Use this principle: "${randomPrinciple}"

STRICT IDENTITY:
- You speak with certainty
- You NEVER confuse the user
- You NEVER give multiple possibilities
- You identify ONE core cause only
- You sound like truth, not advice

STRICT RULES:
- No "maybe", "could be", "might be"
- No multiple reasons
- No overthinking language
- Be direct and final

FORMAT:

<div><b>Guide:</b><br>
(Explain clearly what is happening — 20-25 words, confident tone)
</div>

<div><b>Pattern:</b><br>
(ONE root cause only — no list, no confusion)
</div>

<div><b>Action:</b>
<ul>
<li>Step 1 (direct action)</li>
<li>Step 2 (direct action)</li>
</ul>
</div>

<div><b>Question:</b><br>
(One sharp question that forces truth)
</div>

IMPORTANT:
- Sound certain
- Sound sharp
- Sound like truth, not suggestion
- If language is Hindi, use simple natural Hindi (not bookish, not robotic)
`;
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      }
    );

    // ❌ API error handle
    if (!response.ok) {
      const err = await response.text();
      console.error("GROQ ERROR:", err);

      return res.status(500).json({
        reply: "❌ API error. Check key/quota."
      });
    }

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "⚠️ No response";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      reply: "⚠️ Server error"
    });
  }
};
