export default async function handler(req, res) {
  try {
    // ✅ SAFE BODY PARSE
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const { messages, loopLevel = 1 } = body;

    if (!messages || !messages.length) {
      return res.status(400).json({ reply: "No input provided" });
    }

    const userInput =
      messages[messages.length - 1].content.toLowerCase();

    // 🧠 Pattern Detection (UNCHANGED)
    let selectedPattern = "lack of clarity";

    if (userInput.includes("client")) selectedPattern = "weak positioning";
    if (userInput.includes("focus")) selectedPattern = "distraction";
    if (userInput.includes("delay")) selectedPattern = "overthinking";
    if (userInput.includes("grow")) selectedPattern = "no clear revenue goal";
    if (userInput.includes("tired")) selectedPattern = "burnout";
    if (userInput.includes("fear")) selectedPattern = "fear of failure";

    // 🧠 Gita principles (UNCHANGED)
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

    // 🧠 SYSTEM PROMPT (UNCHANGED + STRICT FORMAT ADD)
    const systemPrompt = `
You are "TruthLoop" — a brutal clarity engine.

Use this principle: "${randomPrinciple}"
Use this pattern: "${selectedPattern}"

IDENTITY:
- You expose what the user is avoiding
- You do NOT comfort — you confront
- You sound certain, not polite

CORE RULES:
- Identify ONE core problem only
- The explanation MUST reflect the given pattern
- Do NOT introduce a new reason outside the pattern
- The Guide MUST directly reflect the pattern in plain behavior
- Do NOT use a different psychological explanation than the pattern
- Guide must be at least 20 words and describe visible behavior, not internal feelings
- Use concrete language instead of vague phrases like "struggling", "improve", "better", "more"
- No "maybe", "could be", "might be"
- No generic advice
- Use simple, direct human language

QUESTION RULES:
- Must include time + action + measurable output
- No philosophical questions

LOOP SYSTEM:
- loopLevel = 1 → normal
- loopLevel > 1 → deeper, uncomfortable

FORMAT:
Guide + Pattern + Action + Question

STRICT FORMAT RULE (MANDATORY):

You MUST respond exactly in this format:

Guide:
<20-25 words, visible behavior only>
Guide must explain visible behavior in detail with specific examples. Do NOT be short.
Pattern:
(${selectedPattern})

Action:
- Step 1
- Step 2

Question:
<one uncomfortable question with time + action + number>

RULES:
- Do NOT write a paragraph
- Do NOT merge sections
- Each section MUST be on new line
- Follow structure strictly
`;

    // 🚀 API CALL
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("GROQ ERROR:", text);
      return res.status(500).json({
        reply: "⚠️ AI unstable. Try again."
      });
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("INVALID JSON:", text);
      return res.status(500).json({
        reply: "⚠️ Invalid AI response"
      });
    }

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
}
