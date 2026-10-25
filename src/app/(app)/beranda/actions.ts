"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { wajibLogin } from "@/lib/sesi";
import { hariIniWIB, keDate, keISO } from "@/lib/tanggal";
import {
  GalatKalender,
  buatEventGoogle,
  hapusEventGoogle,
  hapusInstansiGoogle,
} from "@/lib/googleCalendar";
import { cariHariPenuh } from "@/lib/jadwal";
import { apakahPro } from "@/lib/langganan";

const POLA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const POLA_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;
const BOLEH_ULANG = ["SEKALI", "HARIAN", "MINGGUAN", "BULANAN", "TAHUNAN"] as const;

export type BuatJadwalInput = {
  judul: string;
  jam: string;
  tanggalISO?: string;
  pengulangan: (typeof BOLEH_ULANG)[number];
  hariMinggu?: number[];
  seharian?: boolean;
};

// ok     = tersimpan dan masuk Google Calendar
// izin   = tersimpan, tapi izin Google Calendar belum ada / kedaluwarsa (perlu login ulang)
// gagal  = tersimpan, tapi Google Calendar sedang bermasalah
// batas  = TIDAK tersimpan: akun gratis sudah penuh pada tanggalPenuh
export type HasilBuat = {
  sinkron: "ok" | "izin" | "gagal" | "batas";
  tanggalPenuh?: string;
};

function tanggalValid(iso: string): Date {
  if (!POLA_ISO.test(iso)) throw new Error("Tanggal tidak valid");
  const d = keDate(iso);
  if (Number.isNaN(d.getTime()) || keISO(d) !== iso) throw new Error("Tanggal tidak valid");
  return d;
}

function validasi(input: BuatJadwalInput) {
  const judul = input.judul.trim().slice(0, 120);
  if (!judul) throw new Error("Judul kosong");

  const seharian = input.seharian === true;
  const jam = seharian ? "00:00" : input.jam;
  if (!POLA_JAM.test(jam)) throw new Error("Jam tidak valid");
  if (!BOLEH_ULANG.includes(input.pengulangan)) throw new Error("Pengulangan tidak valid");

  const mulai = tanggalValid(input.tanggalISO || hariIniWIB());
  const hari = (input.hariMinggu ?? []).filter((h) => Number.isInteger(h) && h >= 0 && h <= 6);
  const hariMinggu =
    input.pengulangan === "MINGGUAN" ? (hari.length ? hari : [mulai.getUTCDay()]) : [];

  return { judul, jam, seharian, mulai, hariMinggu, pengulangan: input.pengulangan };
}

// Batas akun gratis: maksimal BATAS_GRATIS jadwal yang muncul dalam satu hari
async function cekBatas(
  userId: string,
  v: ReturnType<typeof validasi>,
  opsi: { abaikanId?: string; sampaiTanggal?: Date | null; pengecualian?: Date[] } = {},
): Promise<string | null> {
  if (await apakahPro(userId)) return null;
  return cariHariPenuh(
    userId,
    {
      pengulangan: v.pengulangan,
      tanggalMulai: v.mulai,
      hariMinggu: v.hariMinggu,
      sampaiTanggal: opsi.sampaiTanggal ?? null,
      pengecualian: opsi.pengecualian ?? [],
    },
    opsi.abaikanId,
  );
}

function segarkan() {
  revalidatePath("/beranda");
  revalidatePath("/kalender");
  revalidatePath("/riwayat");
}

export async function buatJadwal(input: BuatJadwalInput): Promise<HasilBuat> {
  const { user } = await wajibLogin();
  const v = validasi(input);

  const penuh = await cekBatas(user.id, v);
  if (penuh) return { sinkron: "batas", tanggalPenuh: penuh };

  const dibuat = await prisma.jadwal.create({
    data: {
      userId: user.id,
      judul: v.judul,
      jamMulai: v.jam,
      seharian: v.seharian,
      tanggalMulai: v.mulai,
      pengulangan: v.pengulangan,
      hariMinggu: v.hariMinggu,
    },
  });

  // Sinkron ke Google Calendar. Kalau gagal, jadwal tetap tersimpan di Routinely.
  let sinkron: HasilBuat["sinkron"] = "ok";
  try {
    const eventId = await buatEventGoogle(user.id, dibuat);
    await prisma.jadwal.update({ where: { id: dibuat.id }, data: { googleEventId: eventId } });
  } catch (e) {
    sinkron = e instanceof GalatKalender && e.kode === "IZIN" ? "izin" : "gagal";
    console.error("SINKRON KALENDER GAGAL:", e instanceof Error ? e.message : e);
  }

  segarkan();
  return { sinkron };
}

