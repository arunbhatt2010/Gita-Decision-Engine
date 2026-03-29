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

    // 🔥 BASIC CLARITY CHECK (Stage 1)
    if (loopLevel === 1) {

      const hasDetail =
        lastUserMessage.split(" ").length > 6 &&
        (lowerMsg.includes("i ") || lowerMsg.includes("main") || lowerMsg.includes("मैं"));

      if (!hasDetail) {
        return res.status(200).json({
          reply: isHindi
            ? "रुको। साफ बोलो।\n\nएक लाइन में:\nतुम क्या करते हो + कहाँ करते हो + अभी क्या काम नहीं कर रहा"
            : "Stop.\n\nBe specific.\n\nIn ONE line:\nWhat you do + where you do it + what exactly is failing"
        });
      }
    }

    // 🔥 IMPROVED PROMPT (NO REPETITION)
    const systemPrompt = `
You are TruthLoop.

Context:
Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}

Rules:
- Never repeat the same sentence.
- Never use phrases like:
  "If you hide details"
  "Looking deeper"
  "You're being vague"
- No generic advice.
- No motivational tone.

Structure:
1. Start with a sharp observation (1–2 lines)
2. Point out what the user is actually doing (real behavior)
3. Expose what they are avoiding (1–2 lines)
4. End with ONE sharp question (only if stage < 4)

Strict:
- Only ONE question mark allowed
- Keep it under 8 lines
- Make it feel personal, not template

Stage: ${loopLevel}

Stage 1–3:
- End with ONE question

Stage 4:
- No question
- Give direct conclusion

Tone:
- Direct
- Slightly uncomfortable
- Clear, not rude
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
          max_tokens: 250
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content || "No response";

    // 🔥 SAFETY (Stage 1–3 → no action words)
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
