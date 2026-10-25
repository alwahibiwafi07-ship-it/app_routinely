"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutGrid, Palette } from "lucide-react";

const menu = [
  { href: "/kalender", label: "Kalender", Icon: CalendarDays, cocok: ["/kalender"] },
  { href: "/beranda", label: "Beranda", Icon: LayoutGrid, cocok: ["/beranda", "/riwayat"] },
  { href: "/tema", label: "Tema", Icon: Palette, cocok: ["/tema"] },
];

export default function BottomNav() {
  const pathname = usePathname(); // alamat halaman yang sedang dibuka

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 mx-auto w-full max-w-sm border-t border-slate-100 bg-indigo-50/80 backdrop-blur">
      <ul className="flex justify-around py-2">
        {menu.map(({ href, label, Icon, cocok }) => {
        const aktif = cocok.some((p) => pathname.startsWith(p));
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 text-[11px] font-semibold ${
                  aktif ? "text-indigo-600" : "text-slate-500"
                }`}
              >
                <Icon className="size-5" />
                {label}
                <span
                  className={`size-1 rounded-full ${aktif ? "bg-indigo-600" : "bg-transparent"}`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}