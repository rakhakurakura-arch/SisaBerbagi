/* ==============================================================================
 * KONFIGURASI CHATBOT AI SISABERBAGI
 * ==============================================================================
 */

// Inisialisasi elemen DOM setelah halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("chatbotToggleBtn");
  const closeBtn = document.getElementById("chatbotCloseBtn");
  const panel = document.getElementById("chatbotPanel");
  const messagesContainer = document.getElementById("chatbotMessages");
  const form = document.getElementById("chatbotForm");
  const input = document.getElementById("chatbotInput");
  const sendBtn = document.getElementById("chatbotSendBtn");

  // Array untuk menyimpan riwayat percakapan (digunakan untuk konteks multi-turn, max 6 pesan)
  const chatHistory = [];
  let isWelcomeShown = false;

  // 1. Function Toggle Buka / Tutup Panel Chatbot
  function toggleChatbot() {
    const isActive = panel.classList.toggle("active");
    toggleBtn.classList.toggle("active");
    panel.setAttribute("aria-hidden", !isActive);

    // Tampilkan pesan sambutan jika pertama kali dibuka
    if (isActive && !isWelcomeShown) {
      showWelcomeMessage();
      isWelcomeShown = true;
    }

    if (isActive) {
      input.focus();
    }
  }

  if (toggleBtn) toggleBtn.addEventListener("click", toggleChatbot);
  if (closeBtn) closeBtn.addEventListener("click", toggleChatbot);

  // 2. Tampilkan Pesan Sambutan Otomatis saat Pertama Dibuka
  function showWelcomeMessage() {
    const welcomeText = "Halo! Saya asisten SisaBerbagi. Saya bisa membantu jawab pertanyaan seputar cara menyumbang makanan, cara mengklaim makanan, cara kerja platform ini, atau edukasi tentang food waste. Ada yang bisa saya bantu?";
    appendMessage(welcomeText, "bot");
  }

  // 3. Tambahkan Pesan ke Tampilan UI Chat
  function appendMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("chat-msg", sender === "user" ? "chat-msg-user" : "chat-msg-bot");
    msgDiv.textContent = text;
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
  }

  // 4. Indikator "Mengetik..." (Typing Indicator)
  function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("chat-typing");
    typingDiv.id = "typingIndicator";
    typingDiv.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const typingDiv = document.getElementById("typingIndicator");
    if (typingDiv) {
      typingDiv.remove();
    }
  }

  // 5. Scroll Otomatis ke Pesan Terbawah
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // 6. Handling Submit Form / Kirim Pesan
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userText = input.value.trim();
      if (!userText) return;

      // Tampilkan pesan user di UI
      appendMessage(userText, "user");
      input.value = "";
      input.disabled = true;
      sendBtn.disabled = true;

      // Simpan ke riwayat lokal untuk multi-turn context
      chatHistory.push({
        role: "user",
        parts: [{ text: userText }]
      });

      // Tampilkan animasi mengetik
      showTypingIndicator();

      try {
        // Panggil Gemini API via serverless proxy
        const botReply = await callGeminiAPI();
        hideTypingIndicator();
        
        // Tampilkan balasan bot di UI
        appendMessage(botReply, "bot");

        // Simpan respon model ke riwayat lokal
        chatHistory.push({
          role: "model",
          parts: [{ text: botReply }]
        });

      } catch (error) {
        console.error("Gagal mendapatkan respon dari Chatbot Gemini:", error);
        hideTypingIndicator();

        const errorMessage = "Maaf, terjadi kendala saat menghubungi asisten AI. Silakan coba beberapa saat lagi.";

        appendMessage(errorMessage, "bot");
      } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
      }
    });
  }

  // 7. Fungsi Memanggil Gemini API via Endpoint Serverless Cloudflare
  async function callGeminiAPI() {
    // Ambil maksimal 6 pesan terakhir untuk konteks percakapan multi-turn
    const recentHistory = chatHistory.slice(-6);

    const response = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userText: chatHistory[chatHistory.length - 1]?.parts?.[0]?.text || "",
        chatHistory: recentHistory
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error status: ${response.status}`);
    }

    const data = await response.json();
    const replyText = data.reply;

    if (!replyText) {
      throw new Error("Respon kosong dari Chatbot API");
    }

    return replyText.trim();
  }
});
