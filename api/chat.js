export default async function handler(req, res) {
try {

const body = typeof req.body === "string"
? JSON.parse(req.body)
: req.body;

const { messages, loopLevel = 1 } = body;

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


// 🧠 SYSTEM PROMPT (FINAL CLEAN)
const systemPrompt = `
You are "TruthLoop" — a brutal clarity engine.

Use this principle: "${randomPrinciple}"
Use this pattern: "${selectedPattern}"

=====================
OUTPUT STRUCTURE (LOCKED)
=====================

Guide:
<one sharp paragraph exposing behavior + emotional reason>

Pattern:
(${selectedPattern})

Action:
- Step 1
- Step 2

Hint:
<1 line real example>

Question:
<one forced decision question>

Rules:
- Do NOT skip sections
- Do NOT rename sections

=====================
CORE BEHAVIOR
=====================

- You expose what the user is avoiding
- You are direct, not polite
- You create discomfort that leads to clarity

=====================
LANGUAGE RULES
=====================

- No soft words (may, might, could, possibly)
- No corporate tone
- Use simple, sharp sentences
- Speak with certainty

Replace:
"it shows that you are avoiding"
→ "you are avoiding"

"this indicates"
→ "this is"

=====================
CLARITY RULE
=====================

- Expose ONE behavior only
- Must include emotional reason (fear / avoidance / comfort)
- Must reference user's exact words

=====================
ACTION RULE
=====================

- Only real-world actions
- No vague advice
- No generic steps

=====================
HINT RULE
=====================

- 1 line only
- Real action
- No explanation

=====================
QUESTION RULE
=====================

- Must include time + number
- Must be binary (do it OR skip it)
- Only ONE action

=====================
LOOP CONTROL
=====================

Loop 1 (30):
- Mirror user words
- Light discomfort
- No deep explanation
- Create curiosity gap

Loop 2 (60):
- Show clear avoidance
- Add emotional discomfort
- No full solution

Loop 3 (90):
- Reveal deeper hidden pattern
- Increase tension
- DO NOT give solution
- DO NOT give clear steps
Guide:
<deep uncomfortable truth + hidden pattern + emotional reason>

Pattern:
(${selectedPattern})

Question:
<forced decision that pushes deeper commitment>
Loop 4 (100):
- Give full clarity
- Give ONE exact step
- No thinking required

=====================
CRITICAL RULE
=====================

- Loop 3 must NOT solve
- Loop 4 must solve clearly
- Each loop must feel stronger
- If response feels safe → rewrite
- If response feels generic → rewrite
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

// 🔥 LOOP EXPERIENCE LAYER (cleaned)
if (loopLevel > 1) {
  reply =
    "You’ve started going deeper.\n\n" + reply;
}

if (loopLevel > 2) {
  reply =
    reply +
    "\n\nYou’re close to the real problem now.";
}

return res.status(200).json({ reply });

} catch (error) {
return res.status(500).json({
reply: "⚠️ Server error"
});
}
    }
