"use server";

import { wajibLogin } from "@/lib/sesi";
import { ambilJadwalRentang } from "@/lib/jadwal";
import { keDate } from "@/lib/tanggal";
import type { ItemJadwal } from "@/lib/tipe";

const POLA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function ambilRentang(
  dari: string,
  sampai: string,
): Promise<Record<string, ItemJadwal[]>> {
  const { user } = await wajibLogin();
  if (!POLA_ISO.test(dari) || !POLA_ISO.test(sampai) || dari > sampai) {
    throw new Error("Rentang tidak valid");
  }
  const selisihHari = (keDate(sampai).getTime() - keDate(dari).getTime()) / 86_400_000;
  if (selisihHari > 60) throw new Error("Rentang terlalu panjang");

  return ambilJadwalRentang(user.id, dari, sampai);
}
