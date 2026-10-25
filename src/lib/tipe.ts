export type KodeUlang = "SEKALI" | "HARIAN" | "MINGGUAN" | "BULANAN" | "TAHUNAN";

export type ItemJadwal = {
  id: string;
  judul: string;
  waktu: string;
  tanggal?: string;
  pengulangan: string;
  selesai: boolean;
  esensial: boolean;
  // Data mentah untuk menu Edit dan Hapus
  iso: string; // tanggal kemunculan ini, "YYYY-MM-DD"
  jam: string; // "HH:MM"
  seharian: boolean;
  kodeUlang: KodeUlang;
  hariMinggu: number[];
  tanggalMulaiISO: string; // tanggal mulai jadwal (bukan tanggal kemunculan)
};

export type ItemRiwayat = {
  id: string;
  judul: string;
  keterangan: string;
  status: "selesai" | "ulang" | "batal";
  tanggal: string;
};
