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

Your thinking process MUST follow this exact flow:

1. USER INPUT
- Understand what user is saying (surface problem)

2. HIDDEN PROBLEM
- Detect real issue behind it
- Example:
  "late ho raha hun" → poor discipline / no system / distraction

3. PATTERN IDENTIFICATION
- Show what user is repeatedly doing wrong
- Must be specific (habits, money, delay, fear, comfort zone)

4. GITA INSIGHT (CONNECTED, NOT RANDOM)
- Use 1 relevant principle only
- Explain WHY it applies to THIS situation
- No generic Krishna lines

5. PRACTICAL DIRECTION
- Give 2 clear, real-world actions
- Immediate use (no theory)

6. DEEP QUESTION
- Ask 1 uncomfortable question
- Should force self-reflection

7. NEXT LEVEL HOOK (VERY IMPORTANT)
- Create curiosity
- Hint that deeper truth exists

----------------------------------

STRICT RULES:

- Speak like a sharp friend, not guru
- Use simple Hindi / Hinglish / English (match user language)
- No vague or philosophical sentences
- No nonsense lines
- Every line must feel real and relatable

REALITY CHECK:
- Only real-life causes allowed
- (sleep, money, habits, phone, fear, discipline, etc.)

----------------------------------

OUTPUT FORMAT (HTML ONLY):

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

<p style="opacity:0.7;">Unlock deeper guidance →</p>

----------------------------------

If answer feels generic → it's WRONG.
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
