"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { daftarTema } from "@/lib/tema";

export default function TemaPage() {
  const { theme, setTheme } = useTheme();

  // true hanya di browser. Mencegah salah tampil karena server belum tahu tema tersimpan.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [dipilih, setDipilih] = useState<string | null>(null);

  const aktif = mounted && theme ? theme : daftarTema[0].id; // tema yang sedang dipakai
  const pilihan = dipilih ?? aktif; // tema yang disorot (belum tentu diterapkan)
  const bisaTerapkan = pilihan !== aktif;

  return (
    <div className="px-5 pt-8">
      <header>
        <p className="text-sm text-muted">Kustomisasi</p>
        <h1 className="text-3xl font-bold">Tema</h1>
        <p className="text-sm text-muted">Pilih suasana yang paling nyaman untuk matamu.</p>
      </header>

      <ul className="mt-5 flex flex-col gap-3">
        {daftarTema.map((t) => {
          const terpilih = t.id === pilihan;
          const dipakai = t.id === aktif;
          const label = dipakai ? "Dipakai" : terpilih ? "Dipilih" : "Pilih";

          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setDipilih(t.id)}
                aria-pressed={terpilih}
                style={{
                  background: t.kartu.latar,
                  color: t.kartu.teks,
                  borderColor: terpilih ? t.kartu.titik : "transparent",
                }}
                className="flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition"
              >
                <span
                  className="flex size-14 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.kartu.petak }}
                >
                  <span className="size-5 rounded-full" style={{ background: t.kartu.titik }} />
                </span>

                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-lg font-bold leading-tight">{t.nama}</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ background: t.kartu.lencanaLatar, color: t.kartu.lencanaTeks }}
                    >
                      {t.premium ? "Premium" : "Gratis"}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs" style={{ color: t.kartu.redup }}>
                    {t.deskripsi}
                  </span>
                </span>

                <span
                  className="rounded-full px-3 py-1.5 text-xs font-bold"
                  style={
                    dipakai
                      ? { background: t.kartu.titik, color: t.kartu.latar === "#0b0d12" ? "#0b0d12" : "#ffffff" }
                      : { background: t.kartu.tombolLatar, color: t.kartu.tombolTeks }
                  }
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => setTheme(pilihan)}
        disabled={!bisaTerapkan}
        className="mt-5 h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
      >
        Terapkan Tema Terpilih
      </button>
    </div>
  );
}