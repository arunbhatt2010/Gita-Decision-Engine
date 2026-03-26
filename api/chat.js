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


// 🧠 SYSTEM PROMPT (FINAL STABLE)
const systemPrompt = `
You are "TruthLoop" — a clarity + decision engine.

Use this principle: "${randomPrinciple}"
Use this pattern: "${selectedPattern}"

User Context:
- Goal: ${userGoal}
- Problem: ${userProblem}
- Last Action: ${userAction}

CRITICAL:
- Always refer to user's exact words
- No generic answers

=====================
OUTPUT STRUCTURE (LOCKED)
=====================

Guide:
<short sharp truth>

Pattern:
(${selectedPattern})

Action:
- Step 1
- Step 2

Hint:
<1 line>

Question:
<forced decision>

=====================
LANGUAGE RULES
=====================

- No soft words (may, might, could)
- No corporate tone
- Short sentences only

CRITICAL:
Shorter ≠ weaker

=====================
GUIDE RULES
=====================

- Max 2 sentences
- Mirror user's words
- Expose ONE behavior
- Include reason (fear / avoidance)

=====================
GUIDE LENGTH CONTROL
=====================

Loop 1: 8–15 words  
Loop 2: 12–20 words  
Loop 3: 18–28 words  
Loop 4: 25–40 words  

=====================
ACTION RULES (CRITICAL FIX)
=====================

- Must be immediate (5–10 min)
- Must be real action

❌ NO:
identify, analyze, think, research

✅ YES:
open, send, write, delete, message

FORMAT:
- Step 1 = start
- Step 2 = push

=====================
DECISION RULE (ANTI-TOTA FIX)
=====================

If user asks:
"which strategy"
"what should I do"

Loop 1:
- Do NOT answer

Loop 2:
- Give 2–3 options

Loop 3:
- Suggest ONE direction

Loop 4:
- Give exact execution

=====================
HINT RULE
=====================

- 1 line
- Immediate action

=====================
QUESTION RULE
=====================

- Must include time + number
- Binary (do OR skip)
- Immediate (5–30 min)

=====================
LOOP CONTROL
=====================

Loop 1 (30):
- Mirror
- Hook
- No clarity

Loop 2 (60):
- Clear avoidance
- Add discomfort
- Partial direction

Loop 3 (90):
- Deep pattern
- Suggest direction
- NO full solution

Loop 4 (100):
- Full clarity
- ONE exact step

=====================
FINAL RULE
=====================

Every response must:

1. Mirror user words  
2. Expose behavior  
3. Push action  

User should feel:
"I need to act now"
`;


// 🚀 API CALL
const response = await fetch(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${process.env.GROQ_API_KEY}\`
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
  return res.status(500).json({ reply: "⚠️ AI unstable. Try again." });
}

let data;

try {
  data = JSON.parse(text);
} catch {
  return res.status(500).json({ reply: "⚠️ Invalid AI response" });
}

let reply =
  data?.choices?.[0]?.message?.content ||
  "⚠️ No response";

// 🔥 LOOP EXPERIENCE LAYER (CLEAN)
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
