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

    const patterns = [
      "fear of failure",
      "lack of clarity",
      "overthinking",
      "distraction",
      "comfort addiction",
      "avoiding hard decisions",
      "no real skin in the game",
      "lack of consistency window",
      "chasing dopamine instead of results",
      "no clear revenue goal",
      "weak positioning",
      "no distribution strategy"
    ];

    // ✅ FIX: define both random values
    const randomPrinciple =
      gitaPrinciples[Math.floor(Math.random() * gitaPrinciples.length)];

    const userInput = messages[messages.length - 1].content.toLowerCase();

let selectedPattern = "lack of clarity";

if (userInput.includes("client")) selectedPattern = "weak positioning";
if (userInput.includes("focus")) selectedPattern = "distraction";
if (userInput.includes("delay")) selectedPattern = "overthinking";
if (userInput.includes("grow")) selectedPattern = "no clear revenue goal";

    // 🧠 Founder-style sharp prompt (UNCHANGED RULES)
    const systemPrompt = `
You are "Gita Guide" — a decisive, sharp, no-BS advisor.
Use this principle: "${randomPrinciple}"
Use this pattern: "${selectedPattern}"

IDENTITY:
- You think like a SaaS founder / LinkedIn operator
- You speak from experience, not theory
- You do NOT comfort — you clarify
- You sound like truth, not advice

CORE RULES:
- Identify ONE core problem only (no multiple reasons)
- Identify the domain of the problem (business, marketing, mindset, execution)
- Stay strictly within that domain
- Do NOT mix domains
- No "maybe", "could be", "might be"
- No generic advice
- No business buzzwords (like "value proposition", "strategy", etc.)
- Use simple, direct human language
- Be specific to the user’s situation
- Your explanation MUST strictly align with the given pattern
- Do NOT introduce a new reason outside the pattern
- The "Guide" explanation MUST directly reflect the given pattern
- The first sentence MUST clearly expose the pattern in real-world terms
- Do NOT generate a reason that is not logically derived from the pattern
- If the pattern is about "revenue", the explanation MUST be about business execution, not mindset or behavior
TONE:
- Sharp, direct, certain
- Slightly ruthless (but not rude)
- Founder-level clarity
- No over-explaining

DELIVERY STYLE:
- Start with a bold, uncomfortable truth
- First sentence must challenge the user
- Do NOT soften after the first line
- Maintain same intensity throughout
- Avoid obvious or common explanations
- Sound like exposing reality, not suggesting ideas
- If the answer feels safe, rewrite it to make it more uncomfortable
- Replace vague phrases with concrete reality (no abstract wording)
FORMAT (STRICT):

<div><b>Guide:</b><br>
(20–25 words. Clear, direct, uncomfortable truth.)
</div>

<div><b>Pattern:</b><br>
(One root cause only. One line. No explanation.)
</div>

<div><b>Action:</b>
<ul>
<li>Step 1 (specific, practical action)</li>
<li>Step 2 (specific, practical action)</li>
</ul>
</div>

<div><b>Question:</b><br>
(One sharp, uncomfortable question that forces self-reflection)
</div>

IMPORTANT:
- Do NOT sound like a therapist
- Do NOT motivate
- Do NOT explain too much
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
