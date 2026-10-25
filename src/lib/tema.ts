export type TemaId = "profesional" | "midnight" | "lavender";

export const daftarTema = [
  {
    id: "profesional",
    nama: "Profesional",
    deskripsi: "Indigo minimalis, standar Linear/Things",
    premium: false,
    // Warna untuk pratinjau kartu. Sengaja TETAP, tidak ikut berganti tema.
    kartu: {
      latar: "#ffffff", teks: "#0f172a", redup: "#475569",
      petak: "#eef2ff", titik: "#4f46e5",
      lencanaLatar: "#d1fae5", lencanaTeks: "#047857",
      tombolLatar: "#eef2ff", tombolTeks: "#4338ca",
    },
  },
  {
    id: "midnight",
    nama: "Elegan Midnight",
    deskripsi: "Slate hitam mewah dengan aksen emas",
    premium: false,
    kartu: {
      latar: "#0b0d12", teks: "#ffffff", redup: "#94a3b8",
      petak: "#1a1d24", titik: "#d4a23a",
      lencanaLatar: "#3a3020", lencanaTeks: "#d4a23a",
      tombolLatar: "#1c2029", tombolTeks: "#f8fafc",
    },
  },
  {
    id: "lavender",
    nama: "Ceria Lavender",
    deskripsi: "Sentuhan lembut rose, pink & lavender",
    premium: false,
    kartu: {
      latar: "#fff1f5", teks: "#3b1230", redup: "#9d6b86",
      petak: "#ffffff", titik: "#e8709f",
      lencanaLatar: "#fbd5e3", lencanaTeks: "#c2417a",
      tombolLatar: "#ffffff", tombolTeks: "#3b1230",
    },
  },
] as const;