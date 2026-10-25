export const ZONA_DEFAULT = "Asia/Jakarta";

// "2026-10-22" = tanggal hari ini di WIB
export function hariIniWIB(sekarang = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_DEFAULT }).format(sekarang);
}

// "2026-10-22" -> Date pada tengah malam UTC (cocok untuk kolom @db.Date)
export function keDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function keISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function tambahHari(iso: string, n: number): string {
  const d = keDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return keISO(d);
}