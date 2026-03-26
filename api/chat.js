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

// 🧠 Simple Prompt (STABLE)
const systemPrompt = `
You are TruthLoop — a clarity engine.

User Context:
Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}

Rules:

Output format:
Guide:
Pattern:
Action:
- Step 1
- Step 2
Hint:
Question:

Behavior:
- Mirror user's words
- Expose one problem
- Show reason (fear / avoidance)

Language:
- Short
- Direct
- No soft words

Action:
- Must be immediate (5–10 min)
- Must be real action (send, write, fix)
- No thinking tasks

Decision:
If user asks "which strategy":
- Loop 2 → give 2 options
- Loop 3 → suggest 1
- Loop 4 → exact step

Loop:

Loop 1:
- Hook only

Loop 2:
- Clear problem

Loop 3:
- Deep pattern

Loop 4:
- Exact solution

Goal:
Push user to act now.
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

// ✅ SAFE PARSE
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

// ✅ SAFE RESPONSE
let reply =
  data?.choices?.[0]?.message?.content;

if (!reply) {
  reply = "⚠️ No valid response. Try again.";
}

// 🔥 LOOP EXPERIENCE
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
