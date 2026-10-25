export type JenisEntitas = "judul" | "tanggal" | "waktu" | "ulang";
export type Entitas = { jenis: JenisEntitas; mulai: number; akhir: number };
export type KodeUlang = "SEKALI" | "HARIAN" | "MINGGUAN" | "BULANAN";

export type HasilParse = {
  entitas: Entitas[];
  judul: string;
  tanggal: string;
  waktu: string;
  ulang: string;
  tanggalISO: string;
  jam24: string;
  kodeUlang: KodeUlang;
  hariMinggu: number[];
};

const BULAN = [
  "januari", "februari", "maret", "april", "mei", "juni",
  "juli", "agustus", "september", "oktober", "november", "desember",
];
const SINGKATAN: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
  jul: 6, agu: 7, agt: 7, sep: 8, okt: 9, nov: 10, des: 11,
};
const INDEKS_HARI: Record<string, number> = {
  minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6,
};

const NAMA_BULAN = `${BULAN.join("|")}|${Object.keys(SINGKATAN).join("|")}`;

const POLA_TANGGAL = new RegExp(`\\b(\\d{1,2})\\s+(${NAMA_BULAN})(?:\\s+(\\d{4}))?\\b`, "i");
const POLA_RELATIF = /\b(hari ini|besok|lusa)\b/i;
const POLA_ULANG = /\b(?:setiap|tiap)\s+(hari|senin|selasa|rabu|kamis|jumat|sabtu|minggu|bulan)\b/i;
const POLA_WAKTU =
  /\b([01]?\d|2[0-3])[.:]([0-5]\d)\b|(?<=\bjam\s+)([01]?\d|2[0-3])\b(?![.:]\d)/i;

const p2 = (n: number) => String(n).padStart(2, "0");
const isoLokal = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

function indeksBulan(kata: string) {
  const k = kata.toLowerCase();
  const penuh = BULAN.indexOf(k);
  return penuh >= 0 ? penuh : SINGKATAN[k] ?? -1;
}

function formatTanggal(d: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function parseJadwal(teks: string, sekarang = new Date()): HasilParse {
  const entitas: Entitas[] = [];
  let tanggal = "";
  let tanggalISO = "";
  let waktu = "";
  let jam24 = "";
  let ulang = "";
  let kodeUlang: KodeUlang = "SEKALI";
  let hariMinggu: number[] = [];

  const mTgl = teks.match(POLA_TANGGAL);
  if (mTgl) {
    const hari = Number(mTgl[1]);
    const tahun = mTgl[3] ? Number(mTgl[3]) : sekarang.getFullYear();
    const d = new Date(tahun, indeksBulan(mTgl[2]), hari);
    if (d.getDate() === hari) {
      tanggal = formatTanggal(d);
      tanggalISO = isoLokal(d);
      const mulai = mTgl.index ?? 0;
      entitas.push({ jenis: "tanggal", mulai, akhir: mulai + mTgl[0].length });
    }
  } else {
    const mRel = teks.match(POLA_RELATIF);
    if (mRel) {
      const geser = { "hari ini": 0, besok: 1, lusa: 2 }[mRel[1].toLowerCase()] ?? 0;
      const d = new Date(sekarang);
      d.setDate(d.getDate() + geser);
      tanggal = formatTanggal(d);
      tanggalISO = isoLokal(d);
      const mulai = mRel.index ?? 0;
      entitas.push({ jenis: "tanggal", mulai, akhir: mulai + mRel[0].length });
    }
  }

  const mUlang = teks.match(POLA_ULANG);
  if (mUlang) {
    const kata = mUlang[1].toLowerCase();
    if (kata === "hari") {
      ulang = "Setiap hari";
      kodeUlang = "HARIAN";
    } else if (kata === "bulan") {
      ulang = "Setiap bulan";
      kodeUlang = "BULANAN";
    } else {
      ulang = "Setiap " + kata.charAt(0).toUpperCase() + kata.slice(1);
      kodeUlang = "MINGGUAN";
      hariMinggu = [INDEKS_HARI[kata]];
    }
    const mulai = mUlang.index ?? 0;
    entitas.push({ jenis: "ulang", mulai, akhir: mulai + mUlang[0].length });
  }

  const mWkt = teks.match(POLA_WAKTU);
  if (mWkt) {
    const jam = mWkt[1] ?? mWkt[3];
    const menit = mWkt[2] ?? "00";
    waktu = `${jam.padStart(2, "0")}.${menit} WIB`;
    jam24 = `${jam.padStart(2, "0")}:${menit}`;
    const mulai = mWkt.index ?? 0;
    entitas.push({ jenis: "waktu", mulai, akhir: mulai + mWkt[0].length });
  }

  const awal = entitas.length ? Math.min(...entitas.map((e) => e.mulai)) : teks.length;
  const prefix = teks.slice(0, awal);
  const judul = prefix.replace(/[\s,]*(?:jam|pada|tgl|tanggal)?[\s,]*$/i, "").trim();
  const mulaiJudul = prefix.search(/\S/);
  if (judul && mulaiJudul >= 0) {
    entitas.push({ jenis: "judul", mulai: mulaiJudul, akhir: mulaiJudul + judul.length });
  }

  entitas.sort((a, b) => a.mulai - b.mulai);
  return { entitas, judul, tanggal, waktu, ulang, tanggalISO, jam24, kodeUlang, hariMinggu };
}