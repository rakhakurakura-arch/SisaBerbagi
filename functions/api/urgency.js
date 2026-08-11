export async function onRequestPost(context) {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY environment variable is not configured." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { namaMakanan, jumlahPorsi, waktuBatas, catatan } = await context.request.json();

    const systemPrompt = "Kamu adalah asisten yang menilai urgensi distribusi makanan sisa. Berdasarkan jumlah porsi dan waktu batas pengambilan yang diberikan, berikan HANYA sebuah angka 1-5 (5=paling urgent karena porsi banyak dan waktu batas sangat dekat, 1=tidak terlalu urgent). Jawab HANYA dengan angkanya saja, tanpa teks tambahan.";

    const userPrompt = `Nilai urgensi makanan ini:
- Nama Makanan: ${namaMakanan}
- Jumlah Porsi: ${jumlahPorsi} porsi
- Batas Waktu Pengambilan: ${waktuBatas}
- Waktu Sekarang: ${new Date().toLocaleString()}
- Catatan: ${catatan || 'Tidak ada'}
Berikan angka 1-5 saja.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] }
      })
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Gemini API HTTP status: ${response.status}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const score = parseInt(rawText, 10);

    return new Response(JSON.stringify({ skor: score }), {
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
