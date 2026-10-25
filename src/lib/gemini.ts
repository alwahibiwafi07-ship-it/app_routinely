import "server-only";

// Nama model bisa diganti lewat .env (GEMINI_MODEL) tanpa mengubah kode.
// Cek model gratis yang tersedia di aistudio.google.com atau ai.google.dev.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const URL_DASAR = "https://generativelanguage.googleapis.com/v1beta/models";

export type KodeGalatAI = "KUNCI" | "KUOTA" | "JARINGAN" | "RESPON";

export class GalatAI extends Error {
  kode: KodeGalatAI;
  constructor(kode: KodeGalatAI, pesan: string) {
    super(pesan);
    this.name = "GalatAI";
    this.kode = kode;
  }
}

export type PesanAI = { peran: "user" | "model"; teks: string };

type Opsi = {
  sistem: string;
  pesan: PesanAI[];
  skema: Record<string, unknown>; // responseSchema Gemini
  suhu?: number;
};

type ResponGemini = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

// Satu-satunya pintu keluar ke Gemini. Kalau nanti pindah model atau
// penyedia lain, cukup ubah file ini.
export async function panggilAI({ sistem, pesan, skema, suhu = 0.5 }: Opsi): Promise<unknown> {
  const kunci = process.env.GEMINI_API_KEY;
  if (!kunci) throw new GalatAI("KUNCI", "GEMINI_API_KEY belum diatur di .env");

  let res: Response;
  try {
    res = await fetch(`${URL_DASAR}/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": kunci },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistem }] },
        contents: pesan.map((p) => ({ role: p.peran, parts: [{ text: p.teks }] })),
        generationConfig: {
          temperature: suhu,
          responseMimeType: "application/json",
          responseSchema: skema,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new GalatAI("JARINGAN", "Gagal menghubungi Gemini (jaringan atau timeout)");
  }

  if (!res.ok) {
    const isi = await res.text().catch(() => "");
    console.error(`GEMINI ${res.status}:`, isi.slice(0, 500));
    if (res.status === 429) throw new GalatAI("KUOTA", "Kuota Gemini gratis sedang habis");
    if (res.status === 401 || res.status === 403)
      throw new GalatAI("KUNCI", "API key Gemini ditolak");
    throw new GalatAI("RESPON", `Gemini menolak permintaan (${res.status})`);
  }

  const data = (await res.json()) as ResponGemini;
  const teks = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  if (!teks) throw new GalatAI("RESPON", "Gemini tidak mengembalikan isi");

  try {
    return JSON.parse(teks);
  } catch {
    throw new GalatAI("RESPON", "Jawaban Gemini bukan JSON yang valid");
  }
}