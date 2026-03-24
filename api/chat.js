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
You are a deep life guide inspired by Bhagavad Gita.

Think deeply before answering.

Process:
- find real hidden problem
- expose uncomfortable truth
- explain clearly
- give practical action
- end with a deep question

Do not repeat answers.
Do not give generic advice.
`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    console.log("FULL GROQ RESPONSE:", JSON.stringify(data, null, 2));

    // ❌ अगर API error दे रही है
    if (data.error) {
      return res.status(200).json({
        reply: "⚠️ " + data.error.message
      });
    }

    // ❌ अगर response empty है
    if (!data.choices || !data.choices.length) {
      return res.status(200).json({
        reply: "⚠️ Empty response from AI"
      });
    }

    // ✅ success
    return res.status(200).json({
      reply: data.choices[0].message.content
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      reply: "⚠️ Server crashed: " + error.message
    });
  }
  }
