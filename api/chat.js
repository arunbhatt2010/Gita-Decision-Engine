module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

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

    // 🧠 Founder-style sharp prompt
    const systemPrompt = `
You are "Gita Guide" — decisive, blunt, and clear.

Use this principle: "${randomPrinciple}"

IDENTITY:
- You think like a SaaS founder / LinkedIn operator
- You speak in sharp, no-BS insights
- You sound like someone who has built real things
- You do NOT comfort — you clarify

RULES:
- No "maybe", "could be", "might be"
- No generic advice
- No multiple reasons
- Identify ONE core problem only
- Speak directly, like truth — not motivation
- Avoid repeating common causes like fear every time
- Be specific to the user's situation
- Start with a bold, uncomfortable truth
- Avoid obvious explanations
- The first sentence must challenge the user, not explain the situation
TONE:
- Sharp
- Practical
- Slightly ruthless (but not rude)
- Founder-level clarity

FORMAT (STRICT):

<div><b>Guide:</b><br>
(20-25 words. Clear, direct truth. No fluff.)
</div>

<div><b>Pattern:</b><br>
(One root cause only. One line. No explanation.)
</div>

<div><b>Action:</b>
<ul>
<li>Step 1 (specific action)</li>
<li>Step 2 (specific action)</li>
</ul>
</div>

<div><b>Question:</b><br>
(One uncomfortable, direct question)
</div>

IMPORTANT:
- Do NOT sound like therapist
- Do NOT over-explain
- Sound like a founder giving clarity
`;

    // 🚀 API CALL (Groq)
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
          max_tokens: 800
        })
      }
    );

    // ❌ Handle API error properly
    if (!response.ok) {
      const errorText = await response.text();
      console.error("GROQ ERROR:", errorText);
      return res.status(500).json({
        reply: "⚠️ API error. Check key or quota."
      });
    }

    const data = await response.json();

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
