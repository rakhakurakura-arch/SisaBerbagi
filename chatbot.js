const CHATBOT_SYSTEM_INSTRUCTION = `Kamu adalah asisten chatbot resmi untuk platform SisaBerbagi, yaitu platform yang menghubungkan restoran/toko yang memiliki makanan sisa layak konsumsi dengan panti asuhan/komunitas yang membutuhkan, menggunakan AI untuk menilai urgensi penyaluran. Kamu HANYA boleh menjawab pertanyaan seputar topik berikut: (1) cara kerja platform SisaBerbagi dan cara menggunakannya baik sebagai restoran maupun penerima, (2) edukasi tentang food waste/limbah makanan di Indonesia dan dampaknya, (3) tips penyimpanan atau pengolahan makanan sisa agar tetap layak konsumsi, (4) informasi kontak SisaBerbagi (email: sisaberbagi@gmail.com, WhatsApp: +62 815-5338-3100). JIKA pertanyaan user berada di luar topik-topik ini (misalnya pertanyaan umum, hiburan, topik sensitif, atau hal yang tidak berkaitan dengan platform ini), TOLAK dengan sopan dan arahkan kembali user untuk bertanya seputar SisaBerbagi. Jawab selalu dalam Bahasa Indonesia yang ramah dan singkat (maksimal 3-4 kalimat).`;

export async function onRequestPost(context) {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY environment variable is not configured." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body = await context.request.json();
    const history = body.chatHistory || body.history || [];
    const userText = body.userText || body.message;

    let contents = history;
    if (!contents || contents.length === 0) {
      if (!userText) {
        return new Response(JSON.stringify({ error: "No message or chat history provided." }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      contents = [{ role: "user", parts: [{ text: userText }] }];
    } else {
      contents = contents.slice(-6);
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const payload = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: CHATBOT_SYSTEM_INSTRUCTION }]
      }
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Gemini API HTTP status: ${response.status}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      return new Response(JSON.stringify({ error: "Empty response from Gemini API" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ reply: replyText.trim() }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
