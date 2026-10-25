"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, CalendarDays, Clock, Lock, Pencil, RotateCcw, Sparkles, Type, X } from "lucide-react";
import { BATAS_GRATIS, HARGA, rupiah } from "@/lib/paket";
import { buatJadwal } from "@/app/(app)/beranda/actions";

type Props = {
  onTutup: () => void;
};

// "info" hanya tampilan (mis. "tersimpan"), tidak dikirim ke AI
type Pesan = { peran: "user" | "model" | "info"; teks: string };

type Draf = {
  judul: string;
  tanggalISO: string;
  jam: string;
  pengulangan: "SEKALI" | "HARIAN" | "MINGGUAN" | "BULANAN" | "TAHUNAN";
  hariMinggu: number[];
  seharian: boolean;
};

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const SARAN = [
  "Minum vitamin, setiap hari 08.00",
  "Rapat tim, tiap Senin 09.00",
  "Bayar kos tanggal 13 Desember jam 10",
];

const formatTanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function labelTanggal(iso: string) {
  return formatTanggal.format(new Date(`${iso}T00:00:00.000Z`));
}

function labelUlang(d: Draf) {
  switch (d.pengulangan) {
    case "HARIAN":
      return "Setiap hari";
    case "TAHUNAN":
      return "Setiap tahun";
    case "BULANAN":
      return "Setiap bulan";
    case "MINGGUAN":
      return d.hariMinggu.length
        ? "Setiap " + d.hariMinggu.map((h) => NAMA_HARI[h]).join(", ")
        : "Setiap minggu";
    default:
      return "Sekali";
  }
}

