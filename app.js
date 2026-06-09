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

  chatDiv.innerHTML += `<div class="msg user">${text}</div>`;
  currentChat.push({ role: "user", content: text });

  input.value = "";

  const id = "msg-" + Date.now();
  chatDiv.innerHTML += `<div id="${id}" class="msg bot"></div>`;
  const msgDiv = document.getElementById(id);

  chatDiv.scrollTop = chatDiv.scrollHeight;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: currentChat,
        stream: true
      })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (let line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.replace("data: ", "");

          if (data === "[DONE]") break;

          try {
            const json = JSON.parse(data);
            const content = json.choices[0].delta?.content;

            if (content) {
              fullText += content;
              msgDiv.innerHTML = fullText.replace(/\n/g, "<br>");
              chatDiv.scrollTop = chatDiv.scrollHeight;
            }
          } catch {}
        }
      }
    }

    currentChat.push({ role: "assistant", content: fullText });

    if (currentIndex === null) {
      chats.push([...currentChat]);
      currentIndex = chats.length - 1;
    } else {
      chats[currentIndex] = [...currentChat];
    }

    saveChats();
    renderHistory();

  } catch {
    msgDiv.innerText = "Error.";
  }
}

renderHistory();
