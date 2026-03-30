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

    // 🔥 KYC CHECK (Stage 1 only — but dynamic tone)
    if (loopLevel === 1) {

      const hasDetail =
        lastUserMessage.split(" ").length > 6 &&
        (lowerMsg.includes("i ") || lowerMsg.includes("main") || lowerMsg.includes("मैं"));

      if (!hasDetail) {
        return res.status(200).json({
          reply: isHindi
            ? "स्पष्ट नहीं है।\n\nतुम बात घुमा रहे हो।\n\nएक लाइन में बताओ:\nतुम क्या करते हो + कहाँ करते हो + अभी क्या काम नहीं कर रहा"
            : "Not clear.\n\nYou're speaking in circles.\n\nGive ONE line:\nWhat you do + where you do it + what exactly is failing right now"
        });
      }
    }

    // 🔥 SYSTEM PROMPT
    const systemPrompt = `
You are TruthLoop.

Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}

----------------------------------

Rules:
- Never repeat sentence patterns
- No generic statements
- No teaching tone
- Keep it sharp and personal
- Avoid words like: might, maybe, likely, could

----------------------------------

STAGE: ${loopLevel}

----------------------------------

Structure:

1. Start with ONE observation about user behavior  
2. State what they are actually doing  
3. Expose what they are avoiding  

----------------------------------

Progression Rule:

- Each stage MUST continue the SAME problem
- Do NOT introduce new angles
- Stage 3 must go deeper into Stage 2
- Stage 4 must resolve Stage 2 + 3

----------------------------------

STAGE 1:
- Neutral tone
- Ask ONE clear question
- Example style (not fixed script)

Example:
"Not clear.
You're mixing things.
What exactly have you tried so far?"

----------------------------------

STAGE 2:
- Max 6 lines
- Identify ONE behavior pattern
- Do NOT explain fully
- No solution
- Give one incomplete insight
- End with ONE question

----------------------------------

STAGE 3:
- Max 7 lines
- Continue SAME pattern
- Go deeper into WHY
- Show consequence
- Add partial direction (still incomplete)
- End with ONE question

----------------------------------

STAGE 4:
- Max 8 lines
- No question
- Connect previous answers
- Give 2–3 direct actionable steps
- No fluff

----------------------------------

Content Rules:

- Every line must add value
- No repetition
- No long explanation

----------------------------------

Tone:

Stage 1 → Neutral  
Stage 2 → Slightly uncomfortable  
Stage 3 → Confronting  
Stage 4 → Clear + decisive  
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
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content || "No response";

    // 🔥 SAFETY (Stage 1–3)
    if (loopLevel < 4) {
      const forbidden = ["send","call","post","create","sell","build"];
      const hasAction = forbidden.some(word => reply.toLowerCase().includes(word));

      if (hasAction) {
        reply = reply.replace(/send|call|post|create|sell|build/gi, "");
      }
    }

    // 🔥 STAGE 4 CLEANUP
    if (loopLevel >= 4) {

      reply = reply.replace(/\?/g, "");

      reply += isHindi
        ? "\n\nअब करना है या नहीं — यही फर्क बनाएगा।"
        : "\n\nNow it's on you to act or stay stuck.";
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
