module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ LOOP LEVEL ADDED
    const { messages, loopLevel = 1 } = req.body;

    const userInput =
      messages[messages.length - 1].content.toLowerCase();

    // 🧠 Pattern Detection (SMART, NOT RANDOM)
    let selectedPattern = "lack of clarity";

    if (userInput.includes("client")) selectedPattern = "weak positioning";
    if (userInput.includes("focus")) selectedPattern = "distraction";
    if (userInput.includes("delay")) selectedPattern = "overthinking";
    if (userInput.includes("grow")) selectedPattern = "no clear revenue goal";
    if (userInput.includes("tired")) selectedPattern = "burnout";
    if (userInput.includes("fear")) selectedPattern = "fear of failure";

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

    // 🧠 SYSTEM PROMPT (TruthLoop v2)
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
- No "maybe", "could be", "might be"
- No generic advice
- Use simple, direct human language

TONE:
- Sharp
- Direct
- Slightly uncomfortable
- No over-explaining

DELIVERY STYLE:
- Start with a bold, uncomfortable truth
- First sentence must challenge the user
- Maintain intensity throughout
- Convert the pattern into real-life behavior
- Do NOT drift away from the pattern
- If the answer feels safe, make it more uncomfortable

LOOP SYSTEM:
- loopLevel = 1 → initial clarity
- loopLevel > 1 → deeper, more uncomfortable truth
- Each loop must go deeper than previous
- Do NOT repeat the same explanation

COMMITMENT RULES:
- Reject vague commitments (e.g. "I will work", "I will try")
- Force user to define:
  1. Exact time
  2. Exact action
  3. Measurable outcome
- If vague → respond ONLY: "Too vague. Be specific."
- If strong → respond ONLY: "Accepted. I’ll hold you accountable."

FORMAT:

<div><b>Guide:</b><br>
(20–25 words)
</div>

<div><b>Pattern:</b><br>
(${selectedPattern})
</div>

<div><b>Action:</b>
<ul>
<li>Step 1</li>
<li>Step 2</li>
</ul>
</div>

<div><b>Question:</b><br>
(One uncomfortable question)
</div>
`;

    // 🚀 GROQ API CALL
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
          max_tokens: 700,
          // ✅ LOOP SIGNAL (AI ko depth samajhne ke liye)
          metadata: {
            loopLevel: loopLevel
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("API ERROR:", err);
      return res.status(500).json({
        reply: "⚠️ AI unstable. Try again."
      });
    }

    const data = await response.json();

    let reply =
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
