export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const {
      messages,
      loopLevel = 1,
      userGoal = "",
      userProblem = "",
      userAction = ""
    } = body;

    if (!messages || !messages.length) {
      return res.status(400).json({ reply: "No input provided" });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const lowerMsg = lastUserMessage.toLowerCase();

    const isHindi = /[\u0900-\u097F]/.test(lastUserMessage);

    // DOMAIN FILTER
    const healthPatterns = ["दर्द","दांत","सर दर्द","pain","doctor","medicine","health","fever","treatment"];
    const relationshipPatterns = ["relationship","breakup","love","girlfriend","boyfriend","wife","husband","marriage","ex"];

    const isHealth = healthPatterns.some(word => lowerMsg.includes(word));
    const isRelationship = relationshipPatterns.some(word => lowerMsg.includes(word));

    if (isHealth || isRelationship) {
      return res.status(200).json({
        reply: isHindi
          ? "यह सिस्टम इस समस्या के लिए नहीं है। सही समस्या के साथ वापस आएं।"
          : "This system does not handle this problem. Come back with a real decision problem."
      });
    }

    // PROMPT
    const systemPrompt = `
You are TruthLoop.

Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}
Before asking:

1. Say ONE specific behavior of the user
2. Say what they are avoiding (no question)

Then ask ONLY ONE question at the end.

Strict:
- No multiple questions
- No question inside explanation
- Only ONE '?' allowed in entire reply
If more than one '?' is generated → rewrite the response
Never use abstract words like:
strategy, improve, better, more, growth

Always refer to something the user is actually doing
(e.g. posting, messaging, writing, not replying, avoiding)
You are not a teacher.
You are a pressure mirror.

If user gives clear behavior:
→ Attack that specific behavior

If user is vague:
→ Do NOT guess
→ Do NOT give generic truth
→ Call it out directly
→ Force them to clarify with a sharp question

Never break the flow.
Never exit conversation.


RULES:

- No generic advice
- No explanation
- No teaching tone
- No repeating same sentence

If response feels similar → rewrite from new angle

If user is vague:
Call it out directly

Example:
"You are hiding behind 'I don't know'. Say it clearly."

STAGE: ${loopLevel}

Stage 1–3:
- No action
- End with question

Stage 4:
- Give 1–2 direct actions
- No question

STYLE:
- Direct
- Personal
- Uncomfortable
`;

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
        ...messages   // ✅ full context (IMPORTANT)
      ],
      temperature: 0.9,
      max_tokens: 300
    })
  }
);

if (!response.ok) {
  return res.status(500).json({ reply: "API error" });
}

const data = await response.json();

let reply = data?.choices?.[0]?.message?.content || "No response";


// 🔥 SOFT SAFETY (Stage 1–3 only, no overwrite)
if (loopLevel < 4) {
  const forbidden = ["send","call","post","create","sell","build"];
  const hasAction = forbidden.some(word => reply.toLowerCase().includes(word));

  if (hasAction) {
    reply = reply.replace(/send|call|post|create|sell|build/gi, "");
    reply += isHindi
      ? "\n\nतुम जल्दी action पर भाग रहे हो… पहले सच देखो।"
      : "\n\nYou are rushing to action… face the real issue first.";
  }
}


// 🔥 STAGE 4 (NO TEMPLATE, NO CONTROL — ONLY CLEANUP)
if (loopLevel >= 4) {

  // ❌ remove typical generic AI lines if any
  reply = reply
    .replace(/do one task.*$/gim, "")
    .replace(/today.*$/gim, "")
    .replace(/act.*loop.*$/gim, "");

  // ✅ ensure tone ends with pressure (without template)
  if (!reply.toLowerCase().includes("today") && !reply.toLowerCase().includes("आज")) {
    reply += isHindi
      ? "\n\nअब या तो इसे सच में करके दिखाओ… या फिर यही pattern चलता रहेगा।"
      : "\n\nNow either act on this… or stay stuck in the same pattern.";
  }
}

    return res.status(200).json({
      reply,
      paywall: loopLevel >= 4
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      reply: "Server error"
    });
  }
}


