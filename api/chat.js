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

    // 🔥 KYC CHECK (Stage 1 only)
    if (loopLevel === 1) {

      const hasDetail =
        lastUserMessage.split(" ").length > 6 &&
        (lowerMsg.includes("i ") || lowerMsg.includes("main") || lowerMsg.includes("मैं"));

      if (!hasDetail) {
        return res.status(200).json({
          reply: isHindi
            ? "रुको।\n\nतुम साफ नहीं बोल रहे।\n\nअगर सही जानकारी नहीं दोगे तो सही जवाब नहीं मिलेगा।\n\nएक लाइन में बताओ:\nतुम क्या करते हो + कहाँ करते हो + क्या काम नहीं कर रहा"
            : "Stop.\n\nYou're being vague.\n\nIf you don't give clear details, you won't get a useful answer.\n\nAnswer in ONE line:\nWhat you do + where you do it + what exactly is failing right now"
        });
      }
    }

    // PROMPT
    const systemPrompt = `
You are TruthLoop.

Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}

Rules:
- Never repeat the same sentence
- Never use phrases like:
  "If you hide details"
  "You're being vague"
  "The reality is"
- No generic explanations
- No teaching tone
- Keep it sharp and personal
- Max 6–7 lines

----------------------------------

STAGE: ${loopLevel}

----------------------------------

Structure:

1. Start with ONE observation about user behavior  
2. Point out what they are actually doing  
3. Expose what they are avoiding (make it slightly uncomfortable)  

----------------------------------

STAGE 1:
- No pressure
- Focus on missing clarity
- Ask ONE simple but specific question

----------------------------------

STAGE 2:
- Add discomfort
- Call out behavior clearly
- End with ONE sharp question

----------------------------------

STAGE 3:
- Increase pressure
- Show pattern (loop / mistake / gap)
- Make user feel “something is off”
- End with ONE strong question

----------------------------------

STAGE 4:
- No question
- Give direct clarity
- Connect dots from previous answers
- Keep it short and obvious

----------------------------------
Value Control System:

STAGE 2:
- Max 6 lines
- Give only 25% insight
- Show pattern, not solution
- Add one small hint (not usable alone)
- User should feel: "कुछ समझ आया, पर पूरा नहीं"

STAGE 3:
- Max 7 lines
- Give 50% insight
- Expand same pattern deeper
- Show consequence of continuing this
- Add partial direction (but incomplete)
- User should feel: "अब समझ आ रहा है, पर missing piece है"

STAGE 4:
- Max 8 lines
- Give full 100% clarity
- Connect all previous answers
- Give 2–3 actionable steps
- Make it feel obvious and direct
- User should feel: "अब साफ है क्या करना है"

----------------------------------

Content Rules:

- Every line must add value (no filler)
- No long explanation
- No generic advice
- No repetition
- No teaching tone

----------------------------------
Follow value progression strictly across stages.
Tone + Value Balance:

- Mix discomfort + insight
- Do not just confront — reveal something real
- Each stage should feel like progression, not repetition

Strict:
- Only ONE question mark (?) in Stage 1–3
- No question in Stage 4
- No fluff
- No long paragraphs

----------------------------------

Tone:
Stage 1 → Neutral  
Stage 2 → Slightly uncomfortable  
Stage 3 → Sharp + confronting  
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
          temperature: 0.8,
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

      // remove question
      reply = reply.replace(/\?/g, "");

      // remove generic patterns
      reply = reply
        .replace(/do one task.*$/gim, "")
        .replace(/today.*$/gim, "")
        .replace(/act.*$/gim, "");

      // add pressure ending
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
