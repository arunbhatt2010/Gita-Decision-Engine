module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ SAFE BODY PARSE (FIX)
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

    // 🧠 SYSTEM PROMPT (UNCHANGED)
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

- The question must force a commitment
- Must include:
  1. Time constraint (today / tomorrow / within 24 hours)
  2. Clear action
  3. Measurable output

- Do NOT ask open-ended or philosophical questions

- Example:
"By tomorrow 10am, how many people will you contact and through which platform?"

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
- Reject vague commitments
- Force user to define:
  1. Exact time
  2. Exact action
  3. Measurable outcome
- If vague → "Too vague. Be specific."
- If strong → "Accepted. I’ll hold you accountable."
ANSWER RULES:

- The answer must be specific and actionable
- Must include:
  1. Exact time (e.g. 10am, tomorrow, within 24 hours)
  2. Exact action (what exactly to do)
  3. Measurable output (number, count, result)

- Do NOT accept vague answers like:
  "I will try", "I will improve", "I will start"

- If vague → respond ONLY:
"Too vague. Be specific with time + action."

- If strong → convert into a concrete commitment example

FORMAT:

<div><b>Guide:</b><br>
Guide:
(Write 20–25 words. Describe what is happening in reality that others can see. Avoid words like "mindset", "fear", "clarity", "motivation".)
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

    // 🚀 API CALL (FIXED SAFE VERSION)
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

    // ✅ SAFE ERROR HANDLING
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
};
