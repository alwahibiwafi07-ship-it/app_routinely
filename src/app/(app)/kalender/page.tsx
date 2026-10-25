import { wajibLogin } from "@/lib/sesi";
import { ambilJadwalRentang } from "@/lib/jadwal";
import { hariIniWIB } from "@/lib/tanggal";
import { buatSel } from "@/lib/kalender";
import KalenderView from "./KalenderView";

export default async function KalenderPage() {
  const { user } = await wajibLogin();
  const hariIni = hariIniWIB();
  const [tahun, bulan] = hariIni.split("-").map(Number);

  const sel = buatSel(tahun, bulan - 1);
  const data = await ambilJadwalRentang(user.id, sel[0].iso, sel[sel.length - 1].iso);

  return (
    <KalenderView
      hariIniISO={hariIni}
      tahunAwal={tahun}
      bulanAwal={bulan - 1}
      dataAwal={data}
    />
  );
}
