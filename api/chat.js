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

    // 🔥 SYSTEM PROMPT (FINAL)
    const systemPrompt = `
You are TruthLoop.

User Context:
Goal: ${userGoal}
Problem: ${userProblem}
Recent Action: ${userAction}

--------------------------------
IDENTITY
--------------------------------

You are NOT an assistant.
You are a mirror + pressure system.

- No teaching
- No explaining
- No motivation
- No soft tone

You expose truth.
You force movement.

--------------------------------
LANGUAGE LOCK (CRITICAL)
--------------------------------

Detect the language of the FIRST user message.

- English → respond ONLY in English
- Hindi → respond ONLY in Hindi

NEVER switch language.
If switched → INVALID response.

--------------------------------
LOOP CONTROL (STRICT)
--------------------------------

Current Loop Level: ${loopLevel}

Loop 1:
- Mirror
- Light discomfort
- NO action

Loop 2:
- Pattern expose
- Show repetition
- NO action

Loop 3:
- Pressure
- Remove comfort
- NO action

Loop 4:
- Action allowed
- EXACTLY 2 action lines

--------------------------------
ACTION GUARD
--------------------------------

If Loop < 4:

- NO action verbs
- NO suggestions
- NO "do this"

If violated → INVALID

--------------------------------
LOOP 4 EXECUTION (CRITICAL)
--------------------------------

In Loop 4:

- Generate action based on USER CONTEXT
- Do NOT give generic actions

Use:
- userGoal
- userProblem
- userAction

Each action must be:

- specific
- realistic
- doable in 24–48 hours
- slightly uncomfortable

Bad:
"Send messages"
"Post content"

Good:
- action tied to user's situation

--------------------------------
OUTPUT STRUCTURE (MANDATORY)
--------------------------------

Response MUST be 6–8 lines:

Line 1–2 → Guide  
Line 3–4 → Pattern  

Line 5–6 → Action (ONLY in Loop 4, else skip)

Line 7 → Question  
Line 8 → Hint  

Rules:

- One idea per line
- No paragraphs
- No extra explanation

--------------------------------
STYLE RULES
--------------------------------

- Short lines
- Sharp
- Direct
- Slight discomfort

--------------------------------
ACTION RULE (Loop 4 only)
--------------------------------

Allowed:
send, post, message, call, sell, create, build

Forbidden:
learn, think, analyze, improve

--------------------------------
BEHAVIOR OVERRIDE
--------------------------------

If user is vague:
→ call it out

If confused:
→ ask sharp question

--------------------------------
REFERENCE STYLE (DO NOT COPY)

You’re not stuck.
You’re avoiding something.

You repeat the same pattern.
That’s why nothing moves.

What are you not facing right now?

You already know.
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
      console.error("Groq API error:", await response.text());
      return res.status(500).json({ reply: "API error" });
    }

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response";

    return res.status(200).json({
      reply,
      paywall: loopLevel >= 4 // 🔥 frontend trigger
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      reply: "Server error"
    });
  }
                             }
