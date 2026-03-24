export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

    const { messages } = req.body;

    const systemPrompt = `
You are a sharp life guide inspired by Bhagavad Gita.

Rules:
- Keep answers short (max 120 words)
- Be direct and slightly uncomfortable
- No generic advice
- Structure:
  Truth → Pattern → Action → Question
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.6,
        max_tokens: 150
      })
    });

    const data = await response.json();

    console.log("GROQ RAW:", JSON.stringify(data)); // 🔥 DEBUG

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      "⚠️ AI returned empty response";

    return res.status(200).json({ reply });

  } catch (error) {

    console.error("ERROR:", error);

    return res.status(500).json({
      reply: "⚠️ Server error"
    });
  }
}
