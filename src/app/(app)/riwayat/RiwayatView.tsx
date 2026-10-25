"use client";

import { useState } from "react";
import { Check, CalendarClock, X, SlidersHorizontal } from "lucide-react";
import type { ItemRiwayat } from "@/lib/tipe";

type Status = "selesai" | "ulang" | "batal";
type Filter = "semua" | Status;

const statusConfig = {
  selesai: { label: "Selesai", Icon: Check, bulatan: "bg-emerald-100 text-emerald-700", teks: "text-emerald-700" },
  ulang: { label: "Jadwal Ulang", Icon: CalendarClock, bulatan: "bg-amber-100 text-amber-600", teks: "text-amber-600" },
  batal: { label: "Batal", Icon: X, bulatan: "bg-red-100 text-red-600", teks: "text-red-700" },
} as const;

export default function RiwayatView({ data }: { data: ItemRiwayat[] }) {
  const [filter, setFilter] = useState<Filter>("semua");

  // Nilai turunan dari data
  const hitung = {
    selesai: data.filter((r) => r.status === "selesai").length,
    ulang: data.filter((r) => r.status === "ulang").length,
    batal: data.filter((r) => r.status === "batal").length,
  };

  const tersaring = filter === "semua" ? data : data.filter((r) => r.status === filter);
  const tanggalUnik = [...new Set(tersaring.map((r) => r.tanggal))];

  const chips: { key: Filter; label: string }[] = [
    { key: "semua", label: "Semua" },
    { key: "selesai", label: `Selesai (${hitung.selesai})` },
    { key: "ulang", label: "Jadwal Ulang" },
    { key: "batal", label: "Batal" },
  ];

  return (
    <div className="px-5 pt-8">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">Arsip rutinitas</p>
          <h1 className="text-3xl font-bold">Riwayat</h1>
        </div>
        <button
          aria-label="Filter lanjutan"
          className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center text-slate-700"
        >
          <SlidersHorizontal className="size-5" />
        </button>
      </header>

      {/* Kartu statistik */}
      <section className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-slate-100 p-4 shadow-sm">
        {(Object.keys(statusConfig) as Status[]).map((s) => {
          const { label, Icon, bulatan } = statusConfig[s];
          return (
            <div key={s} className="flex items-center gap-2">
              <span className={`size-9 shrink-0 rounded-full flex items-center justify-center ${bulatan}`}>
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-xs text-slate-500">{s === "ulang" ? "Diulang" : label}</p>
                <p className="text-lg font-bold leading-tight">{hitung[s]}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Chip filter (bisa digeser ke samping) */}
      <div className="mt-4 -mx-5 px-5 flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === c.key
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 text-slate-700"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Daftar per tanggal */}
      {tanggalUnik.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">Belum ada riwayat untuk filter ini.</p>
      )}

      {tanggalUnik.map((tgl) => (
        <section key={tgl} className="mt-5">
          <h2 className="text-sm text-slate-500">{tgl}</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {tersaring
              .filter((r) => r.tanggal === tgl)
              .map((r) => {
                const { label, Icon, bulatan, teks } = statusConfig[r.status];
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 shadow-sm"
                  >
                    <span className={`size-9 shrink-0 rounded-full flex items-center justify-center ${bulatan}`}>
                      <Icon className="size-4" />
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{r.judul}</p>
                      <p className="text-xs text-slate-500">{r.keterangan}</p>
                    </div>
                    <span className={`text-xs font-semibold ${teks}`}>{label}</span>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}