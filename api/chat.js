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

    // 🔥 FINAL PROMPT (UPGRADED)
    const systemPrompt = `
You are TruthLoop.

User Context:
Goal: ${userGoal}
Problem: ${userProblem}
Recent Action: ${userAction}

You are a mirror + pressure system.
No teaching. No motivation. No generic advice.

Reply in SAME language as user.

Current Stage: ${loopLevel}

Stage 1–3:
- No action
- End with a question

Stage 4:
- Give 1–2 clear actions
- No question

--------------------------------
ANTI-REPETITION (CRITICAL)
--------------------------------

Every response must feel new.

- Never reuse sentence structure
- Never repeat phrases like:
"You are avoiding"
"You are active"
"You already know"

If similar → rewrite from new angle

--------------------------------
ANTI-GENERIC
--------------------------------

If response fits many people → reject

Make it feel personal

--------------------------------
STYLE
--------------------------------

No explanation  
No teaching tone  
Only direct observation  

--------------------------------
TENSION
--------------------------------

Each response must increase pressure

--------------------------------
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

    // 🔥 SAFETY (SOFT — NO OVERRIDE)
    if (loopLevel < 4) {
      const forbidden = ["send","call","post","create","sell","build"];
      const hasAction = forbidden.some(word =>
        reply.toLowerCase().includes(word)
      );

      if (hasAction) {
        reply += isHindi
          ? "\n\nतुम जल्दी solution पर भाग रहे हो… पहले सच देखो।"
          : "\n\nYou are rushing to action… face the real issue first.";
      }
    }

    // 🔥 STAGE 4 (EXECUTION MODE)
    if (loopLevel >= 4) {

      reply = isHindi
        ? `अब साफ दिख रहा है।

तुम ${userProblem} से अटके नहीं हो…
तुम उस चीज़ से बच रहे हो जो सीधा result दे सकती है।

आज ही ये करो:

एक ऐसा काम चुनो जो सीधे outcome या पैसे से जुड़ा हो  
और उसे push करो — छुपाओ मत

तुम जानते हो वो क्या है।

अब या तो करोगे…
या फिर यही pattern दोहराओगे।`
        : `Now it's clear.

You are not stuck because of ${userProblem}…
you are avoiding the move that creates results.

Do this today:

Pick one task directly tied to outcome or money  
and push it out — do not hide it

You know what that is.

Now either act…
or repeat the same pattern.`;

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
