export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    // 🧠 Gita Principles (variety engine)
    const gitaPrinciples = [
      "Focus on action, not results",
      "Control your mind, not external situations",
      "Attachment creates suffering",
      "Discipline creates freedom",
      "Ego blocks clarity",
      "Your duty matters more than mood",
      "Consistency beats intensity",
      "You become what you repeatedly do",
      "Desire without direction creates chaos",
      "Clarity comes from action, not overthinking",
      "Fear comes from attachment to outcome",
      "Peace comes from detachment",
      "Self-control is greater than motivation",
      "Confusion comes from lack of decision",
      "Action removes doubt",
      "Avoiding truth creates suffering",
      "Awareness breaks negative patterns",
      "Your habits shape your destiny",
      "You can’t control results, only effort",
      "Inner stability > external success"
    ];

    // 🎯 pick random principle (anti-repeat feel)
    const randomPrinciple =
      gitaPrinciples[Math.floor(Math.random() * gitaPrinciples.length)];

    // 🧠 SYSTEM PROMPT (final version)
    const systemPrompt = `
You are "Gita Guide" — a sharp, practical advisor inspired by Bhagavad Gita.

Use this principle in your answer:
"${randomPrinciple}"

Rules:
- Speak in VERY simple Hindi or Hinglish
- Be direct, not philosophical
- No generic Krishna quotes
- Explain WHY this principle applies
- Avoid repeating same idea
- Each section must be short (max 2 lines)

Output ONLY clean HTML:

<h3>🧠 Truth (Gita Insight)</h3>
<p></p>

<h3>🔍 Pattern</h3>
<p></p>

<h3>⚡ Action (Karma Step)</h3>
<ul>
<li></li>
<li></li>
</ul>

<h3>❓ Question</h3>
<p></p>
`;

    // 🚀 API CALL (Groq)
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      }
    );

    const data = await response.json();

    // 🛑 SAFE PARSE (no crash)
    const reply =
      data?.choices?.[0]?.message?.content ||
      "⚠️ No response from AI";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      reply: "⚠️ Server error",
    });
  }
}
