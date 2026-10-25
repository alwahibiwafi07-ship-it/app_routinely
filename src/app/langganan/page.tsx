"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, ShieldCheck } from "lucide-react";

type PaketId = "bulanan" | "tahunan";

const HARGA_BULANAN = 29000;
const HARGA_TAHUNAN = 249000;

const paket = [
  { id: "bulanan" as const, nama: "Bulanan", harga: HARGA_BULANAN, satuan: "per bulan" },
  { id: "tahunan" as const, nama: "Tahunan", harga: HARGA_TAHUNAN, satuan: "" },
];

const keunggulan = [
  "Jadwal tanpa batas per hari",
  "Sinkron instan dua arah Google Calendar",
  "Akses prioritas tema eksklusif",
];

// 29000 -> "29.000"
const rupiah = (n: number) => new Intl.NumberFormat("id-ID").format(n);

// Nilai turunan yang tidak berubah, jadi cukup dihitung sekali di luar komponen
const hemat = Math.round((1 - HARGA_TAHUNAN / (HARGA_BULANAN * 12)) * 100); // 28
const perBulan = Math.round(HARGA_TAHUNAN / 12 / 1000); // 21 (dalam ribuan)

export default function LanggananPage() {
  const router = useRouter();
  const [dipilih, setDipilih] = useState<PaketId>("tahunan");
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      // TODO: minta token pembayaran ke API route kita, lalu buka Midtrans Snap
      await new Promise((r) => setTimeout(r, 1500)); // simulasi proses
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 flex justify-center">
      <div className="w-full max-w-sm px-5 pt-3 pb-6 flex flex-col min-h-screen">
        {/* Handle bottom sheet */}
        <span className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-200" />

        {/* Info batas harian */}
        <section className="flex items-center gap-3 rounded-2xl bg-indigo-50 p-4">
          <span className="size-9 shrink-0 rounded-full bg-indigo-600" />
          <div>
            <p className="text-sm font-semibold text-indigo-600">Batas harian tercapai</p>
            <p className="text-xs text-slate-500">
              5 dari 5 jadwal gratis hari ini telah digunakan.
            </p>
          </div>
        </section>

        {/* Pilihan paket */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {paket.map((p) => {
            const aktif = dipilih === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setDipilih(p.id)}
                aria-pressed={aktif}
                className={`relative rounded-2xl p-4 text-left transition ${
                  aktif
                    ? "border-2 border-indigo-600 bg-white shadow-md"
                    : "border-2 border-transparent bg-indigo-50"
                }`}
              >
                {p.id === "tahunan" && (
                  <span className="absolute -top-0 right-0 rounded-bl-lg rounded-tr-2xl bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    Hemat {hemat}%
                  </span>
                )}
                <p className="text-xs text-slate-500">{p.nama}</p>
                <p className="mt-1 text-lg font-bold">Rp {rupiah(p.harga)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {p.id === "tahunan" ? `Rp ${perBulan}rb/bln` : p.satuan}
                </p>
              </button>
            );
          })}
        </div>

        {/* Daftar keunggulan */}
        <ul className="mt-5 flex flex-col gap-3">
          {keunggulan.map((k) => (
            <li key={k} className="flex items-center gap-3 text-sm">
              <CircleCheck className="size-5 shrink-0 text-emerald-600" />
              {k}
            </li>
          ))}
        </ul>

        {/* Metode pembayaran */}
        <div className="mt-5 flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3 text-xs">
          <span className="text-slate-500">Metode: QRIS / VA / CC</span>
          <span className="flex items-center gap-1 font-bold">
            <ShieldCheck className="size-4 text-emerald-600" />
            Midtrans
          </span>
        </div>

        {/* Tombol bawah */}
        <div className="mt-auto flex flex-col items-center gap-3 pt-8">
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={loading}
            className="h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-600/30 transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Upgrade ke Premium"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-slate-600"
          >
            Nanti saja
          </button>
        </div>
      </div>
    </main>
  );
}