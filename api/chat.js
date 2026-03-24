export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    // 🧠 Gita Principles (variety engine)
    const gitaPrinciples = [
      "Focus on action, not results",
      "Control your mind, not external situations",
      "Attachment creates suffering",
      "Discipline creates freedom",
      "Ego blocks clarity",
      "Your duty matters more than mood",
      "Consistency beats intensity",
      "You become what you repeatedly do",
      "Desire without direction creates chaos",
      "Clarity comes from action, not overthinking",
      "Fear comes from attachment to outcome",
      "Peace comes from detachment",
      "Self-control is greater than motivation",
      "Confusion comes from lack of decision",
      "Action removes doubt",
      "Avoiding truth creates suffering",
      "Awareness breaks negative patterns",
      "Your habits shape your destiny",
      "You can't control results, only effort",
      "Inner stability > external success"
    ];

    // 🎲 Random principle
    const randomPrinciple =
      gitaPrinciples[Math.floor(Math.random() * gitaPrinciples.length)];

    // 🎯 PROBLEM CAUSES ENGINE (ANTI-GENERIC)
    const problemCauses = [
      "no clear routine",
      "lack of discipline",
      "overthinking",
      "phone distraction",
      "late sleeping habit",
      "no clear priorities",
      "fear of failure",
      "comfort zone",
      "lack of consistency",
      "no accountability",
      "mental fatigue",
      "too many goals",
      "no time planning",
      "procrastination",
      "low motivation",
      "emotional instability",
      "lack of clarity",
      "external distractions",
      "no self-control",
      "inconsistent habits"
    ];

    // 🧾 SYSTEM PROMPT
    const systemPrompt = `
You are "Gita Guide" — a sharp, practical advisor inspired by Bhagavad Gita.

Possible causes:
- Detect automatically from user input
- Focus on hidden fear, confusion, or lack of clarity
- Do NOT assume random causes

You MUST:
- Show 2-3 possible causes
- Not assume one single reason
- Explain simply which fits user
// Deep Insight rules
- Detect hidden fear, emotional trigger, or contradiction
- Use it internally
- NEVER mention “deep insight” or explain reasoning
- Reflect it subtly in Truth and Question

// Question rule (very important)
- Question should feel personal, almost uncomfortable
- It should reveal something user didn’t say directly
Thinking flow:
1. Understand user problem
2. Detect hidden issue
3. Identify pattern
4. Use ONE relevant Gita principle: "${randomPrinciple}"
5. Give 2 practical actions

// 🔁 Conversation loop rules
- This is a multi-step conversation
- Do NOT repeat previous answer
- Each step must go deeper

INITIAL:
- Understand problem clearly
- Give sharp insight

DEEPER:
- Refine cause
- Be more personal
- Challenge user thinking

CORE:
- Reveal root issue directly
- No softness
- Ask uncomfortable truth question
STRICT RULES:
- Speak like a smart friend (not guru)
- Use simple Hindi / Hinglish / English (match user)
- No vague lines
- Every line must feel real
IMPORTANT:
- You MUST ask 1 follow-up question at the end
- Question must be directly related to user's problem
- NEVER skip question
- If no question → answer is WRONG
- Maximum 4–5 lines per section
- No paragraph longer than 2 lines
If response does NOT contain a question mark (?) 
→ rewrite answer and add a deep question.
- Keep response short and sharp
- No long paragraphs
- Break into small sections
- Avoid over-explaining
<h3>🧠 Truth (Gita Insight)</h3>
<p></p>

<h3>🔍 Pattern</h3>
<p></p>

<h3>⚡ Action (Karma Step)</h3>
<ul>
<li></li>
<li></li>
</ul>
<h3>❓ Question</h3>
<p>Ask one deep question based on user's situation. Do NOT leave empty.</p>
`;

    // 🤖 API CALL
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "⚠️ No response from AI";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      reply: "⚠️ Server error"
    });
  }
          }
