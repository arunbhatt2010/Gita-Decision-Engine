let step = 0;

async function sendMessage() {

  const inputBox = document.getElementById("input");
  const chat = document.getElementById("chat");

  const text = inputBox.value.trim();
  if (!text) return;

  // Show user message
  chat.innerHTML += `<div><b>You:</b> ${text}</div>`;
  inputBox.value = "";

  let reply;

  // 🔒 Paywall logic
  if (step >= 3) {
    reply = `
    <div style="color:orange;">
    🔒 You’re very close to real clarity<br><br>
    Most people stop here… and repeat the same pattern<br><br>
    Unlock full clarity for ₹49
    </div>`;
  } else {

    try {
      // 🔥 API CALL
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      reply = data.reply;

    } catch (err) {
      reply = "Something went wrong...";
    }
  }

  // Show AI reply
  chat.innerHTML += `<div><b>Guide:</b><br>${reply}</div>`;

  step++;
}

// ENTER SUPPORT
document.getElementById("input").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});
