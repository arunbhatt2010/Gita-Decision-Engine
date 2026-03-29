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

    // 🔥 FINAL PROMPT (STAGE SYSTEM)
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
STAGE SYSTEM
--------------------------------
Current Stage: ${loopLevel}

Stage 1 → surface clarity  
Stage 2 → deeper pattern  
Stage 3 → uncomfortable truth  
Stage 4 → execution  

--------------------------------
RESPONSE STYLE
--------------------------------

Write like a real human speaking directly.

Use short paragraphs (mobile friendly):
- 2 to 4 small paragraphs
- Each paragraph 1–2 lines

--------------------------------
FLOW
--------------------------------

Response should naturally include:

- What the user is doing
- The pattern they are stuck in
- The uncomfortable truth

Stage 1–3:
End with a sharp question that pushes forward.

Stage 4:
No question.
Give clear execution steps.

--------------------------------
STRICT
--------------------------------

- No labels
- No bullet points
- No robotic phrases
- No fragmented sentences

--------------------------------
RULES
--------------------------------

Stage 1–3:
- No action
- No advice
- Must end with a question

Stage 4:
- Give 1–2 clear actions
- Practical and direct
- Close with pressure

--------------------------------
TONE
--------------------------------

Direct  
Uncomfortable  
Personal  

--------------------------------
GOAL
--------------------------------

Break illusion  
Force clarity  
Push action
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
  { role: "user", content: lastUserMessage }
],
          temperature: 0.7,
          max_tokens: 400
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();

    let reply = data?.choices?.[0]?.message?.content || "No response";

    // 🔥 SAFETY
    if (loopLevel < 4) {
      const forbidden = ["send","call","post","create","sell","build"];
      const hasAction = forbidden.some(word =>
        reply.toLowerCase().includes(word)
      );

      if (hasAction) {
        reply = isHindi
          ? "तुम काम कर रहे हो, लेकिन सही दिशा में नहीं बढ़ रहे हो।\n\nतुम एक्टिव हो, पर असली कदम लेने से बच रहे हो।\n\nतुम्हें पता है क्या करना चाहिए, फिर भी टाल रहे हो।\n\nअभी सच में तुम्हें क्या रोक रहा है?"
          : "You are active, but not moving in the right direction.\n\nYou are doing work, but avoiding the real move.\n\nYou already know what needs to be done, yet you delay it.\n\nWhat is actually stopping you right now?";
      }
    }// 🔥 STAGE 4 (NICHOD + ACTION)
if (loopLevel >= 4) {

  const context = `
Goal: ${userGoal}
Problem: ${userProblem}
Recent Action: ${userAction}
User said: ${lastUserMessage}
`;

  reply = isHindi
    ? `यहीं असली बात है।

${context}

तुम वही कर रहे हो जो safe लगता है…  
लेकिन वही नहीं कर रहे जो सच में फर्क डालता।

अब सीधा करो:

ऐसा 1–2 कदम बताओ जो इसी समस्या को सीधे तोड़े,
ना कि general improvement दे।

शर्त:
- आज ही किया जा सके
- सीधा असर दिखे
- user के exact situation से जुड़ा हो

अंत में एक line लिखो जो उसे अभी action लेने पर मजबूर करे।`
    : `This is the core.

${context}

You are doing what feels safe…
but avoiding what actually moves things.

Now give:

1–2 actions that directly break THIS exact problem,
not general improvement.

Conditions:
- Can be done today
- Direct impact
- Based on this exact situation

End with a line that forces immediate action.`;

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
