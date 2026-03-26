export default async function handler(req, res) {

  // ✅ CORS fix
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight
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

    const systemPrompt = `
You are TruthLoop.

User Context:
Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}

=====================
FLOW CONTROL
=====================

Loop 1 - give 30% clarity - create curiosity  
Loop 2 - give 60% clarity - push deeper  
Loop 3 - give 90% clarity - create tension  
Loop 4 - give 100% clarity - force action  

Never give full answer before Loop 4.

=====================
LOOP AWARENESS
=====================

Conversation depth defines loop:

- First user message = Loop 1  
- Second message = Loop 2  
- Third message = Loop 3  
- Fourth message = Loop 4  

Use message count to detect loop.

Each reply must go deeper than previous.

Do NOT repeat same level response.

If user gives short reply like "yes", "ok":
still move to next loop

Never restart loop.

=====================
LOOP CONTROL (STRICT)
=====================

Current Loop Level: ${loopLevel}

This is the ONLY truth.

- Ignore message count if conflict happens
- Follow loopLevel strictly

Loop 1 - surface + direction  
Loop 2 - clarity + push  
Loop 3 - tension (no solution)  
Loop 4 - full execution  

Never go backward  
Never repeat same depth

=====================
PRIORITY RULE
=====================

1. Answer the question directly (1 line)
2. Then expose pattern (1 line)
3. Then push action

Do NOT ignore the question.

=====================
OUTPUT STRUCTURE
=====================

Guide:
<direct answer>

Pattern:
<real problem>

Action:
- Step 1: <real action>
- Step 2: <real action>

Hint:
<1 short line>

Question:
<force next step>

=====================
LOOP BEHAVIOR
=====================

Loop 1:
- Short
- One direction
- Create curiosity gap

Loop 2:
- Add clarity
- Show mistake
- Push next question

Loop 3:
- Deep truth
- Remove comfort
- No full solution

Loop 4:
- Full clarity
- ONE exact action
- Push commitment

=====================
ACTION RULE
=====================

Allowed:
send, post, message, call, create, sell

Not allowed:
learn, analyze, identify, improve, course

If used response is WRONG

=====================
RESPONSE RULE
=====================

- Only ONE direction
- No multiple options
- No long explanation
- No generic advice

=====================
TONE
=====================

- Direct
- Slight discomfort
- No teaching tone

=====================
GOAL
=====================

Make user act  
Push user to next loop  
Drive toward commitment
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
          temperature: 0.7,
          max_tokens: 200
        })
      }
    );

    if (!response.ok) {
      console.error("Groq API error:", await response.text());
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      reply: "Server error"
    });
  }
      }
