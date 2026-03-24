module.exports = async function handler(req, res) {

  console.log("🔥 ENV KEY:", process.env.GROQ_API_KEY);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {

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
          messages: [{ role: "user", content: "test" }]
        })
      }
    );

    console.log("🔥 STATUS:", response.status);

    const data = await response.json();

    return res.status(200).json({ reply: "ok" });

  } catch (err) {
    console.log("🔥 ERROR:", err);
    return res.status(500).json({ reply: "error" });
  }
};
