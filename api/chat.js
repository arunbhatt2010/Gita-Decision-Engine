module.exports = async function handler(req, res) {
  try {

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const { messages, loopLevel = 1 } = body;

    if (!messages || !messages.length) {
      return res.status(400).json({ reply: "No input provided" });
    }

    const userInput =
      messages[messages.length - 1].content.toLowerCase();

    // 🧠 Pattern Detection
    let selectedPattern = "lack of clarity";

    if (userInput.includes("client")) selectedPattern = "weak positioning";
    if (userInput.includes("focus")) selectedPattern = "distraction";
    if (userInput.includes("delay")) selectedPattern = "overthinking";
    if (userInput.includes("grow")) selectedPattern = "no clear revenue goal";
    if (userInput.includes("tired")) selectedPattern = "burnout";
    if (userInput.includes("fear")) selectedPattern = "fear of failure";

    // 🧠 Gita principles
    const gitaPrinciples = [
      "Focus on action, not results",
      "Control your mind, not external situations",
      "Attachment creates suffering",
      "Discipline creates freedom",
      "Clarity comes from action, not overthinking",
      "Fear comes from attachment to outcome",
      "Consistency beats intensity",
      "Awareness breaks negative patterns"
    ];

    const randomPrinciple =
      gitaPrinciples[Math.floor(Math.random() * gitaPrinciples.length)];

    const systemPrompt = `You are "TruthLoop"...`; // short रखा अभी (तुम अपना full डाल देना)

    // 🚀 API CALL
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bearer \${process.env.GROQ_API_KEY}\`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      }
    );

    if (!response.ok) {
      return res.status(500).json({ reply: "⚠️ AI unstable. Try again." });
    }

    const data = await response.json();

    let reply =
      data?.choices?.[0]?.message?.content ||
      "⚠️ No response";

    if (loopLevel > 1) {
      reply =
        "✅ You’ve unlocked the real layer.\n\nNow we go deeper — no surface answers.\n\n" +
        reply +
        "\n\n---\n\nYou fixed the surface.\n\nBut this pattern will repeat unless we break it at the root.\n\n👉 Go deeper to fix this permanently.";
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("Backend error:", error);
    return res.status(500).json({
      reply: "⚠️ Server error"
    });
  }
};
