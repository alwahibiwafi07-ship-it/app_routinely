import "server-only";
import { prisma } from "@/lib/prisma";
import { keISO, tambahHari } from "@/lib/tanggal";

const API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const ZONA = "Asia/Jakarta";
const DURASI_DEFAULT = 60; // menit, kalau jadwal tidak punya durasi
const KODE_HARI = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export type KodeGalatKalender = "IZIN" | "API" | "JARINGAN";

export class GalatKalender extends Error {
  kode: KodeGalatKalender;
  constructor(kode: KodeGalatKalender, pesan: string) {
    super(pesan);
    this.name = "GalatKalender";
    this.kode = kode;
  }
}

export type JadwalUntukGoogle = {
  judul: string;
  jamMulai: string; // "HH:MM"
  durasiMenit: number | null;
  tanggalMulai: Date; // @db.Date (tengah malam UTC)
  pengulangan: "SEKALI" | "HARIAN" | "MINGGUAN" | "BULANAN" | "TAHUNAN";
  hariMinggu: number[];
  sampaiTanggal: Date | null;
  seharian: boolean;
};

// ---------- Token ----------

async function ambilAccessToken(userId: string): Promise<string> {
  const akun = await prisma.account.findFirst({ where: { userId, providerId: "google" } });
  if (!akun) throw new GalatKalender("IZIN", "Akun Google tidak ditemukan");

  const masihBerlaku =
    akun.accessToken &&
    akun.accessTokenExpiresAt &&
    akun.accessTokenExpiresAt.getTime() > Date.now() + 60_000;
  if (masihBerlaku) return akun.accessToken as string;

  if (!akun.refreshToken) throw new GalatKalender("IZIN", "Refresh token kosong");

  let res: Response;
  try {
    res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        refresh_token: akun.refreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new GalatKalender("JARINGAN", "Gagal menghubungi Google (token)");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // invalid_grant = refresh token kedaluwarsa/dicabut (mis. mode Testing 7 hari)
    const izin = data?.error === "invalid_grant" || res.status === 400 || res.status === 401;
    console.error("GOOGLE TOKEN GAGAL:", res.status, data?.error);
    throw new GalatKalender(izin ? "IZIN" : "API", "Gagal memperbarui token Google");
  }

  await prisma.account.update({
    where: { id: akun.id },
    data: {
      accessToken: data.access_token,
      accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });
  return data.access_token as string;
}

// ---------- Pembantu waktu ----------

const p2 = (n: number) => String(n).padStart(2, "0");

// Tambah menit pada jam dinding "tanggal + jam" tanpa terpengaruh zona waktu server
function tambahMenit(iso: string, jam: string, menit: number): string {
  const [y, mo, d] = iso.split("-").map(Number);
  const [h, m] = jam.split(":").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d, h, m) + menit * 60_000);
  return `${t.getUTCFullYear()}-${p2(t.getUTCMonth() + 1)}-${p2(t.getUTCDate())}T${p2(
    t.getUTCHours(),
  )}:${p2(t.getUTCMinutes())}:00`;
}

// Untuk jadwal mingguan, kejadian pertama harus jatuh di hari yang dipilih
function tanggalAwal(j: JadwalUntukGoogle): string {
  if (j.pengulangan !== "MINGGUAN") return keISO(j.tanggalMulai);
  const daftar = j.hariMinggu.length ? j.hariMinggu : [j.tanggalMulai.getUTCDay()];
  for (let i = 0; i < 7; i++) {
    const d = new Date(j.tanggalMulai.getTime() + i * 86_400_000);
    if (daftar.includes(d.getUTCDay())) return keISO(d);
  }
  return keISO(j.tanggalMulai);
}

