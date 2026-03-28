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

      const reply = isHindi
        ? "यह सिस्टम medical या relationship समस्याओं के लिए नहीं है.\n\nसही समस्या के साथ वापस आएं।"
        : "This system does not handle medical or relationship problems.\n\nCome back with a real decision problem.";

      return res.status(200).json({ reply });
    }

    // 🔥 CLEAN PROMPT (NO OVERLOAD)
    const systemPrompt = `
You are TruthLoop.

User Context:
Goal: ${userGoal}
Problem: ${userProblem}
Recent Action: ${userAction}

--------------------------------
CORE
--------------------------------

You are not a helper.

You do not guide.
You do not explain.
You do not teach.

You expose.

--------------------------------
STYLE
--------------------------------

Short  
Direct  
Personal  
Uncomfortable  

--------------------------------
RULES
--------------------------------

- No advice
- No "you can", "try", "should"
- No generic lines
- No explanation tone

--------------------------------
BEHAVIOR
--------------------------------

- Call out avoidance
- Break illusions
- Speak directly to the user

If input is vague:
→ call it out

--------------------------------
STAGE SYSTEM
--------------------------------

Current Stage: ${loopLevel}

Stage 1–3:
- Expose behavior
- Show pattern
- End with a sharp question

Stage 4:
- Give 1–2 clear actions
- No question
- Close with pressure

--------------------------------
LANGUAGE
--------------------------------

Reply in same language as user.

--------------------------------
TEST
--------------------------------

If response feels helpful → WRONG  
If response feels uncomfortable → CORRECT
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
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.5,
          max_tokens: 300
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();

    let reply = data?.choices?.[0]?.message?.content || "No response";

    // 🔥 SAFETY (unchanged)
    if (loopLevel < 4) {
      const forbidden = ["send","call","post","create","sell","build"];
      const hasAction = forbidden.some(word =>
        reply.toLowerCase().includes(word)
      );

      if (hasAction) {
        reply = isHindi
          ? "तुम एक्टिव हो, लेकिन असली कदम से बच रहे हो।\n\nतुम जानते हो क्या करना है, फिर भी टाल रहे हो।\n\nअभी सच में तुम्हें क्या रोक रहा है?"
          : "You are active, but avoiding the real move.\n\nYou already know what to do, yet you delay it.\n\nWhat is actually stopping you right now?";
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
