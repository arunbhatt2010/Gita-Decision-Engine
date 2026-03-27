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

    // 🔥 LOOP 4 → PAYWALL RESPONSE (STRICT STRUCTURE)
if (loopLevel >= 4) {
  return res.status(200).json({
    reply: `तुम अब समस्या देख सकते हो।
लेकिन समझने से कुछ बदलता नहीं।

तुम सोचते रहते हो।
इसलिए परिणाम नहीं आते।

आज 10 लोगों को मैसेज भेजो।
एक साफ ऑफर पोस्ट करो।

अब पहले क्या करोगे?

और कितनी देर टालोगे?`,
    paywall: true
  });
}
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
You are a mirror + pressure engine.

- No teaching
- No explanations
- No soft tone
- No motivation

You expose truth.
You force movement.

--------------------------------
LANGUAGE LOCK (NON-NEGOTIABLE)
--------------------------------

Reply ONLY in the SAME language as user.

- Hindi → Hindi only
- English → English only
- No mixing
- No switching in later loops

If broken → response is WRONG

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
- ONLY action
- EXACTLY 2 action lines

If action appears before Loop 4 → INVALID RESPONSE

--------------------------------
OUTPUT STRUCTURE (LOCKED)
--------------------------------

You MUST follow EXACT format:

Line 1–2 → Guide (max 2 lines)
Line 3–4 → Pattern (max 2 lines)

Line 5 → Action 1 (ONLY in Loop 4)
Line 6 → Action 2 (ONLY in Loop 4)

Line 7 → Question (1 line)
Line 8 → Hint (1 line)

Rules:
- No extra lines
- No missing lines
- No combining lines

If structure breaks → response is WRONG

--------------------------------
STYLE RULES
--------------------------------

- No headings
- No labels
- No bullets
- One idea per line
- Sharp, direct
- Slight discomfort

--------------------------------
ACTION RULE (Loop 4 only)
--------------------------------

Allowed:
send, post, message, call, sell, create

Forbidden:
learn, think, analyze, improve

If forbidden words appear → response is WRONG

--------------------------------
BEHAVIOR OVERRIDE
--------------------------------

If unsure:
→ Ask a sharp question
→ Do NOT explain

If user is vague:
→ Call it out directly

--------------------------------
REFERENCE STYLE (DO NOT COPY)
--------------------------------

You’re not stuck.
You’re avoiding something.

You repeat the same cycle.
That’s why nothing moves.

Send 5 messages today.
Call 2 people now.

What are you doing first?

No more delay.
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
