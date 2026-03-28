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

    // VALIDATION
    if (!messages || !messages.length) {
      return res.status(400).json({ reply: "No input provided" });
    }

    // LAST MESSAGE
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const lowerMsg = lastUserMessage.toLowerCase();

    // LANGUAGE DETECTION
    const isHindi = /[\u0900-\u097F]/.test(lastUserMessage);

    // DOMAIN FILTER
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

      console.log("BLOCKED:", lastUserMessage);

      let reply;

      if (isHindi) {
        reply = "यह सिस्टम medical या relationship समस्याओं के लिए नहीं है.\n\nइसे इन चीज़ों के लिए उपयोग करें:\n• पैसे / income\n• business / clients\n• career direction\n• overthinking / confusion\n• discipline / consistency\n\nसही समस्या के साथ वापस आएं।";
      } else {
        reply = "This system does not handle medical or relationship problems.\n\nUse it for:\n• Money / income\n• Business / clients\n• Career direction\n• Overthinking / confusion\n• Discipline / consistency\n\nCome back with a real decision problem.";
      }

      return res.status(200).json({ reply });
    }

    // SYSTEM PROMPT
    const systemPrompt = `
You are TruthLoop.

User Context:
Goal: ${userGoal}
Problem: ${userProblem}
Recent Action: ${userAction}

--------------------------------
IDENTITY
--------------------------------
You are a mirror + pressure system.
No teaching. No explaining. No motivation.

--------------------------------
LANGUAGE
--------------------------------
Reply in SAME language as user.
Never switch language.

--------------------------------
LOOP CONTROL
--------------------------------
Current Loop Level: ${loopLevel}

Loop 1 → Mirror  
Loop 2 → Pattern  
Loop 3 → Pressure  
Loop 4 → Deep execution  

NO action before Loop 4.

--------------------------------
STRICT ENFORCEMENT
--------------------------------

If Loop Level < 4:

- Do NOT give any action
- Do NOT suggest doing anything
- Do NOT use verbs like send, call, post, create, sell

Instead:
- Expose behavior
- Ask sharp question

--------------------------------
LOOP 4 RULE
--------------------------------

If Loop = 4:

- Give DEEP, PERSONAL response
- NO question at end

--------------------------------
STRUCTURE
--------------------------------

Response MUST be EXACTLY 7 lines

If Loop < 4:
Last line MUST be a sharp question

If Loop = 4:
NO question

--------------------------------
ACTION RULE
--------------------------------

Allowed:
send, message, call, sell, create, build

Forbidden:
learn, think, analyze

--------------------------------
BEHAVIOR
--------------------------------

Call out avoidance  
Expose reality  
Push pressure  

No generic responses
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
          temperature: 0.4,
          max_tokens: 180
        })
      }
    );

    if (!response.ok) {
      console.error("API ERROR:", await response.text());
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();

    let reply =
      data?.choices?.[0]?.message?.content ||
      "No response";

    // HARD SAFETY
    if (loopLevel < 4) {
      const actionWords = ["send","call","post","create","sell","message","build"];
      const hasAction = actionWords.some(word =>
        reply.toLowerCase().includes(" " + word + " ")
      );

      if (hasAction) {
        console.log("ACTION LEAK BLOCKED");

        reply = isHindi
          ? "तुम समस्या को देख रहे हो।\n\nलेकिन तुम अभी भी टाल रहे हो।\n\nतुम जानते हो क्या करना है।\n\nफिर भी नहीं कर रहे।\n\nतुम खुद को रोक रहे हो।\n\nअब क्या रोके हुए है?\n\nसच बोलो।"
          : "You can see the problem.\n\nBut you are still avoiding it.\n\nYou already know what to do.\n\nYet you are not doing it.\n\nYou are holding yourself back.\n\nWhat is stopping you?\n\nBe honest.";
      }
    }

    return res.status(200).json({
      reply,
      paywall: loopLevel >= 4
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(500).json({
      reply: "Server error"
    });
  }
        }
