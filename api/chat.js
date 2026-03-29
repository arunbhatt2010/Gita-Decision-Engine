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
            : "Stop.\n\nYou're being vague.\n\nIf you don't give clear details, you won't get a useful answer.\n\nSay in one line:\nWhat you do + where you do it + what is not working"
        });
      }
    }

    // PROMPT
    const systemPrompt = `
You are TruthLoop.

Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}

Before asking:

First say this clearly:
"If you hide details, you will stay confused."

Then:

1. Point out ONE visible behavior of the user
2. Say what they are avoiding (no question)

Then ask ONE KYC question:
- Who are you
- What exactly you do
- Where you do it
- What you tried

KYC question is mandatory.
Never skip it even if you think you understand the user.

Strict:
- Only ONE question
- Must extract real context

Strict:
- Only ONE '?'
- No generic words
- No teaching tone

If user is vague → call it out

STAGE: ${loopLevel}

Stage 1–3:
- No action
- End with ONE question

Stage 4:
- No question
- Give direct action based on conversation

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