// Mengubah SELURUH jadwal (termasuk semua kemunculan berulangnya)
export async function ubahJadwal(jadwalId: string, input: BuatJadwalInput): Promise<HasilBuat> {
  const { user } = await wajibLogin();
  const v = validasi(input);

  const lama = await prisma.jadwal.findFirst({ where: { id: jadwalId, userId: user.id } });
  if (!lama) throw new Error("Jadwal tidak ditemukan");

  const penuh = await cekBatas(user.id, v, {
    abaikanId: jadwalId,
    sampaiTanggal: lama.sampaiTanggal,
    pengecualian: lama.pengecualian,
  });
  if (penuh) return { sinkron: "batas", tanggalPenuh: penuh };

  const baru = await prisma.jadwal.update({
    where: { id: jadwalId },
    data: {
      judul: v.judul,
      jamMulai: v.jam,
      seharian: v.seharian,
      tanggalMulai: v.mulai,
      pengulangan: v.pengulangan,
      hariMinggu: v.hariMinggu,
    },
  });

  // Event Google dibuat ulang supaya sesuai. Jadwal lama yang belum punya event ikut tersinkron.
  let sinkron: HasilBuat["sinkron"] = "ok";
  let eventLamaTerhapus = !lama.googleEventId;
  try {
    if (lama.googleEventId) {
      await hapusEventGoogle(user.id, lama.googleEventId);
      eventLamaTerhapus = true;
    }
    const eventId = await buatEventGoogle(user.id, baru);
    await prisma.jadwal.update({ where: { id: jadwalId }, data: { googleEventId: eventId } });
  } catch (e) {
    sinkron = e instanceof GalatKalender && e.kode === "IZIN" ? "izin" : "gagal";
    console.error("SINKRON UBAH GAGAL:", e instanceof Error ? e.message : e);
    if (eventLamaTerhapus && lama.googleEventId) {
      await prisma.jadwal.update({ where: { id: jadwalId }, data: { googleEventId: null } });
    }
  }

  segarkan();
  return { sinkron };
}

export async function tandaiSelesai(jadwalId: string, tanggalISO: string, selesai: boolean) {
  const { user } = await wajibLogin();
  const tanggal = tanggalValid(tanggalISO);

  // Pastikan jadwal ini milik pengguna yang sedang login
  const milik = await prisma.jadwal.findFirst({
    where: { id: jadwalId, userId: user.id },
    select: { id: true },
  });
  if (!milik) throw new Error("Jadwal tidak ditemukan");

  if (selesai) {
    await prisma.kejadian.upsert({
      where: { jadwalId_tanggal: { jadwalId, tanggal } },
      create: { jadwalId, tanggal, status: "SELESAI" },
      update: { status: "SELESAI" },
    });
  } else {
    await prisma.kejadian.deleteMany({ where: { jadwalId, tanggal, status: "SELESAI" } });
  }

  segarkan();
}

// lingkup "ini"   = hanya pada tanggalISO (jadwal berulang tetap jalan di tanggal lain)
// lingkup "semua" = seluruh jadwal dihentikan
export async function hapusJadwal(
  jadwalId: string,
  tanggalISO: string,
  lingkup: "ini" | "semua" = "semua",
) {
  const { user } = await wajibLogin();
  const tanggal = tanggalValid(tanggalISO);

  const milik = await prisma.jadwal.findFirst({
    where: { id: jadwalId, userId: user.id },
    select: { id: true, pengulangan: true, googleEventId: true },
  });
  if (!milik) throw new Error("Jadwal tidak ditemukan");

  const semua = lingkup === "semua" || milik.pengulangan === "SEKALI";

  if (semua) {
    await prisma.$transaction([
      prisma.jadwal.updateMany({ where: { id: jadwalId, userId: user.id }, data: { aktif: false } }),
      prisma.kejadian.upsert({
        where: { jadwalId_tanggal: { jadwalId, tanggal } },
        create: { jadwalId, tanggal, status: "BATAL", keterangan: "Dibatalkan oleh pengguna" },
        update: { status: "BATAL", keterangan: "Dibatalkan oleh pengguna" },
      }),
    ]);
  } else {
    await prisma.kejadian.upsert({
      where: { jadwalId_tanggal: { jadwalId, tanggal } },
      create: { jadwalId, tanggal, status: "BATAL", keterangan: "Dibatalkan hanya pada tanggal ini" },
      update: { status: "BATAL", keterangan: "Dibatalkan hanya pada tanggal ini" },
    });
  }

  // Samakan dengan Google Calendar. Kalau gagal, pembatalan di Routinely tetap berlaku.
  if (milik.googleEventId) {
    try {
      if (semua) {
        await hapusEventGoogle(user.id, milik.googleEventId);
        await prisma.jadwal.update({ where: { id: jadwalId }, data: { googleEventId: null } });
      } else {
        await hapusInstansiGoogle(user.id, milik.googleEventId, tanggalISO);
      }
    } catch (e) {
      console.error("HAPUS DI KALENDER GAGAL:", e instanceof Error ? e.message : e);
    }
  }

  segarkan();
}
