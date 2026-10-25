"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { ubahJadwal } from "@/app/(app)/beranda/actions";
import type { HasilBuat } from "@/app/(app)/beranda/actions";
import { BATAS_GRATIS, HARGA, rupiah } from "@/lib/paket";
import { formatTanggalPanjang } from "@/lib/kalender";
import type { ItemJadwal, KodeUlang } from "@/lib/tipe";

type Props = {
  item: ItemJadwal;
  onTutup: () => void;
  setelahAksi?: () => void;
};

const OPSI_ULANG: { kode: KodeUlang; label: string }[] = [
  { kode: "SEKALI", label: "Sekali" },
  { kode: "HARIAN", label: "Setiap hari" },
  { kode: "MINGGUAN", label: "Setiap minggu" },
  { kode: "BULANAN", label: "Setiap bulan" },
  { kode: "TAHUNAN", label: "Setiap tahun" },
];
const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const gayaInput =
  "mt-1 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";

export default function EditJadwalSheet({ item, onTutup, setelahAksi }: Props) {
  const [judul, setJudul] = useState(item.judul);
  const [tanggal, setTanggal] = useState(item.tanggalMulaiISO);
  const [jam, setJam] = useState(item.jam);
  const [seharian, setSeharian] = useState(item.seharian);
  const [ulang, setUlang] = useState<KodeUlang>(item.kodeUlang);
  const [hari, setHari] = useState<number[]>(item.hariMinggu);
  const [menyimpan, setMenyimpan] = useState(false);
  const [galat, setGalat] = useState("");
  const [hasil, setHasil] = useState<HasilBuat | null>(null);

  function ubahHari(h: number) {
    setHari(hari.includes(h) ? hari.filter((x) => x !== h) : [...hari, h]);
  }

  async function simpan() {
    if (!judul.trim() || !tanggal || (!seharian && !jam)) {
      setGalat("Judul, tanggal, dan jam wajib diisi.");
      return;
    }
    setMenyimpan(true);
    setGalat("");
    try {
      const h = await ubahJadwal(item.id, {
        judul,
        jam,
        tanggalISO: tanggal,
        pengulangan: ulang,
        hariMinggu: ulang === "MINGGUAN" ? hari : [],
        seharian,
      });
      if (h.sinkron === "ok") {
        setelahAksi?.();
        onTutup();
        return;
      }
      if (h.sinkron !== "batas") setelahAksi?.();
      setHasil(h);
    } catch {
      setGalat("Gagal menyimpan. Coba lagi.");
    } finally {
      setMenyimpan(false);
    }
  }

  const selesaiTanpaKalender = hasil && hasil.sinkron !== "batas";

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40"
      onClick={onTutup}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit jadwal"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-card p-5 pb-6 shadow-xl"
      >
        <span className="mx-auto block h-1 w-10 rounded-full bg-line" />

        <header className="mt-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Edit jadwal</h2>
          <button
            onClick={onTutup}
            aria-label="Tutup"
            className="flex size-9 items-center justify-center rounded-full bg-soft"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="mt-4 space-y-3">
          <label className="block text-xs font-semibold text-muted">
            Judul
            <input
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              maxLength={120}
              className={gayaInput}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-muted">
              Tanggal mulai
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className={gayaInput}
              />
            </label>
            <label className="block text-xs font-semibold text-muted">
              Jam (WIB)
              <input
                type="time"
                value={jam}
                disabled={seharian}
                onChange={(e) => setJam(e.target.value)}
                className={`${gayaInput} disabled:opacity-40`}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={seharian}
              onChange={(e) => setSeharian(e.target.checked)}
              className="size-4 accent-indigo-600"
            />
            Seharian (tanpa jam, cocok untuk ulang tahun atau hari penting)
          </label>

          <label className="block text-xs font-semibold text-muted">
            Pengulangan
            <select
              value={ulang}
              onChange={(e) => setUlang(e.target.value as KodeUlang)}
              className={gayaInput}
            >
              {OPSI_ULANG.map((o) => (
                <option key={o.kode} value={o.kode}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {ulang === "MINGGUAN" && (
            <div>
              <p className="text-xs font-semibold text-muted">Hari</p>
              <div className="mt-1 flex gap-1.5">
                {HARI.map((nama, i) => (
                  <button
                    key={nama}
                    type="button"
                    onClick={() => ubahHari(i)}
                    aria-pressed={hari.includes(i)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold ${
                      hari.includes(i) ? "bg-primary text-primary-foreground" : "bg-soft text-muted"
                    }`}
                  >
                    {nama}
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.kodeUlang !== "SEKALI" && (
            <p className="rounded-xl bg-soft px-3 py-2 text-xs text-muted">
              Perubahan berlaku untuk seluruh jadwal berulang ini, bukan hanya tanggal{" "}
              {formatTanggalPanjang(item.iso)}.
            </p>
          )}
        </div>

        {hasil?.sinkron === "batas" && (
          <div role="alert" className="mt-4 rounded-2xl bg-soft p-4 text-sm">
            <p className="font-semibold">
              Batas {BATAS_GRATIS} jadwal per hari tercapai
            </p>
            <p className="mt-1 text-xs text-muted">
              {hasil.tanggalPenuh ? formatTanggalPanjang(hasil.tanggalPenuh) : "Satu hari"} sudah
              penuh. Ubah tanggal atau pengulangan, atau upgrade ke Pro untuk jadwal tanpa batas.
            </p>
            <Link
              href="/langganan"
              className="mt-3 block rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground"
            >
              Upgrade ke Pro • {rupiah(HARGA.BULANAN)}/bln
            </Link>
          </div>
        )}

        {selesaiTanpaKalender && (
          <p role="status" className="mt-4 rounded-xl bg-soft px-3 py-2.5 text-xs">
            Perubahan tersimpan di Routinely, tetapi{" "}
            {hasil.sinkron === "izin"
              ? "izin Google Calendar belum aktif atau sudah kedaluwarsa. Coba keluar lalu login lagi."
              : "Google Calendar belum bisa diperbarui saat ini. Coba lagi nanti."}
          </p>
        )}

        {galat && (
          <p role="alert" className="mt-3 text-center text-xs font-medium text-red-500">
            {galat}
          </p>
        )}

        {selesaiTanpaKalender ? (
          <button
            onClick={onTutup}
            className="mt-4 h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground"
          >
            Tutup
          </button>
        ) : (
          <button
            onClick={simpan}
            disabled={menyimpan}
            className="mt-4 h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/30 disabled:opacity-50"
          >
            {menyimpan ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        )}
      </div>
    </div>
  );
}
