export default async function handler(req, res) {
  try {

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const { messages, loopLevel = 1, userGoal, userProblem, userAction } = body;

    if (!messages || !messages.length) {
      return res.status(400).json({ reply: "No input provided" });
    }

    const systemPrompt = `
You are TruthLoop.

User:
Goal: ${userGoal}
Problem: ${userProblem}
Action: ${userAction}

Loop: ${loopLevel}

Rules:
- First answer directly (1 line)
- Then push action
- No theory
- No long explanation

Format:

Guide:
Pattern:
Action:
- Step 1
- Step 2
Hint:
Question:

Loop 3:
Guide + Pattern + Question only

Loop 4:
Guide + ONE action

Goal:
Make user act immediately
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
            max_tokens: 250
          })
        }
      );

      if (!response.ok) {
        throw new Error("API failed");
      }

      const data = await response.json();

      reply = data?.choices?.[0]?.message?.content;

      if (!reply) {
        throw new Error("Empty response");
      }

    } catch (err) {

      // 🔥 FALLBACK (NEVER BREAK)
      reply = `
Guide:
Start with outreach — fastest way to make money now

Pattern:
You are waiting instead of acting

Action:
- Step 1: Send 5 messages offering any service
- Step 2: Post 1 simple offer

Hint:
Open WhatsApp or LinkedIn

Question:
Will you send 5 messages in next 15 minutes or not?
`;
    }

    // Loop experience layer
    if (loopLevel === 2) {
      reply = "You're starting to see it.\n\n" + reply;
    }

    if (loopLevel === 3) {
      reply = "Now it's getting uncomfortable.\n\n" + reply;
    }

    if (loopLevel === 4) {
      reply = "This is the real problem.\n\n" + reply;
    }

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({
      reply: "⚠️ Server error"
    });
  }
  }
