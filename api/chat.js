export default async function handler(req, res) {
try {

const body = typeof req.body === "string"
? JSON.parse(req.body)
: req.body;

const { messages, loopLevel = 1, userGoal, userProblem, userAction } = body;

if (!messages || !messages.length) {
  return res.status(400).json({ reply: "No input provided" });
}

const userInput =
  messages[messages.length - 1].content.toLowerCase();

// 🧠 Pattern Detection
let selectedPattern = "lack of clarity";

if (userInput.includes("client")) selectedPattern = "weak positioning";
if (userInput.includes("focus")) selectedPattern = "distraction";
if (userInput.includes("delay")) selectedPattern = "overthinking";
if (userInput.includes("grow")) selectedPattern = "no clear revenue goal";
if (userInput.includes("tired")) selectedPattern = "burnout";
if (userInput.includes("fear")) selectedPattern = "fear of failure";

// 🧠 SMART PROMPT (FINAL UPGRADED)
const systemPrompt = `
You are TruthLoop — a clarity engine.

User Context:
Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}

=====================
PRIORITY RULE (CRITICAL)
=====================

1. First understand user question
2. Give DIRECT relevant answer
3. Then expose pattern (if needed)

- Do NOT ignore the question
- Do NOT jump to psychology first

=====================
RELEVANCE RULE
=====================

- Every response MUST directly relate to user's question
- If answer does NOT solve the question → rewrite

Check:
"Did I actually answer the question?"

=====================
BALANCE RULE
=====================

- 70% = useful answer
- 30% = pattern exposure

=====================
STRATEGY SHARPNESS RULE
=====================

- Do NOT give generic options
- Always bias toward ONE strong direction

❌ WRONG:
"you can choose content or ads"

✅ RIGHT:
"Start with outreach — it's fastest for your stage"

- If giving options:
→ Max 2
→ Clearly suggest one

=====================
NO GENERIC STRATEGY RULE
=====================

- Do NOT say:
"identify audience"
"analyze market"
"define USP"

- Instead:
Give real actions

Example:
"Send 5 DMs today"
"Post 1 content now"

=====================
LOOP 1 ANSWER STYLE
=====================

- Give ONE clear direction
- Keep it short
- Slight push

Structure:
Answer → slight expose → question

=====================
CONVERSATION FLOW
=====================

- First input = Loop 1
- Each reply = deeper
- Do NOT restart

=====================
LOOP INTERPRETATION
=====================

Current Loop Level: ${loopLevel}

Loop 1:
- Surface
- Hook

Loop 2:
- Avoidance

Loop 3:
- Deep pattern
- No solution

Loop 4:
- Full clarity
- One action

=====================
OUTPUT BASE
=====================

Guide:
Pattern:
Action:
- Step 1
- Step 2
Hint:
Question:

=====================
ACTION RULES
=====================

- Immediate (5–10 min)
- Real actions only
- No thinking

=====================
RESPONSE MODE
=====================

Loop 1:
- Full structure
- Short
- Direction first

Loop 2:
- Full structure
- Strong clarity

Loop 3:
- Only Guide + Pattern + Question

Loop 4:
- Guide + ONE action

=====================
ANTI-REPETITION
=====================

- Change wording each time
- Avoid same patterns

=====================
DECISION ENGINE
=====================

If user asks strategy:

Loop 2 → give 2 options  
Loop 3 → remove one  
Loop 4 → force one  

=====================
GOAL
=====================

Push user to act NOW
`;


// 🚀 API CALL
const response = await fetch(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.GROQ_API_KEY
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 400
    })
  }
);

// SAFE PARSE
let data;

try {
  data = await response.json();
} catch {
  return res.status(500).json({
    reply: "⚠️ AI response broken. Retry."
  });
}

if (!response.ok) {
  return res.status(500).json({
    reply: data?.error?.message || "⚠️ API failed"
  });
}

let reply =
  data?.choices?.[0]?.message?.content;

if (!reply) {
  reply = "⚠️ No valid response. Try again.";
}

// LOOP EXPERIENCE
if (loopLevel === 2) {
  reply = "You're starting to see it.\n\n" + reply;
}

if (loopLevel === 3) {
  reply = "Now it's getting uncomfortable.\n\n" + reply;
}

if (loopLevel === 4) {
  reply = "This is the real problem.\n\n" + reply;
}

return res.status(200).json({ reply });

} catch (error) {
return res.status(500).json({
reply: "⚠️ Server error"
});
}
      }
