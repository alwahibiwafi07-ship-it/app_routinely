// Uji Gemini langsung dari terminal (di luar Next.js).
// Jalankan dari folder project:  node --env-file=.env tes-gemini.mjs
// Skrip ini TIDAK mencetak API key.

const kunci = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const dasar = "https://generativelanguage.googleapis.com/v1beta";

if (!kunci) {
  console.log("GEMINI_API_KEY kosong. Jalankan dengan: node --env-file=.env tes-gemini.mjs");
  process.exit(1);
}

async function uji(nama, url, opsi = {}, batasMs = 60_000) {
  const mulai = Date.now();
  const detik = () => ((Date.now() - mulai) / 1000).toFixed(1);
  try {
    const res = await fetch(url, {
      ...opsi,
      headers: { "Content-Type": "application/json", "x-goog-api-key": kunci },
      signal: AbortSignal.timeout(batasMs),
    });
    const teks = await res.text();
    console.log(`[${nama}] status ${res.status} dalam ${detik()} dtk`);
    return teks;
  } catch (e) {
    console.log(`[${nama}] GAGAL setelah ${detik()} dtk: ${e.name} ${e.cause?.code ?? ""}`);
    return null;
  }
}

// 1) Daftar model yang bisa dipakai akun ini (cepat)
const daftar = await uji("1. daftar model", `${dasar}/models?pageSize=200`);
if (daftar) {
  try {
    const nama = JSON.parse(daftar)
      .models.filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace("models/", ""))
      .filter((n) => /flash|lite/.test(n));
    console.log("   model flash/lite yang tersedia:\n   " + nama.join("\n   "));
  } catch {
    console.log("   " + daftar.slice(0, 300));
  }
}

// 2) Panggilan teks biasa, tanpa pengaturan tambahan
const biasa = await uji("2. teks biasa", `${dasar}/models/${model}:generateContent`, {
  method: "POST",
  body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Balas dengan satu kata: halo" }] }] }),
});
if (biasa) console.log("   " + biasa.slice(0, 300).replace(/\s+/g, " "));

// 3) Panggilan JSON dengan skema, mirip yang dipakai aplikasi
const skema = await uji("3. JSON + skema", `${dasar}/models/${model}:generateContent`, {
  method: "POST",
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ text: "Bayar kos tanggal 13 Desember jam 10" }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: { judul: { type: "STRING" }, jam: { type: "STRING" } },
        required: ["judul", "jam"],
      },
    },
  }),
});
if (skema) console.log("   " + skema.slice(0, 300).replace(/\s+/g, " "));
