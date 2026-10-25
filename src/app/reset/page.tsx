"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import { RotateCcw, MailCheck, Timer, ArrowLeft} from "lucide-react";

const DURASI_KIRIM_ULANG = 48;

export default function ResetPage() {
    const [email, setEmail] = useState("");
    const [terkirim, setTerkirim] = useState(false);
    const [detik, setDetik] = useState(0);

    const emailValid = email.includes("@") && email.includes(".");

    useEffect(() => {
        if (!terkirim || detik <= 0) return;

        const timer = setTimeout(() => setDetik((d) => d - 1), 1000);

        return () => clearTimeout(timer);
    }, [terkirim, detik]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!emailValid) return;
        setTerkirim(true);
        setDetik(DURASI_KIRIM_ULANG);
    }

    function kirimUlang() {
        if (detik > 0) return;
        setDetik(DURASI_KIRIM_ULANG)
    }

    return (
    <main className="min-h-screen bg-white text-slate-900 flex justify-center">
      <div className="w-full max-w-sm px-5 py-8 flex flex-col min-h-screen">
        <header className="mb-6">
          <div className="size-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
            <RotateCcw className="size-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold">Lupa kata sandi?</h1>
          <p className="text-sm text-slate-500">
            Tenang, kami kirimkan petunjuk reset ke emailmu.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-slate-500">
              Email terdaftar
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-xl bg-slate-100 px-4 py-3.5 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <button
            type="submit"
            disabled={!emailValid || terkirim}
            className="h-12 rounded-xl font-semibold transition bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 active:scale-[0.98] disabled:bg-indigo-100 disabled:text-slate-600 disabled:shadow-none disabled:active:scale-100"
          >
            Atur Ulang Kata Sandi
          </button>
        </form>

        {terkirim && (
          <section className="mt-5 rounded-2xl bg-indigo-50 p-5 flex flex-col items-center gap-3 text-center">
            <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <MailCheck className="size-6 text-emerald-600" />
            </div>

            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="size-5 rounded-full bg-indigo-600" />
              Cek emailmu ya!
            </p>

            <p className="text-xs text-slate-500">
              Tautan pemulihan telah terkirim. Belum menerima? Periksa folder spam.
            </p>

            <button
              type="button"
              onClick={kirimUlang}
              disabled={detik > 0}
              className="w-full rounded-lg bg-white py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:text-slate-500"
            >
              <Timer className="size-4" />
              {detik > 0 ? `Kirim ulang (${detik}s)` : "Kirim ulang"}
            </button>
          </section>
        )}

        <div className="mt-auto pt-8 flex justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm font-semibold text-indigo-600"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Login
          </Link>
        </div>
      </div>
    </main>
  );
}