"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import BarisJadwal from "@/components/BarisJadwal";
import {
  HARI_SINGKAT,
  NAMA_BULAN,
  buatSel,
  formatTanggalPanjang,
  type Sel,
} from "@/lib/kalender";
import type { ItemJadwal, KodeUlang } from "@/lib/tipe";
import { ambilRentang } from "./actions";

type Props = {
  hariIniISO: string;
  tahunAwal: number;
  bulanAwal: number; // 0-11
  dataAwal: Record<string, ItemJadwal[]>;
};

// Class Tailwind ditulis lengkap supaya tidak hilang saat build
const WARNA_TITIK: Record<KodeUlang, string> = {
  SEKALI: "bg-indigo-500",
  HARIAN: "bg-slate-400",
  MINGGUAN: "bg-emerald-500",
  BULANAN: "bg-sky-500",
  TAHUNAN: "bg-amber-500",
};

export default function KalenderView({ hariIniISO, tahunAwal, bulanAwal, dataAwal }: Props) {
  const [tahun, setTahun] = useState(tahunAwal);
  const [bulan, setBulan] = useState(bulanAwal);
  const [data, setData] = useState(dataAwal);
  const [terpilih, setTerpilih] = useState(hariIniISO);
  const [galat, setGalat] = useState("");
  const [memuat, mulaiMuat] = useTransition();

  const sel = buatSel(tahun, bulan);

  // Jadwal "setiap hari" tidak ditampilkan di kalender supaya tidak memenuhi daftar
  function tampil(iso: string): ItemJadwal[] {
    return (data[iso] ?? []).filter((j) => j.kodeUlang !== "HARIAN");
  }

  function muat(t: number, b: number) {
    const s = buatSel(t, b);
    mulaiMuat(async () => {
      try {
        setData(await ambilRentang(s[0].iso, s[s.length - 1].iso));
        setGalat("");
      } catch {
        setGalat("Gagal memuat jadwal. Coba lagi.");
      }
    });
  }

  function pindahBulan(arah: -1 | 1) {
    const d = new Date(Date.UTC(tahun, bulan + arah, 1));
    const t = d.getUTCFullYear();
    const b = d.getUTCMonth();
    setTahun(t);
    setBulan(b);
    muat(t, b);
  }

  function keHariIni() {
    const [t, b] = hariIniISO.split("-").map(Number);
    setTahun(t);
    setBulan(b - 1);
    setTerpilih(hariIniISO);
    muat(t, b - 1);
  }

  function pilih(s: Sel) {
    setTerpilih(s.iso);
    // Kalau yang diklik tanggal bulan lain, pindah ke bulan itu
    if (!s.bulanIni) {
      const [t, b] = s.iso.split("-").map(Number);
      setTahun(t);
      setBulan(b - 1);
      muat(t, b - 1);
    }
  }

  const daftarTerpilih = tampil(terpilih);

  return (
    <div className="px-5 pb-28 pt-8">
      <header className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1 text-sm text-muted">
            <button
              onClick={() => pindahBulan(-1)}
              aria-label="Bulan sebelumnya"
              className="rounded-full p-1 hover:bg-soft"
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {NAMA_BULAN[bulan]} {tahun}
            </span>
            <button
              onClick={() => pindahBulan(1)}
              aria-label="Bulan berikutnya"
              className="rounded-full p-1 hover:bg-soft"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <h1 className="text-3xl font-bold">Kalender</h1>
        </div>
        <button
          onClick={keHariIni}
          className="rounded-full bg-soft px-3 py-1.5 text-xs font-semibold text-primary"
        >
          Hari ini
        </button>
      </header>

      <section
        className={`mt-5 rounded-3xl border border-line bg-card p-4 shadow-sm transition-opacity ${
          memuat ? "opacity-60" : ""
        }`}
      >
        <div className="grid grid-cols-7 text-center text-xs text-muted">
          {HARI_SINGKAT.map((h) => (
            <div key={h} className="py-2">
              {h}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {sel.map((s) => {
            const aktif = s.iso === terpilih;
            const adaHariIni = s.iso === hariIniISO;
            const titik = tampil(s.iso).slice(0, 3);
            return (
              <button
                key={s.iso}
                onClick={() => pilih(s)}
                aria-label={formatTanggalPanjang(s.iso)}
                aria-pressed={aktif}
                className="flex flex-col items-center gap-0.5 py-1 focus:outline-none"
              >
                <span
                  className={[
                    "flex size-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    aktif
                      ? "bg-primary text-primary-foreground"
                      : adaHariIni
                        ? "bg-soft font-bold text-primary"
                        : s.bulanIni
                          ? "hover:bg-soft"
                          : "text-muted opacity-40",
                  ].join(" ")}
                >
                  {s.hari}
                </span>
                <span className="flex h-1.5 gap-0.5">
                  {titik.map((j) => (
                    <span
                      key={j.id}
                      className={`size-1.5 rounded-full ${WARNA_TITIK[j.kodeUlang]}`}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {galat && (
        <p role="alert" className="mt-3 text-center text-xs font-medium text-red-500">
          {galat}
        </p>
      )}

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{formatTanggalPanjang(terpilih)}</h2>
          <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-medium text-primary">
            {daftarTerpilih.length} Jadwal
          </span>
        </div>

        {daftarTerpilih.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-soft px-4 py-6 text-center text-sm text-muted">
            Belum ada jadwal di tanggal ini.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card shadow-sm">
            {daftarTerpilih.map((j) => (
              <BarisJadwal
                key={`${j.id}-${j.iso}`}
                item={j}
                setelahAksi={() => muat(tahun, bulan)}
              />
            ))}
          </ul>
        )}
        <p className="mt-3 text-center text-[11px] text-muted">
          Jadwal &ldquo;Setiap hari&rdquo; hanya tampil di Beranda.
        </p>
      </section>
    </div>
  );
}