function aturanUlang(j: JadwalUntukGoogle): string[] | undefined {
  let aturan: string;
  switch (j.pengulangan) {
    case "HARIAN":
      aturan = "RRULE:FREQ=DAILY";
      break;
    case "MINGGUAN": {
      const daftar = j.hariMinggu.length ? j.hariMinggu : [j.tanggalMulai.getUTCDay()];
      aturan = `RRULE:FREQ=WEEKLY;BYDAY=${daftar.map((h) => KODE_HARI[h]).join(",")}`;
      break;
    }
    case "BULANAN":
      aturan = "RRULE:FREQ=MONTHLY";
      break;
    case "TAHUNAN":
      aturan = "RRULE:FREQ=YEARLY";
      break;
    default:
      return undefined;
  }
  if (j.sampaiTanggal) {
    const tgl = keISO(j.sampaiTanggal).replace(/-/g, "");
    // Event seharian: UNTIL berupa tanggal. Event berjam: 23:59:59 WIB = 16:59:59 UTC
    aturan += j.seharian ? `;UNTIL=${tgl}` : `;UNTIL=${tgl}T165959Z`;
  }
  return [aturan];
}

// ---------- Panggilan ke Calendar API ----------

async function panggilGoogle(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new GalatKalender("JARINGAN", "Gagal menghubungi Google Calendar");
  }
}

// Mengembalikan ID event di Google Calendar
export async function buatEventGoogle(userId: string, j: JadwalUntukGoogle): Promise<string> {
  const token = await ambilAccessToken(userId);

  const iso = tanggalAwal(j);
  const waktu = j.seharian
    ? { start: { date: iso }, end: { date: tambahHari(iso, 1) } }
    : {
        start: { dateTime: `${iso}T${j.jamMulai}:00`, timeZone: ZONA },
        end: {
          dateTime: tambahMenit(iso, j.jamMulai, j.durasiMenit ?? DURASI_DEFAULT),
          timeZone: ZONA,
        },
      };

  const res = await panggilGoogle(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: j.judul,
      description: "Dibuat dari Routinely",
      ...waktu,
      recurrence: aturanUlang(j),
      reminders: { useDefault: true },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("GOOGLE CALENDAR BUAT GAGAL:", res.status, JSON.stringify(data).slice(0, 400));
    throw new GalatKalender(
      res.status === 401 || res.status === 403 ? "IZIN" : "API",
      `Calendar API menolak (${res.status})`,
    );
  }
  return data.id as string;
}

export async function hapusEventGoogle(userId: string, eventId: string): Promise<void> {
  const token = await ambilAccessToken(userId);
  const res = await panggilGoogle(`${API}/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  // 404/410 = sudah terhapus di Google, anggap berhasil
  if (res.ok || res.status === 404 || res.status === 410) return;
  console.error("GOOGLE CALENDAR HAPUS GAGAL:", res.status);
  throw new GalatKalender(
    res.status === 401 || res.status === 403 ? "IZIN" : "API",
    `Calendar API menolak hapus (${res.status})`,
  );
}

// Membatalkan SATU kemunculan dari event berulang (mis. hanya Senin 2 November)
export async function hapusInstansiGoogle(
  userId: string,
  eventId: string,
  tanggalISO: string,
): Promise<void> {
  const token = await ambilAccessToken(userId);
  const batas = new URLSearchParams({
    timeMin: `${tanggalISO}T00:00:00+07:00`,
    timeMax: `${tambahHari(tanggalISO, 1)}T00:00:00+07:00`,
    maxResults: "5",
  });
  const cari = await panggilGoogle(`${API}/${encodeURIComponent(eventId)}/instances?${batas}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (cari.status === 404 || cari.status === 410) return;
  const data = await cari.json().catch(() => ({}));
  if (!cari.ok) {
    console.error("GOOGLE INSTANSI GAGAL:", cari.status);
    throw new GalatKalender(
      cari.status === 401 || cari.status === 403 ? "IZIN" : "API",
      `Calendar API menolak (${cari.status})`,
    );
  }
  const instansi = data.items?.[0]?.id as string | undefined;
  if (!instansi) return; // tidak ada kemunculan di tanggal itu
  await hapusEventGoogle(userId, instansi);
}
