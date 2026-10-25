-- CreateEnum
CREATE TYPE "Paket" AS ENUM ('BULANAN', 'TAHUNAN');

-- AlterEnum
ALTER TYPE "Pengulangan" ADD VALUE 'TAHUNAN';

-- AlterTable
ALTER TABLE "jadwal" ADD COLUMN     "seharian" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "langganan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paket" "Paket" NOT NULL,
    "berakhirPada" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "langganan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "langganan_userId_key" ON "langganan"("userId");

-- AddForeignKey
ALTER TABLE "langganan" ADD CONSTRAINT "langganan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
