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

// 🧠 SMART PROMPT (FINAL)
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

Goal:
Answer → then push deeper

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
CONVERSATION FLOW
=====================

- First user input = Loop 1
- Each next response goes deeper
- Do NOT restart

=====================
LOOP INTERPRETATION
=====================

Current Loop Level: ${loopLevel}

Loop 1:
- Surface issue
- Hook

Loop 2:
- Clear avoidance

Loop 3:
- Deep pattern
- No solution

Loop 4:
- Full clarity
- One exact action

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
BEHAVIOR RULES
=====================

- Mirror user's words
- Expose ONE problem
- Show reason (fear / avoidance)
- Be direct
- No soft words
- No generic advice

=====================
ACTION RULES
=====================

- Must be immediate (5–10 min)
- Must be real (send, write, delete, decide)
- No thinking tasks

=====================
RESPONSE MODE
=====================

Loop 1:
- Full structure
- Short
- Hook

Loop 2:
- Full structure
- Clear direction

Loop 3:
- Only Guide + Pattern + Question
- No action
- Create tension

Loop 4:
- Guide + ONE action
- No steps

=====================
ANTI-REPETITION
=====================

- Do NOT repeat same style
- Change verbs (write / send → decide / choose)

=====================
DECISION ENGINE
=====================

If user asks:
"which strategy" / "what should I do"

Loop 2:
- Give 2 options

Loop 3:
- Remove one

Loop 4:
- Give ONE decision

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
