-- CreateEnum
CREATE TYPE "Pengulangan" AS ENUM ('SEKALI', 'HARIAN', 'MINGGUAN', 'BULANAN');

-- CreateEnum
CREATE TYPE "StatusKejadian" AS ENUM ('SELESAI', 'DITUNDA', 'BATAL');

-- CreateTable
CREATE TABLE "jadwal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "lokasi" TEXT,
    "jamMulai" TEXT NOT NULL,
    "durasiMenit" INTEGER,
    "zonaWaktu" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "tanggalMulai" DATE NOT NULL,
    "pengulangan" "Pengulangan" NOT NULL DEFAULT 'SEKALI',
    "hariMinggu" INTEGER[],
    "sampaiTanggal" DATE,
    "pengecualian" DATE[],
    "esensial" BOOLEAN NOT NULL DEFAULT false,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jadwal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kejadian" (
    "id" TEXT NOT NULL,
    "jadwalId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "status" "StatusKejadian" NOT NULL,
    "keterangan" TEXT,
    "dipindahKe" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kejadian_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jadwal_userId_aktif_idx" ON "jadwal"("userId", "aktif");

-- CreateIndex
CREATE INDEX "kejadian_tanggal_idx" ON "kejadian"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "kejadian_jadwalId_tanggal_key" ON "kejadian"("jadwalId", "tanggal");

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kejadian" ADD CONSTRAINT "kejadian_jadwalId_fkey" FOREIGN KEY ("jadwalId") REFERENCES "jadwal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
