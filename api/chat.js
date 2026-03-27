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

    // 🔥 LOOP 4 → SOFT PAYWALL
    if (loopLevel >= 4) {
      return res.status(200).json({
        reply: `
You can see what’s wrong now.

But knowing isn’t enough.

Right now, you don’t need more thinking.
You need exact execution.

That’s the difference between stuck and results.

You can keep looping here…
or move forward.

Your call.
        `,
        paywall: true
      });
    }

    // 🔥 MAIN SYSTEM PROMPT
    const systemPrompt = `
You are TruthLoop.

User Context:
Goal: ${userGoal}
Problem: ${userProblem}
Recent Action: ${userAction}

---
CRITICAL RULE:

Do NOT give actionable steps before Loop 4.

If action is given in Loop 1, 2, or 3 → response is WRONG.

Loop 1 = Mirror only  
Loop 2 = Pattern only  
Loop 3 = Pressure only  
Loop 4 = Action
You do NOT comfort.
You do NOT explain.
You force clarity and action.

---

RESPONSE STYLE:

- No headings
- No labels
- Short sharp lines
- 5–7 lines max
- Each line = one idea
- No fluff

---

RESPONSE FLOW (hidden):

1. Direct answer
2. Pattern expose
3. Real problem
4. 1–2 real actions
5. Pressure line
6. Forcing question

---

ACTION RULE:

Allowed:
send, post, message, call, create, sell

Not allowed:
learn, analyze, think, improve

---

LOOP CONTROL:

Current Loop Level: ${loopLevel}

Loop 1:
- Light clarity
- Create curiosity

Loop 2:
- Expose pattern
- Remove illusion

Loop 3:
- Increase tension
- Give partial direction (not full solution)

Never go backward.
Never repeat same depth.

---
---

REFERENCE EXAMPLES (STRICT BEHAVIOR GUIDE)

These are not to be copied directly.
They define tone, depth, and progression for each loop.

---

Loop 1 Example:

You’re not stuck.

You just haven’t faced the real problem yet.

Right now, you’re looking at the surface…
not what’s actually holding you back.

That’s why nothing is clear.

If you had to guess —
what are you avoiding right now?

---

Loop 2 Example:

You’re not confused.

You’re repeating the same pattern.

You think more, delay action,
then start again when it feels right.

So nothing actually moves.

This isn’t lack of clarity.
It’s avoidance in disguise.

Where exactly did you stop last time?

---

Loop 3 Example:

You already know what’s wrong.

But you keep doing the same thing.

You avoid the uncomfortable step,
then wonder why results don’t change.

So you stay stuck.

You can take one real action today…
or stay in this loop.

What are you actually going to do?

---

Loop 4 Example:

You can see the problem now.

But knowing won’t change anything.

What you need is execution —
clear, direct, and uncomfortable.

That’s where most people stop.

You can keep looping here…
or move forward.

Your call.

---
TONE:

- Direct
- Slight discomfort
- No teaching
- No motivation

---

IMPORTANT:

Use user context deeply.
If goal/problem/action is weak → call it out.

---

OUTPUT STYLE EXAMPLE:

You’re not stuck. You’re avoiding a decision.

You keep thinking instead of acting.

Right now, your problem isn’t strategy — it’s lack of visible action.

Send 5 direct messages today.
Post one clear offer.

You already know this.

Will you do it now or delay again?
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
