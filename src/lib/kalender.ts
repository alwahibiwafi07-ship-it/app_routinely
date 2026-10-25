// Pembantu kalender. Memakai tanggal teks "YYYY-MM-DD" + UTC supaya
// tidak terpengaruh zona waktu server maupun browser.

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];
const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const HARI_SINGKAT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export type Sel = { iso: string; hari: number; bulanIni: boolean };

// bulan: 0 = Januari ... 11 = Desember
export function buatSel(tahun: number, bulan: number): Sel[] {
  const geser = new Date(Date.UTC(tahun, bulan, 1)).getUTCDay();
  const jumlah = new Date(Date.UTC(tahun, bulan + 1, 0)).getUTCDate();
  const total = Math.ceil((geser + jumlah) / 7) * 7;

  return Array.from({ length: total }, (_, i) => {
    const d = new Date(Date.UTC(tahun, bulan, 1 - geser + i));
    return {
      iso: d.toISOString().slice(0, 10),
      hari: d.getUTCDate(),
      bulanIni: d.getUTCMonth() === bulan,
    };
  });
}

export function formatTanggalPanjang(iso: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return `${NAMA_HARI[d.getUTCDay()]}, ${d.getUTCDate()} ${BULAN_SINGKAT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
