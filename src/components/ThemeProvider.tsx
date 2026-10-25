"use client";

import { ThemeProvider as NextThemes } from "next-themes";
import { daftarTema } from "@/lib/tema";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes
      attribute="data-theme"
      defaultTheme="profesional"
      themes={daftarTema.map((t) => t.id)}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemes>
  );
}