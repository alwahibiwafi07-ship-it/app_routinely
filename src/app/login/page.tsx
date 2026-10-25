"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Ghost, Infinity as InfinityIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const jadwal = [
  { nama: "Minum vitamin", waktu: "08.00 WIB", warna: "bg-indigo-600" },
  { nama: "Bayar kos bulanan", waktu: "Tgl 1", warna: "bg-emerald-500" },
  { nama: "Pajak motor", waktu: "12 Nov", warna: "bg-slate-600" },
];

export default function LoginPage() {
  const [setuju, setSetuju] = useState(false);
  const [coba, setCoba] = useState(false); // sudah pernah menekan tombol?
  const [loading, setLoading] = useState(false);
  const [galat, setGalat] = useState("");

  const perluSetuju = coba && !setuju;

  async function masukDenganGoogle() {
    setCoba(true);
    setGalat("");
    if (!setuju) return;

    setLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/beranda",
      });
      if (error) throw error;
    } catch {
      setLoading(false);
      setGalat("Tidak bisa terhubung ke Google. Periksa koneksi lalu coba lagi.");
    }
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#faf9ff] text-slate-900">
      <div className="flex w-full max-w-sm flex-col px-5 py-8">
        {/* Header */}
        <header className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600">
            <InfinityIcon className="size-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight">Routinely</h1>
            <p className="text-sm font-medium text-slate-500">Jangan lewatkan yang rutin.</p>
          </div>
        </header>

        {/* Kartu pratinjau */}
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(79,70,229,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Jadwal otomatis tersinkron</p>
            <span className="flex size-9 items-center justify-center rounded-full bg-indigo-600">
              <Ghost className="size-4 text-white" />
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            {jadwal.map((j) => (
              <li
                key={j.nama}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-3 font-semibold">
                  <span className={`size-2.5 rounded-full ${j.warna}`} />
                  {j.nama}
                </span>
                <span className="font-semibold text-slate-500">{j.waktu}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Bagian tengah: mengisi ruang kosong dan memusatkan isinya */}
        <section className="flex flex-1 flex-col justify-center gap-4 py-8 text-center">
          <div>
            <h2 className="text-3xl font-extrabold">Selamat Datang</h2>
            <p className="mt-2 text-slate-500">
              Masuk dengan akun Google Anda untuk mulai mengelola rutinitas harian.
            </p>
          </div>

          <button
            type="button"
            onClick={masukDenganGoogle}
            disabled={loading}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white font-semibold shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          >
            <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
              <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            {loading ? "Mengalihkan..." : "Masuk dengan Google"}
          </button>

          <p className="text-sm text-slate-500">
            Akun Anda dibuat otomatis saat pertama kali masuk.
          </p>

          {/* Persetujuan */}
          <label className="mx-auto flex cursor-pointer items-start gap-3 text-left text-xs text-slate-600">
            <input
              type="checkbox"
              checked={setuju}
              onChange={(e) => setSetuju(e.target.checked)}
              className="peer sr-only"
            />
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-indigo-200 bg-white text-white transition peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-600/40">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            <span>
              Saya setuju dengan{" "}
              <Link href="#" className="text-indigo-600 underline">
                Syarat Layanan
              </Link>{" "}
              dan{" "}
              <Link href="#" className="text-indigo-600 underline">
                Kebijakan Privasi
              </Link>
              .
            </span>
          </label>

          {perluSetuju && (
            <p role="alert" className="text-xs font-medium text-red-500">
              Centang persetujuan dulu untuk melanjutkan.
            </p>
          )}
          {galat && (
            <p role="alert" className="text-xs font-medium text-red-500">
              {galat}
            </p>
          )}
        </section>

        {/* Catatan izin */}
        <footer className="text-center text-xs text-slate-400">
          Routinely meminta izin membaca &amp; menulis Google Calendar agar alarm pengingat
          berbunyi di gawai Anda.
        </footer>
      </div>
    </main>
  );
}