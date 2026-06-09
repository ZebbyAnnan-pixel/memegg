let chats = JSON.parse(localStorage.getItem("boba_chats")) || [];
let currentChat = [];
let currentIndex = null;

function saveChats() {
  localStorage.setItem("boba_chats", JSON.stringify(chats));
}

function renderHistory() {
  const historyDiv = document.getElementById("history");
  historyDiv.innerHTML = "";

  chats.forEach((chat, index) => {
    const div = document.createElement("div");
    div.className = "history-item";
    if (index === currentIndex) div.classList.add("active");

    div.innerText = chat[0]?.content.slice(0, 25) || "New Chat";
    div.onclick = () => loadChat(index);

    historyDiv.appendChild(div);
  });
}

function loadChat(index) {
  currentIndex = index;
  currentChat = chats[index];

  const chatDiv = document.getElementById("chat");
  chatDiv.innerHTML = "";

  currentChat.forEach(msg => {
    chatDiv.innerHTML += `<div class="msg ${msg.role}">${msg.content}</div>`;
  });

  renderHistory();
}

function newChat() {
  currentChat = [];
  currentIndex = null;
  document.getElementById("chat").innerHTML = "";
  renderHistory();
}

async function generate() {
  const input = document.getElementById("prompt");
  const chatDiv = document.getElementById("chat");

  const text = input.value.trim();
  if (!text) return;

  // user message
  chatDiv.innerHTML += `<div class="msg user">${text}</div>`;
  currentChat.push({ role: "user", content: text });

  input.value = "";

  // bot placeholder
  const id = "msg-" + Date.now();
  chatDiv.innerHTML += `<div id="${id}" class="msg bot">Typing...</div>`;
  const msgDiv = document.getElementById(id);

  chatDiv.scrollTop = chatDiv.scrollHeight;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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", // 🔥 PUT NEW KEY
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: currentChat.slice(-6),
        max_tokens: 300
      })
    });

    // check error response
    if (!res.ok) {
      const errText = await res.text();
      console.error("API Error:", errText);
      msgDiv.innerText = "API Error.";
      return;
    }

    const data = await res.json();

    const reply = data?.choices?.[0]?.message?.content || "No response.";

    msgDiv.innerHTML = reply.replace(/\n/g, "<br>");

    // save assistant reply
    currentChat.push({ role: "assistant", content: reply });

    if (currentIndex === null) {
      chats.push([...currentChat]);
      currentIndex = chats.length - 1;
    } else {
      chats[currentIndex] = [...currentChat];
    }

    saveChats();
    renderHistory();

  } catch (err) {
    console.error("Fetch Error:", err);
    msgDiv.innerText = "Network Error.";
  }

  input.focus();
}

// Enter key support
document.getElementById("prompt").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    generate();
  }
});

renderHistory();
