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

    div.innerText = chat[0]?.content?.slice(0, 25) || "New Chat";
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
    const el = document.createElement("div");
    el.className = `msg ${msg.role}`;
    el.innerHTML = msg.content.replace(/\n/g, "<br>");
    chatDiv.appendChild(el);
  });

  chatDiv.scrollTop = chatDiv.scrollHeight;
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
  const userMsg = document.createElement("div");
  userMsg.className = "msg user";
  userMsg.innerText = text;
  chatDiv.appendChild(userMsg);

  currentChat.push({ role: "user", content: text });

  input.value = "";

  // bot placeholder
  const botMsg = document.createElement("div");
  botMsg.className = "msg bot";
  botMsg.innerText = "Typing...";
  chatDiv.appendChild(botMsg);

  chatDiv.scrollTop = chatDiv.scrollHeight;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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", // ⚠️ REPLACE THIS
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are BOBA AI. If anyone asks your name, always say BOBA AI."
          },
          ...currentChat.slice(-6)
        ],
        max_tokens: 300
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("API Error:", err);
      botMsg.innerText = "API Error.";
      return;
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "No response.";

    botMsg.innerHTML = reply.replace(/\n/g, "<br>");

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
    botMsg.innerText = "Network Error.";
  }

  input.focus();
}

// Enter key support
document.getElementById("prompt").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    generate();
  }
});

renderHistory();
