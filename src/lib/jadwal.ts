import "server-only";
import { prisma } from "@/lib/prisma";
import { hariIniWIB, keDate, keISO, tambahHari } from "@/lib/tanggal";
import { BATAS_GRATIS } from "@/lib/paket";
import type { ItemJadwal, ItemRiwayat, KodeUlang } from "@/lib/tipe";

export type Aturan = {
  pengulangan: KodeUlang;
  tanggalMulai: Date;
  hariMinggu: number[];
  sampaiTanggal: Date | null;
  pengecualian: Date[];
};

function kabisat(t: number): boolean {
  return (t % 4 === 0 && t % 100 !== 0) || t % 400 === 0;
}

// Apakah jadwal ini jatuh pada tanggal tertentu?
export function muncul(j: Aturan, iso: string): boolean {
  const d = keDate(iso);
  if (d < j.tanggalMulai) return false;
  if (j.sampaiTanggal && d > j.sampaiTanggal) return false;
  if (j.pengecualian.some((x) => x.getTime() === d.getTime())) return false;

  switch (j.pengulangan) {
    case "SEKALI":
      return d.getTime() === j.tanggalMulai.getTime();
    case "HARIAN":
      return true;
    case "MINGGUAN": {
      const daftar = j.hariMinggu.length ? j.hariMinggu : [j.tanggalMulai.getUTCDay()];
      return daftar.includes(d.getUTCDay());
    }
    case "BULANAN":
      return d.getUTCDate() === j.tanggalMulai.getUTCDate();
    case "TAHUNAN": {
      const bulanMulai = j.tanggalMulai.getUTCMonth();
      const hariMulai = j.tanggalMulai.getUTCDate();
      // 29 Februari: pada tahun bukan kabisat tampil di 28 Februari
      if (bulanMulai === 1 && hariMulai === 29 && !kabisat(d.getUTCFullYear())) {
        return d.getUTCMonth() === 1 && d.getUTCDate() === 28;
      }
      return d.getUTCMonth() === bulanMulai && d.getUTCDate() === hariMulai;
    }
    default:
      return false;
  }
}

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_ZONA: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

const tglPendek = new Intl.DateTimeFormat("id-ID", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});
const tglPanjang = new Intl.DateTimeFormat("id-ID", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
});

function labelUlang(j: Aturan): string {
  switch (j.pengulangan) {
    case "HARIAN": return "Setiap hari";
    case "MINGGUAN":
      return j.hariMinggu.length === 1 ? `Setiap ${NAMA_HARI[j.hariMinggu[0]]}` : "Mingguan";
    case "BULANAN": return "Bulanan";
    case "TAHUNAN": return "Setiap tahun";
    default: return "Sekali";
  }
}

function labelWaktu(jam: string, zona: string, seharian = false): string {
  if (seharian) return "Seharian";
  return `${jam.replace(":", ".")} ${NAMA_ZONA[zona] ?? "WIB"}`;
}

type DataJadwal = Aturan & {
  id: string;
  judul: string;
  jamMulai: string;
  zonaWaktu: string;
  esensial: boolean;
  seharian: boolean;
  kejadian: { tanggal: Date; status: string }[];
};

function keItem(j: DataJadwal, iso: string): ItemJadwal {
  return {
    id: j.id,
    judul: j.judul,
    waktu: labelWaktu(j.jamMulai, j.zonaWaktu, j.seharian),
    tanggal:
      j.pengulangan === "SEKALI" || j.pengulangan === "BULANAN" || j.pengulangan === "TAHUNAN"
        ? tglPendek.format(keDate(iso))
        : undefined,
    pengulangan: labelUlang(j),
    selesai: j.kejadian.some((k) => k.status === "SELESAI" && keISO(k.tanggal) === iso),
    esensial: j.esensial,
    iso,
    jam: j.jamMulai,
    seharian: j.seharian,
    kodeUlang: j.pengulangan,
    hariMinggu: j.hariMinggu,
    tanggalMulaiISO: keISO(j.tanggalMulai),
  };
}

// Jadwal untuk setiap tanggal dalam rentang (dipakai halaman Kalender)
export async function ambilJadwalRentang(
  userId: string,
  dariISO: string,
  sampaiISO: string,
): Promise<Record<string, ItemJadwal[]>> {
  const daftar = await prisma.jadwal.findMany({
    where: { userId, aktif: true, tanggalMulai: { lte: keDate(sampaiISO) } },
    include: {
      kejadian: { where: { tanggal: { gte: keDate(dariISO), lte: keDate(sampaiISO) } } },
    },
    orderBy: { jamMulai: "asc" },
  });

  const hasil: Record<string, ItemJadwal[]> = {};
  for (let iso = dariISO; iso <= sampaiISO; iso = tambahHari(iso, 1)) {
    const item = daftar
      .filter((j) => muncul(j, iso))
      // yang dibatalkan atau ditunda pada tanggal ini tidak ditampilkan (masuk Riwayat)
      .filter((j) => !j.kejadian.some((k) => k.status !== "SELESAI" && keISO(k.tanggal) === iso))
      .map((j) => keItem(j, iso));
    if (item.length) hasil[iso] = item;
  }
  return hasil;
}

export async function ambilJadwalHari(userId: string, iso: string): Promise<ItemJadwal[]> {
  const hasil = await ambilJadwalRentang(userId, iso, iso);
  return hasil[iso] ?? [];
}

// Kuota akun gratis: cari tanggal pertama yang akan melebihi BATAS_GRATIS
// jika jadwal calon ini ditambahkan. Mengembalikan null kalau aman.
export async function cariHariPenuh(
  userId: string,
  calon: Aturan,
  abaikanId?: string,
): Promise<string | null> {
  const lain = await prisma.jadwal.findMany({
    where: { userId, aktif: true, ...(abaikanId ? { id: { not: abaikanId } } : {}) },
  });

  const hariIni = hariIniWIB();
  const mulai = keISO(calon.tanggalMulai);
  const awal = mulai > hariIni ? mulai : hariIni;
  const jumlahHari = calon.pengulangan === "SEKALI" ? 1 : 366;

  for (let i = 0; i < jumlahHari; i++) {
    const iso = tambahHari(awal, i);
    if (!muncul(calon, iso)) continue;
    const total = lain.filter((j) => muncul(j, iso)).length + 1;
    if (total > BATAS_GRATIS) return iso;
  }
  return null;
}

export async function ambilRiwayat(userId: string): Promise<ItemRiwayat[]> {
  const baris = await prisma.kejadian.findMany({
    where: { jadwal: { userId } },
    include: { jadwal: { select: { judul: true, jamMulai: true, zonaWaktu: true, seharian: true } } },
    orderBy: [{ tanggal: "desc" }, { updatedAt: "desc" }],
    take: 200,
  });

  return baris.map((k) => {
    let keterangan = "";
    if (k.status === "SELESAI")
      keterangan = labelWaktu(k.jadwal.jamMulai, k.jadwal.zonaWaktu, k.jadwal.seharian);
    else if (k.status === "DITUNDA")
      keterangan = k.keterangan ?? (k.dipindahKe ? `Dipindah ke ${tglPendek.format(k.dipindahKe)}` : "Ditunda");
    else keterangan = k.keterangan ?? "Dibatalkan oleh pengguna";

    return {
      id: k.id,
      judul: k.jadwal.judul,
      keterangan,
      status: k.status === "SELESAI" ? "selesai" : k.status === "DITUNDA" ? "ulang" : "batal",
      tanggal: tglPanjang.format(k.tanggal),
    };
  });
}
