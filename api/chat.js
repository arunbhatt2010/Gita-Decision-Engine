export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {

    const { messages } = req.body;

    const systemPrompt = `
You are a sharp, practical advisor inspired by Bhagavad Gita.

You MUST respond in clean HTML.

Structure:

<h3>🧠 Truth (Gita Insight)</h3>
<p>Clear direct truth (2 lines max)</p>

<h3>🔍 Pattern</h3>
<p>Real behavior pattern (2 lines)</p>

<h3>⚡ Action (Karma Step)</h3>
<ul>
<li>Step 1</li>
<li>Step 2</li>
</ul>

<h3>❓ Question</h3>
<p>1 sharp question</p>

Rules:
- Simple Hindi / Hinglish
- No vague lines
- No long paragraphs
- Must be practical
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // 🔥 FIXED
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    // 🔥 SAFE PARSE (NO CRASH)
    if (!data || !data.choices || !data.choices[0]) {
      console.log("ERROR RESPONSE:", data);
      return res.status(500).json({
        reply: "⚠️ AI not responding properly"
      });
    }

    const reply = data.choices[0].message?.content || "No response";

    return res.status(200).json({ reply });

  } catch (error) {
    console.log("SERVER ERROR:", error);
    return res.status(500).json({
      reply: "⚠️ Server error"
    });
  }
}
