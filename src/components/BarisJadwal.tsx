"use client";

import { useState, useTransition } from "react";
import { Check, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { hapusJadwal } from "@/app/(app)/beranda/actions";
import type { ItemJadwal } from "@/lib/tipe";
import EditJadwalSheet from "./EditJadwalSheet";

type Props = {
  item: ItemJadwal;
  // Kalau diisi, tampil lingkaran "selesai" (dipakai untuk jadwal hari ini)
  onToggle?: (item: ItemJadwal) => void;
  // Dipanggil setelah edit atau hapus berhasil (mis. untuk memuat ulang kalender)
  setelahAksi?: () => void;
};

// Satu baris jadwal lengkap dengan menu Edit / Hapus. Pakai di dalam <ul>.
export default function BarisJadwal({ item: j, onToggle, setelahAksi }: Props) {
  const [menu, setMenu] = useState(false);
  const [dialogHapus, setDialogHapus] = useState(false);
  const [edit, setEdit] = useState(false);
  const [galat, setGalat] = useState("");
  const [sibuk, mulai] = useTransition();

  function hapus(lingkup: "ini" | "semua") {
    setGalat("");
    setDialogHapus(false);
    setMenu(false);
    mulai(async () => {
      try {
        await hapusJadwal(j.id, j.iso, lingkup);
        setelahAksi?.();
      } catch {
        setGalat("Gagal menghapus. Coba lagi.");
      }
    });
  }

  function klikHapus() {
    setMenu(false);
    if (j.kodeUlang === "SEKALI") hapus("semua");
    else setDialogHapus(true);
  }

  return (
    <li className={`p-4 transition ${sibuk ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3">
        {onToggle ? (
          <button
            onClick={() => onToggle(j)}
            aria-label="Tandai selesai"
            className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full ${
              j.selesai ? "bg-emerald-600 text-white" : "border-2 border-line bg-soft"
            }`}
          >
            {j.selesai && <Check className="size-4" />}
          </button>
        ) : (
          <span className="mt-2.5 size-2 shrink-0 rounded-full bg-muted" />
        )}

        <div className="min-w-0 flex-1">
          <p className={`font-semibold ${j.selesai ? "text-muted line-through" : ""}`}>{j.judul}</p>
          <p className="text-sm">
            <span className={`font-semibold ${j.selesai ? "text-muted" : "text-accent"}`}>
              {j.waktu}
            </span>
            {j.tanggal && <span className="text-muted"> • {j.tanggal}</span>}
          </p>
        </div>

        <span className="shrink-0 rounded-md bg-soft px-2 py-1 text-xs text-soft-foreground">
          {j.pengulangan}
        </span>
        <button
          onClick={() => setMenu(!menu)}
          aria-label="Menu"
          aria-expanded={menu}
          className="shrink-0 rounded-md bg-soft p-1"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {menu && (
        <div className="mt-3 flex items-center justify-around rounded-xl bg-card py-2.5 text-sm font-semibold shadow-md">
          <button
            onClick={() => {
              setMenu(false);
              setEdit(true);
            }}
            className="flex items-center gap-1.5 text-primary"
          >
            <Pencil className="size-4" /> Edit
          </button>
          <button onClick={klikHapus} className="flex items-center gap-1.5 text-red-500">
            <Trash2 className="size-4" /> Hapus
          </button>
        </div>
      )}

      {galat && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-500">
          {galat}
        </p>
      )}

      {/* Pilihan hapus untuk jadwal berulang */}
      {dialogHapus && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setDialogHapus(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Hapus jadwal berulang"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl"
          >
            <h3 className="text-base font-bold">Hapus jadwal berulang</h3>
            <p className="mt-1 text-sm text-muted">
              &ldquo;{j.judul}&rdquo; berulang. Mau hapus yang mana?
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => hapus("ini")}
                className="rounded-xl bg-soft py-3 text-sm font-semibold text-primary"
              >
                Hanya tanggal ini
              </button>
              <button
                onClick={() => hapus("semua")}
                className="rounded-xl bg-red-500 py-3 text-sm font-semibold text-white"
              >
                Semua jadwal ini
              </button>
              <button
                onClick={() => setDialogHapus(false)}
                className="py-2 text-sm text-muted"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {edit && (
        <EditJadwalSheet item={j} onTutup={() => setEdit(false)} setelahAksi={setelahAksi} />
      )}
    </li>
  );
}
