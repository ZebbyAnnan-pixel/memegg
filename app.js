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
    div.className = "history-item" + (index === currentIndex ? " active" : "");
    div.innerText = chat[0]?.content?.slice(0, 32) || "New Chat";
    div.onclick = () => loadChat(index);
    historyDiv.appendChild(div);
  });
}

function updateTopbarTitle() {
  const el = document.getElementById("topbarTitle");
  el.textContent = currentChat[0]?.content?.slice(0, 44) || "New conversation";
}

function hideEmptyState() {
  const el = document.getElementById("emptyState");
  if (el) el.style.display = "none";
}

function buildEmptyState() {
  const div = document.createElement("div");
  div.id = "emptyState";
  div.className = "empty-state";
  div.innerHTML = `
    <div class="empty-logo-mark">B</div>
    <h1 class="empty-title">BOBA<span class="accent">.ai</span></h1>
    <p class="empty-subtitle">Your intelligent conversation companion</p>
    <div class="suggestions">
      <div class="suggestion-chip" onclick="fillPrompt('What can you help me with today?')">What can you help me with?</div>
      <div class="suggestion-chip" onclick="fillPrompt('Write a short poem about morning coffee')">Write a poem for me</div>
      <div class="suggestion-chip" onclick="fillPrompt('Explain quantum computing in simple terms')">Explain something complex</div>
      <div class="suggestion-chip" onclick="fillPrompt('Help me brainstorm ideas for a side project')">Brainstorm with me</div>
    </div>`;
  return div;
}

function appendUserMessage(chatDiv, text) {
  const wrapper = document.createElement("div");
  wrapper.className = "msg-wrapper";
  const msg = document.createElement("div");
  msg.className = "msg user";
  msg.innerText = text;
  wrapper.appendChild(msg);
  chatDiv.appendChild(wrapper);
}

function appendBotMessage(chatDiv, content, typing = false) {
  const wrapper = document.createElement("div");
  wrapper.className = "msg-wrapper";

  const row = document.createElement("div");
  row.className = "bot-row";

  const avatar = document.createElement("div");
  avatar.className = "bot-avatar";
  avatar.textContent = "B";

  const msg = document.createElement("div");
  msg.className = "msg bot";

  if (typing) {
    const indicator = document.createElement("div");
    indicator.className = "typing-indicator";
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("div");
      dot.className = "typing-dot";
      indicator.appendChild(dot);
    }
    msg.appendChild(indicator);
  } else {
    msg.innerHTML = content.replace(/\n/g, "<br>");
  }

  row.appendChild(avatar);
  row.appendChild(msg);
  wrapper.appendChild(row);
  chatDiv.appendChild(wrapper);

  return msg;
}

function loadChat(index) {
  currentIndex = index;
  currentChat = chats[index];

  const chatDiv = document.getElementById("chat");
  chatDiv.innerHTML = "";

  currentChat.forEach(msg => {
    if (msg.role === "user") {
      appendUserMessage(chatDiv, msg.content);
    } else {
      appendBotMessage(chatDiv, msg.content);
    }
  });

  chatDiv.scrollTop = chatDiv.scrollHeight;
  updateTopbarTitle();
  renderHistory();
  closeSidebar();
}

function newChat() {
  currentChat = [];
  currentIndex = null;
  const chatDiv = document.getElementById("chat");
  chatDiv.innerHTML = "";
  chatDiv.appendChild(buildEmptyState());
  updateTopbarTitle();
  renderHistory();
  closeSidebar();
  document.getElementById("prompt").focus();
}

function fillPrompt(text) {
  const input = document.getElementById("prompt");
  input.value = text;
  autoResize(input);
  input.focus();
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebarOverlay").classList.toggle("open");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("open");
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 200) + "px";
}

async function generate() {
  const input = document.getElementById("prompt");
  const chatDiv = document.getElementById("chat");
  const sendBtn = document.getElementById("sendBtn");

  const text = input.value.trim();
  if (!text) return;

  hideEmptyState();
  appendUserMessage(chatDiv, text);
  currentChat.push({ role: "user", content: text });

  input.value = "";
  input.style.height = "auto";
  sendBtn.disabled = true;

  const botMsg = appendBotMessage(chatDiv, "", true);
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
        messages: [
          { role: "system", content: "You are BOBA AI. If anyone asks your name, always say BOBA AI." },
          ...currentChat.slice(-6)
        ],
        max_tokens: 300
      })
    });

    if (!res.ok) {
      console.error("API Error:", await res.text());
      botMsg.innerHTML = `<span style="color:var(--text-muted)">Something went wrong. Please try again.</span>`;
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
    updateTopbarTitle();

  } catch (err) {
    console.error("Fetch Error:", err);
    botMsg.innerHTML = `<span style="color:var(--text-muted)">Network error. Check your connection.</span>`;
  } finally {
    sendBtn.disabled = false;
    input.focus();
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }
}

const promptEl = document.getElementById("prompt");
promptEl.addEventListener("input", () => autoResize(promptEl));
promptEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    generate();
  }
});

renderHistory();
