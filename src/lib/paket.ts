// Aman dipakai di server maupun browser (tanpa akses database)

export const BATAS_GRATIS = 3; // jadwal yang muncul per hari untuk akun gratis

export const HARGA = {
  BULANAN: 20_000,
  TAHUNAN: 122_000,
} as const;

export function rupiah(n: number): string {
  return "Rp" + new Intl.NumberFormat("id-ID").format(n);
}
