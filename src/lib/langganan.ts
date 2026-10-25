import "server-only";
import { prisma } from "@/lib/prisma";

// Pro = punya langganan yang belum berakhir
export async function apakahPro(userId: string): Promise<boolean> {
  const l = await prisma.langganan.findUnique({
    where: { userId },
    select: { berakhirPada: true },
  });
  return !!l && l.berakhirPada.getTime() > Date.now();
}
