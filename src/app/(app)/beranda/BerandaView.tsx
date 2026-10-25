"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Plus } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import TambahJadwalSheet from "@/components/TambahJadwalSheet";
import BarisJadwal from "@/components/BarisJadwal";
import { BATAS_GRATIS, HARGA, rupiah } from "@/lib/paket";
import type { ItemJadwal } from "@/lib/tipe";
import { tandaiSelesai } from "./actions";

type Props = {
  namaDepan: string;
  tanggalISO: string;
  hariIni: ItemJadwal[];
  besok: ItemJadwal[];
  pro: boolean;
};

export default function BerandaView({ namaDepan, tanggalISO, hariIni, besok, pro }: Props) {
  const router = useRouter();
  const [, mulaiTransisi] = useTransition();
  const [sheetBuka, setSheetBuka] = useState(false);
  const [galat, setGalat] = useState("");

  // Centang langsung berubah, lalu disamakan dengan data server setelah selesai
  const [daftar, ubahOptimis] = useOptimistic(hariIni, (lama: ItemJadwal[], id: string) =>
    lama.map((j) => (j.id === id ? { ...j, selesai: !j.selesai } : j))
  );

  const jumlahSelesai = daftar.filter((j) => j.selesai).length;
  const sisaEsensial = daftar.filter((j) => j.esensial && !j.selesai).length;
  const persen = daftar.length ? (jumlahSelesai / daftar.length) * 100 : 0;

  function toggle(item: ItemJadwal) {
    setGalat("");
    mulaiTransisi(async () => {
      ubahOptimis(item.id);
      try {
        await tandaiSelesai(item.id, tanggalISO, !item.selesai);
      } catch {
        setGalat("Gagal menyimpan perubahan. Coba lagi.");
      }
    });
  }

  return (
    <div className="px-5 pt-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">Selamat pagi, {namaDepan}</p>
          <h1 className="text-3xl font-bold">Hari ini</h1>
        </div>
        <div className="flex items-center gap-2">
          {pro && (
            <span className="flex items-center gap-1 rounded-full bg-soft px-2.5 py-1 text-xs font-bold text-primary">
              <Crown className="size-3.5" /> Pro
            </span>
          )}
          <div className="flex size-10 items-center justify-center rounded-full bg-soft text-sm font-bold text-primary">
            {namaDepan.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <button
        onClick={() =>
          authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/login") } })
        }
        className="mt-2 text-xs text-muted underline"
      >
        Keluar
      </button>

      <section className="mt-5 flex items-center gap-4 rounded-2xl border border-line bg-card p-4 shadow-sm">
        <div className="relative size-12 shrink-0">
          <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-soft" strokeWidth="4" />
            <circle
              cx="18" cy="18" r="16" fill="none"
              className="stroke-primary transition-all"
              strokeWidth="4" strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${persen} 100`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
            {jumlahSelesai}/{daftar.length}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {jumlahSelesai} dari {daftar.length} selesai
          </p>
          <p className="text-xs text-primary">Sisa {sisaEsensial} jadwal esensial</p>
        </div>
        {pro ? (
          <span className="rounded-md bg-soft px-2 py-1 text-xs font-semibold text-primary">
            Tanpa batas
          </span>
        ) : (
          <Link
            href="/langganan"
            className="rounded-md bg-soft px-2 py-1 text-xs font-semibold text-primary"
          >
            {daftar.length}/{BATAS_GRATIS} harian
          </Link>
        )}
      </section>

      {/* Ajakan berlangganan untuk akun gratis */}
      {!pro && (
        <Link
          href="/langganan"
          className="mt-3 flex items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-md shadow-primary/30"
        >
          <Crown className="size-5 shrink-0" />
          <span className="flex-1">
            <span className="block text-sm font-semibold">Jadwal tanpa batas dengan Pro</span>
            <span className="block text-xs opacity-80">
              Mulai {rupiah(HARGA.BULANAN)}/bulan atau {rupiah(HARGA.TAHUNAN)}/tahun
            </span>
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">Upgrade</span>
        </Link>
      )}

      <div className="mt-4 grid grid-cols-2 rounded-xl bg-soft p-1 text-sm font-semibold">
        <span className="rounded-lg bg-card py-2 text-center shadow-sm">Daftar Jadwal</span>
        <Link href="/riwayat" className="py-2 text-center text-muted">Riwayat</Link>
      </div>

      {galat && (
        <p role="alert" className="mt-3 text-center text-xs font-medium text-red-500">{galat}</p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Hari Ini</h2>
        <span className="rounded-md bg-soft px-2 py-1 text-xs font-semibold text-soft-foreground">
          {daftar.length} Jadwal
        </span>
      </div>

      {daftar.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Belum ada jadwal hari ini. Tekan &ldquo;Jadwal baru&rdquo; untuk menambahkan.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card shadow-sm">
          {daftar.map((j) => (
            <BarisJadwal key={j.id} item={j} onToggle={toggle} />
          ))}
        </ul>
      )}

      {besok.length > 0 && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Besok</h2>
            <span className="rounded-md bg-soft px-2 py-1 text-xs font-semibold text-soft-foreground">
              {besok.length} Jadwal
            </span>
          </div>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card shadow-sm">
            {besok.map((j) => (
              <BarisJadwal key={j.id} item={j} />
            ))}
          </ul>
        </>
      )}

      {/* Ruang agar daftar tidak tertutup tombol melayang */}
      <div className="h-28" />

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-10 mx-auto flex w-full max-w-sm justify-end px-5">
        <button
          onClick={() => setSheetBuka(true)}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/40"
        >
          <Plus className="size-4" /> Jadwal baru
        </button>
      </div>

      {sheetBuka && <TambahJadwalSheet onTutup={() => setSheetBuka(false)} />}
    </div>
  );
}
