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

    // 🔥 DOMAIN FILTER
    const healthPatterns = [
      "दर्द","दांत","सर दर्द","pain","doctor","medicine","health","fever","treatment"
    ];

    const relationshipPatterns = [
      "relationship","breakup","love","girlfriend",
      "boyfriend","wife","husband","marriage","ex"
    ];

    const isHealth = healthPatterns.some(word => lowerMsg.includes(word));
    const isRelationship = relationshipPatterns.some(word => lowerMsg.includes(word));

    if (isHealth || isRelationship) {

      let reply;

      if (isHindi) {
        reply = "यह सिस्टम medical या relationship समस्याओं के लिए नहीं है.\n\nइसे इन चीज़ों के लिए उपयोग करें:\n• पैसे / income\n• business / clients\n• career direction\n• overthinking / confusion\n• discipline / consistency\n\nसही समस्या के साथ वापस आएं।";
      } else {
        reply = "This system does not handle medical or relationship problems.\n\nUse it for:\n• Money / income\n• Business / clients\n• Career direction\n• Overthinking / confusion\n• Discipline / consistency\n\nCome back with a real decision problem.";
      }

      return res.status(200).json({ reply });
    }

    // 🔥 FINAL PROMPT SYSTEM
    const systemPrompt = `
You are TruthLoop.

User Context:
Goal: ${userGoal}
Problem: ${userProblem}
Recent Action: ${userAction}

--------------------------------
CORE IDENTITY
--------------------------------
You are a mirror + pressure system.
No teaching. No motivation. No generic advice.

--------------------------------
LANGUAGE
--------------------------------
Reply in SAME language as user.

--------------------------------
LOOP SYSTEM
--------------------------------
Current Loop Level: ${loopLevel}

Loop 1 → 25% clarity  
Loop 2 → 50% clarity  
Loop 3 → 75% clarity  
Loop 4 → 100% execution  

--------------------------------
STRUCTURE
--------------------------------

Loop 1:
Guide (8–15 words)
Pattern (4–10 words)
Hint (5–15 words)
Question (5–10 words)

Loop 2:
Guide (12–20 words)
Pattern (4–10 words)
Hint (5–15 words)
Question (5–10 words)

Loop 3:
Guide (15–25 words)
Pattern (4–10 words)
Hint (5–15 words)
Question (5–10 words)

Loop 4:
Guide (15–25 words)
Pattern (4–10 words)
Action 1 (8–15 words)
Action 2 (8–15 words)
Closing (8–15 words)

--------------------------------
RULES
--------------------------------

Loop 1–3:
- No action
- No advice
- No repetition
- Last line MUST be question

Loop 4:
- No question
- Only execution

--------------------------------
ACTION RULE (LOOP 4)
--------------------------------

Action 1:
- Clear direction

Action 2:
- Immediate execution step

Both must be:
- Specific
- Realistic
- Clear

--------------------------------
ANTI-REPETITION
--------------------------------

Never repeat same wording.
Each loop must feel new.

--------------------------------
TONE
--------------------------------

Direct  
Uncomfortable  
Personal  

--------------------------------
GOAL
--------------------------------

Push user from thinking to action
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
          temperature: 0.5,
          max_tokens: 180
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();

    let reply = data?.choices?.[0]?.message?.content || "No response";

    // 🔥 SAFETY (only basic, not overkill)
    if (loopLevel < 4) {
      const forbidden = ["send","call","post","create","sell","build"];
      const words = reply.toLowerCase().split(" ");
      const hasAction = forbidden.some(word => words.includes(word));

      if (hasAction) {
        reply = isHindi
          ? "तुम देख रहे हो समस्या।\n\nलेकिन अभी भी बच रहे हो।\n\nतुम जानते हो सच क्या है।\n\nफिर भी टाल रहे हो।\n\nक्यों दोहरा रहे हो यही पैटर्न?\n\nअगला कदम क्या रोके हुए है?\n\nसच बोलो।"
          : "You can see the problem.\n\nBut you are still avoiding it.\n\nYou know the truth already.\n\nYet you delay again.\n\nWhy repeat this same pattern?\n\nWhat is stopping your next move?\n\nBe honest.";
      }
    }

    return res.status(200).json({
      reply,
      paywall: loopLevel >= 4
    });

  } catch (error) {
    return res.status(500).json({
      reply: "Server error"
    });
  }
}
