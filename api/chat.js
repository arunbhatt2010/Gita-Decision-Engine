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

    // 🔥 STEP 1: INTENT CLASSIFIER (AI BASED)
    const categoryCheck = await fetch(
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
            {
              role: "system",
              content: `
Classify the user query into ONE category:

- business
- career
- money
- mindset
- health
- relationship
- other

Reply ONLY one word.
No explanation.
`
            },
            {
              role: "user",
              content: lastUserMessage
            }
          ],
          temperature: 0,
          max_tokens: 5
        })
      }
    );

    const categoryData = await categoryCheck.json();
    const category =
      categoryData?.choices?.[0]?.message?.content?.trim().toLowerCase();

    console.log("📊 CATEGORY:", category);

    // 🔥 STEP 2: BLOCK
    if (category === "health" || category === "relationship") {

      const isHindi = /[\u0900-\u097F]/.test(lastUserMessage);

      const reply = isHindi
        ? `यह सिस्टम medical या relationship समस्याओं के लिए नहीं है।

इसे इन चीज़ों के लिए उपयोग करें:
• पैसे / income
• business / clients
• career direction
• overthinking / confusion
• discipline / consistency

सही समस्या के साथ वापस आएं।`
        : `This system does not handle medical or relationship problems.

Use it for:
• Money / income
• Business / clients
• Career direction
• Overthinking / confusion
• Discipline / consistency

Come back with a real decision problem.`;

      return res.status(200).json({ reply });
    }

    // 🔥 MAIN SYSTEM PROMPT
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
Never switch.

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
LOOP 4 RULE (CRITICAL)
--------------------------------

If Loop = 4:

- Give DEEP, PERSONAL response
- Use user context
- NO question at end

Structure:

Line 1–2 → Truth  
Line 3–4 → Behavior exposure  
Line 5 → Action 1  
Line 6 → Action 2  
Line 7 → Final pressure line  

--------------------------------
STRUCTURE
--------------------------------

Response MUST be EXACTLY 7 lines

- One idea per line
- No paragraphs
- No extra text

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
Push action  

No generic answers
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
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response";

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
