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
    const healthPatterns = ["pain","doctor","medicine","health"];
    const relationshipPatterns = ["relationship","breakup","love","girlfriend","boyfriend"];

    if (healthPatterns.some(w => lowerMsg.includes(w)) ||
        relationshipPatterns.some(w => lowerMsg.includes(w))) {
      return res.status(200).json({
        reply: "This system is not for this problem. Come back with a real decision problem."
      });
    }

    // BASIC CHECK
    if (loopLevel === 1) {
      if (lastUserMessage.split(" ").length < 5) {
        return res.status(200).json({
          reply: "Stop.\n\nBe specific.\n\nWhat exactly are you doing and what is not working?"
        });
      }
    }

    // 🔥 CLEAN PROMPT (stable)
    const systemPrompt = `
You are TruthLoop.

Do NOT repeat phrases.
Do NOT use templates.

Speak like a sharp observer.

Structure:
- 1 line observation
- 2–3 lines reality check
- 1 line what user avoids
- 1 sharp question (only if stage < 4)

Keep it short and direct.
`;

    let reply = "";

    try {
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

      const data = await response.json();

      reply = data?.choices?.[0]?.message?.content || "";

    } catch (apiError) {
      console.error("API FAIL:", apiError);
    }

    // 🔥 HARD FALLBACK (NEVER BLANK)
    if (!reply || reply.trim() === "") {

      reply = isHindi
        ? "तुम स्पष्ट नहीं हो।\n\nतुम क्या कर रहे हो और कहाँ अटक रहे हो — साफ बताओ।"
        : "You're not clear.\n\nWhat exactly are you doing and where is it failing?";
    }

    // STAGE 4
    if (loopLevel >= 4) {
      reply = reply.replace(/\?/g, "");
      reply += "\n\nNow it's on you to act or stay stuck.";
    }

    return res.status(200).json({
      reply,
      paywall: loopLevel >= 4
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(200).json({
      reply: "Something broke. Try again."
    });
  }
      }
