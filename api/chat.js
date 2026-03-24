export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `
You are a deep thinking guide inspired by Bhagavad Gita.

You MUST:
- identify hidden problem
- expose uncomfortable truth
- avoid generic advice
- give practical action
- end with a deep question

Do NOT repeat answers.
Be specific to the user.
`
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    // 🔥 DEBUG LOG (important)
    console.log("GROQ RESPONSE:", JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices.length) {
      return res.status(200).json({
        reply: "⚠️ No valid response from AI. Check logs."
      });
    }

    res.status(200).json({
      reply: data.choices[0].message.content
    });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({
      reply: "⚠️ Server error. Check logs."
    });
  }
      }
