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
You are "Gita Guide" — sharp, direct advisor.

Use this principle: "${randomPrinciple}"

STRICT RULES:
- Each section MUST have at least 20-25 words
- No short answers
- No generic advice
- No "I need more context"
- Keep it practical, not motivational

FORMAT:

<div><b>Guide:</b><br>
(20-25 words insight)
</div>

<div><b>Pattern:</b><br>
(20-25 words real cause)
</div>

<div><b>Action:</b>
<ul>
<li>Step 1 (clear + practical)</li>
<li>Step 2 (clear + practical)</li>
</ul>
</div>

<div><b>Question:</b><br>
(1 deep uncomfortable question)
</div>

IMPORTANT:
- Do NOT write short lines
- Do NOT skip explanation
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