export default function TambahJadwalSheet({ onTutup }: Props) {
  const [pesan, setPesan] = useState<Pesan[]>([]);
  // Percakapan AI dimulai dari indeks ini (direset setiap jadwal tersimpan)
  const [mulaiKonteks, setMulaiKonteks] = useState(0);
  const [draf, setDraf] = useState<Draf | null>(null);
  const [input, setInput] = useState("");
  const [berpikir, setBerpikir] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [galat, setGalat] = useState("");
  // Tanggal yang sudah penuh (akun gratis). null = tidak ada masalah kuota.
  const [batas, setBatas] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dasarRef = useRef<HTMLDivElement>(null);

  // Tutup dengan tombol Escape
  useEffect(() => {
    function tekan(e: KeyboardEvent) {
      if (e.key === "Escape") onTutup();
    }
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [onTutup]);

  // Gulir otomatis ke pesan terbaru
  useEffect(() => {
    dasarRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [pesan, draf, berpikir]);

  async function kirim(teksMentah: string) {
    const teks = teksMentah.trim();
    if (!teks || berpikir || menyimpan) return;

    const riwayat: Pesan[] = [...pesan, { peran: "user", teks }];
    setPesan(riwayat);
    setInput("");
    setGalat("");
    setBatas(null);
    setBerpikir(true);

    try {
      const konteks = riwayat
        .slice(mulaiKonteks)
        .filter((p) => p.peran !== "info")
        .slice(-12);
      const res = await fetch("/api/ai/jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pesan: konteks }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        setGalat(data?.galat ?? "Gagal menghubungi AI. Coba lagi.");
        return;
      }
      setPesan([...riwayat, { peran: "model", teks: data.balasan }]);
      setDraf(data.draf ?? null);
    } catch {
      setGalat("Koneksi bermasalah. Coba lagi.");
    } finally {
      setBerpikir(false);
    }
  }

  async function simpan() {
    if (!draf || menyimpan) return;
    setMenyimpan(true);
    setGalat("");
    try {
      const hasil = await buatJadwal({
        judul: draf.judul,
        jam: draf.jam,
        tanggalISO: draf.tanggalISO,
        pengulangan: draf.pengulangan,
        hariMinggu: draf.hariMinggu,
        seharian: draf.seharian,
      });

      // Akun gratis penuh: jadwal tidak disimpan, draf tetap ada supaya bisa diubah
      if (hasil.sinkron === "batas") {
        setBatas(hasil.tanggalPenuh ?? "");
        setMenyimpan(false);
        return;
      }
      // Tetap di sheet: kosongkan draf dan mulai percakapan baru untuk jadwal berikutnya
      const status =
        hasil.sinkron === "ok"
          ? "tersimpan dan sudah masuk ke Google Calendar-mu."
          : hasil.sinkron === "izin"
            ? "tersimpan, tapi belum masuk Google Calendar karena izin kalender belum aktif atau sudah kedaluwarsa. Coba keluar lalu login lagi."
            : "tersimpan, tapi belum bisa masuk Google Calendar saat ini. Coba lagi nanti.";
      const info: Pesan = {
        peran: "info",
        teks: `✓ "${draf.judul}" ${status} Mau tambah jadwal lain?`,
      };
      setPesan([...pesan, info]);
      setMulaiKonteks(pesan.length + 1);
      setDraf(null);
      setMenyimpan(false);
      inputRef.current?.focus();
    } catch {
      setGalat("Gagal menyimpan. Coba lagi.");
      setMenyimpan(false);
    }
  }

  function batalkanDraf() {
    setDraf(null);
    setPesan([]);
    setMulaiKonteks(0);
    setGalat("");
    inputRef.current?.focus();
  }

  return (
    // Latar gelap: klik di sini menutup sheet
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40"
      onClick={onTutup}
    >
      {/* Panel putih: klik di dalamnya TIDAK boleh menutup */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tambahkan jadwal"
        onClick={(e) => e.stopPropagation()}
        className="flex h-[88vh] w-full max-w-sm flex-col rounded-t-3xl bg-white pb-5 text-slate-900 shadow-xl"
      >
        <span className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-slate-200" />

        {/* Header */}
        <header className="flex shrink-0 items-center justify-between px-5 pt-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="size-5 text-indigo-600" />
              Tambahkan jadwal
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">Ketik saja, AI yang mengisi.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-slate-600">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              AI Asisten
            </span>
            <button
              onClick={onTutup}
              aria-label="Tutup"
              className="flex size-9 items-center justify-center rounded-full bg-indigo-50"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        {/* Area chat */}
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-indigo-50 px-4 py-3 text-sm">
            Halo, senang bertemu kamu! 👋 Ceritakan saja jadwalmu dengan kalimat
            biasa, misalnya:{" "}
            <span className="font-medium">besok jam 7 olahraga</span>. Kalau
            masih bingung soal waktunya, kita bisa diskusi dulu.
            <span className="mt-2 block text-xs text-slate-500">
              Satu percakapan untuk satu jadwal ya. Setelah drafnya pas, tekan
              Simpan, lalu kita lanjut ke jadwal berikutnya.
            </span>
          </div>

          {pesan.map((p, i) =>
            p.peran === "info" ? (
              <p
                key={i}
                className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800"
              >
                {p.teks}
              </p>
            ) : p.peran === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-indigo-700 px-4 py-2.5 text-sm font-medium text-white">
                  {p.teks}
                </div>
              </div>
            ) : (
              <div
                key={i}
                className="max-w-[85%] rounded-2xl rounded-tl-md bg-indigo-50 px-4 py-3 text-sm"
              >
                {p.teks}
              </div>
            ),
          )}

          {berpikir && (
            <div className="flex w-fit items-center gap-1 rounded-2xl rounded-tl-md bg-indigo-50 px-4 py-3">
              <span className="size-1.5 animate-bounce rounded-full bg-indigo-400" />
              <span className="size-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
            </div>
          )}

          {/* Kartu draf */}
          {draf && !berpikir && (
            <section className="rounded-2xl bg-indigo-50 p-4">
              <h3 className="mb-3 text-xs font-bold tracking-wide text-indigo-700">
                DRAF JADWAL
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <Type className="size-4" /> Judul
                  </span>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-semibold text-indigo-700">
                    {draf.judul}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays className="size-3.5" /> Tanggal
                    </span>
                    <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-sm font-semibold text-emerald-800">
                      {labelTanggal(draf.tanggalISO)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="size-3.5" /> Waktu
                    </span>
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-800">
                      {draf.seharian ? "Seharian" : `${draf.jam.replace(":", ".")} WIB`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <RotateCcw className="size-4" /> Pengulangan
                  </span>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-sm font-semibold text-sky-800">
                    {labelUlang(draf)}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={batalkanDraf}
                  className="px-3 py-2 text-sm text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => inputRef.current?.focus()}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-100 px-3.5 py-2 text-sm font-semibold text-indigo-700"
                >
                  <Pencil className="size-3.5" /> Ubah
                </button>
              </div>
              <p className="mt-2 text-right text-[11px] text-slate-400">
                Mau ubah? Ketik di bawah, misalnya &quot;ganti jadi jam 8&quot;.
              </p>
            </section>
          )}

          {batas !== null && (
            <section
              role="alert"
              className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm"
            >
              <p className="flex items-center gap-2 font-bold text-indigo-800">
                <Lock className="size-4" /> Batas {BATAS_GRATIS} jadwal per hari tercapai
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {batas ? `Pada ${labelTanggal(batas)}` : "Pada salah satu harinya"} sudah ada{" "}
                {BATAS_GRATIS} jadwal. Jadwal ini belum disimpan. Ubah tanggalnya lewat chat
                (mis. &quot;pindah ke besok&quot;), atau upgrade ke Pro untuk jadwal tanpa batas.
              </p>
              <Link
                href="/langganan"
                className="mt-3 block rounded-xl bg-indigo-700 py-2.5 text-center text-sm font-semibold text-white"
              >
                Upgrade ke Pro • {rupiah(HARGA.BULANAN)}/bln
              </Link>
              <button
                type="button"
                onClick={() => setBatas(null)}
                className="mt-1 w-full py-2 text-xs text-slate-500"
              >
                Nanti saja
              </button>
            </section>
          )}

          {galat && (
            <p role="alert" className="text-center text-xs font-medium text-red-500">
              {galat}
            </p>
          )}
          <div ref={dasarRef} />
        </div>

        {/* Saran cepat */}
        <div className="shrink-0 px-5">
          <p className="text-xs text-slate-500">Saran cepat:</p>
          <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
            {SARAN.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => kirim(s)}
                disabled={berpikir || menyimpan}
                className="shrink-0 rounded-full bg-indigo-50 px-3 py-1.5 text-xs text-slate-700 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Kolom input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              kirim(input);
            }}
            className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white py-1.5 pl-4 pr-1.5 shadow-sm"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              autoFocus
              placeholder="Ketik jadwalmu, misalnya: besok jam 7 olahraga"
              aria-label="Tulis jadwal dengan kalimat biasa"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              aria-label="Kirim"
              disabled={!input.trim() || berpikir || menyimpan}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-700 text-white disabled:bg-indigo-200"
            >
              <ArrowUp className="size-5" />
            </button>
          </form>

          {/* Tombol simpan */}
          <button
            type="button"
            onClick={simpan}
            disabled={!draf || berpikir || menyimpan}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 font-semibold text-white shadow-lg shadow-indigo-700/30 transition active:scale-[0.98] disabled:bg-indigo-200 disabled:shadow-none"
          >
            {menyimpan ? "Menyimpan..." : "Simpan & Sinkronkan"}
          </button>
        </div>
      </div>
    </div>
  );
}
