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

    // 🔥 FINAL PROMPT (FIXED HUMAN OUTPUT)
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
STRUCTURE (CRITICAL)
--------------------------------

Loop 1–3:
- Exactly 4 lines
- Each line MUST be a complete sentence (minimum 8 words)

Line 1 → clear observation  
Line 2 → behavior pattern  
Line 3 → uncomfortable truth  
Line 4 → sharp question  

Loop 4:
- Exactly 5 lines
- Each line MUST be a complete sentence

Line 1 → truth  
Line 2 → behavior exposure  
Line 3 → action 1  
Line 4 → action 2  
Line 5 → closing pressure  

--------------------------------
STRICT RULES
--------------------------------

- NO labels like Guide, Pattern, Hint  
- NO short fragments  
- NO broken phrases  
- NO bullet style writing  

Each line must feel like natural human speech.

--------------------------------
LOOP RULES
--------------------------------

Loop 1–3:
- No action
- No advice
- Last line MUST be a question

Loop 4:
- No question
- Only execution

--------------------------------
ACTION RULE (LOOP 4)
--------------------------------

- Action 1 = clear direction  
- Action 2 = immediate execution  

Both must be:
- specific  
- realistic  
- direct  

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
          temperature: 0.6,
          max_tokens: 220
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();

    let reply = data?.choices?.[0]?.message?.content || "No response";

    // 🔥 SAFETY (ANTI ACTION LEAK)
    if (loopLevel < 4) {
      const forbidden = ["send","call","post","create","sell","build"];
      const hasAction = forbidden.some(word =>
        reply.toLowerCase().includes(word)
      );

      if (hasAction) {
        reply = isHindi
          ? "तुम समस्या देख रहे हो, लेकिन अभी भी उससे बच रहे हो।\n\nतुम्हें पता है क्या करना चाहिए, फिर भी कदम नहीं उठा रहे हो।\n\nतुम activity में छिप रहे हो, action से नहीं।\n\nअब असली वजह क्या है जो तुम्हें रोक रही है?"
          : "You can clearly see the problem, but you are still avoiding it.\n\nYou already know what needs to be done, yet you are not acting on it.\n\nYou are hiding behind activity instead of taking real action.\n\nWhat is actually stopping you right now?";
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
