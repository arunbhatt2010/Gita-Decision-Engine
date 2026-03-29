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

    // PROMPT
    const systemPrompt = `
You are TruthLoop.

Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}

You are not a teacher.
You are a pressure mirror.
Never say anything that applies to everyone.
Always point to a specific behavior of THIS user.
RULES:

- No generic advice
- No explanation
- No teaching tone
- No repeating same sentence

If response feels similar → rewrite from new angle

If user is vague:
Call it out directly

Example:
"You are hiding behind 'I don't know'. Say it clearly."

STAGE: ${loopLevel}

Stage 1–3:
- No action
- End with question

Stage 4:
- Give 1–2 direct actions
- No question

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
            ...messages.slice(-4)
          ],
          temperature: 0.9,
          max_tokens: 300
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();

    let reply = data?.choices?.[0]?.message?.content || "No response";

    // SOFT SAFETY (NO OVERWRITE)
    if (loopLevel < 4) {
      const forbidden = ["send","call","post","create","sell","build"];
      const hasAction = forbidden.some(word => reply.toLowerCase().includes(word));

      if (hasAction) {
        reply = reply.replace(/send|call|post|create|sell|build/gi, "");
        reply += isHindi
          ? "\n\nतुम जल्दी action पर भाग रहे हो… पहले सच देखो।"
          : "\n\nYou are rushing to action… face the real issue first.";
      }
    }

    // STAGE 4 (EXECUTION)
    if (loopLevel >= 4) {
      reply = isHindi
        ? `अब साफ है।

तुम ${userProblem} में नहीं फंसे हो…
तुम उस काम से बच रहे हो जो result देगा।

आज:
एक ऐसा काम करो जो सीधे पैसे से जुड़ा हो  
और उसे बाहर push करो

अब या तो करोगे  
या फिर यही repeat होगा`
        : `Now it's clear.

You are not stuck in ${userProblem}  
you are avoiding the real move

Today:
Do one task tied to results  
and push it out

Act  
or repeat the loop`;
    }

    return res.status(200).json({
      reply,
      paywall: loopLevel >= 4
    });

  } catch (error) {
    return res.status(500).json({ reply: "Server error" });
  }
  }
