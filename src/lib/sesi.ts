import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// cache(): beberapa pemanggilan dalam satu permintaan hanya mengecek sekali
export const ambilSesi = cache(async () =>
  auth.api.getSession({ headers: await headers() })
);

export async function wajibLogin() {
  const sesi = await ambilSesi();
  if (!sesi) redirect("/login");
  return sesi;
}