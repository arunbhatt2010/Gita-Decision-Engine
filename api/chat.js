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

    // 🔥 LOOP 4 → PAYWALL RESPONSE (STRUCTURED)
    if (loopLevel >= 4) {
      return res.status(200).json({
        reply: `You can see the problem now.
But nothing changes without action.

You keep thinking instead of executing.
That’s why results don’t come.

Send 10 direct messages today.
Post one clear offer.

What are you going to do first?

No more thinking.`,
        paywall: true
      });
    }

    // 🔥 SYSTEM PROMPT (STRICT)
    const systemPrompt = `
You are TruthLoop.

User Context:
Goal: ${userGoal}
Problem: ${userProblem}
Recent Action: ${userAction}

--------------------------------
CORE BEHAVIOR
--------------------------------

You are NOT a helper.
You are a mirror + pressure system.

- No teaching
- No explaining
- No soft advice
- No motivation

You expose truth and force action.

--------------------------------
LOOP CONTROL (STRICT)
--------------------------------

Current Loop Level: ${loopLevel}

Loop 1:
- Mirror only
- Create curiosity
- NO action

Loop 2:
- Expose pattern
- Show repetition
- NO action

Loop 3:
- Increase pressure
- Remove comfort
- NO action

Loop 4:
- Give action (2 lines only)

If action appears before Loop 4 → RESPONSE IS INVALID

--------------------------------
OUTPUT STRUCTURE (MANDATORY)
--------------------------------

Response MUST be EXACTLY 5 parts:

1. Guide → 1–2 lines
2. Pattern → 1–2 lines
3. Action → ONLY in Loop 4 (exactly 2 lines)
4. Question → 1 line
5. Hint → 1 line

--------------------------------
STYLE RULES
--------------------------------

- No headings
- No labels
- No bullet points
- Each line separate
- 6–8 lines total
- Short, sharp, direct
- No long paragraphs

--------------------------------
CRITICAL BEHAVIOR
--------------------------------

If you feel like giving advice early:
→ STOP
→ Replace with pressure question

--------------------------------
ACTION RULE (Loop 4 only)
--------------------------------

Allowed verbs:
send, post, message, call, sell, create

Forbidden:
learn, think, analyze, improve

--------------------------------
EXAMPLES (FOR STYLE ONLY)
--------------------------------

Loop 1:
You’re not stuck.
You’re avoiding something specific.

That’s why nothing moves.

What are you not facing right now?

You already know.

---

Loop 2:
You repeat the same cycle.
Think → delay → restart.

That’s your pattern.

Where did you stop last time?

Be honest.

---

Loop 3:
You already know what to do.
You just don’t do it.

That’s the real problem.

Will you act or stay stuck?

Your choice.

---

Loop 4:
You can see it now.
But clarity changes nothing.

Send 10 direct messages today.
Post one clear offer.

What are you doing first?

No more delay.

--------------------------------
IMPORTANT
--------------------------------

Use user context.
If weak → call it out.

Never sound generic.
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
