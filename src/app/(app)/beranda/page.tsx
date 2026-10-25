import { wajibLogin } from "@/lib/sesi";
import { ambilJadwalHari } from "@/lib/jadwal";
import { apakahPro } from "@/lib/langganan";
import { hariIniWIB, tambahHari } from "@/lib/tanggal";
import BerandaView from "./BerandaView";

export default async function BerandaPage() {
  const { user } = await wajibLogin();
  const hariIni = hariIniWIB();

  const [itemHariIni, itemBesok, pro] = await Promise.all([
    ambilJadwalHari(user.id, hariIni),
    ambilJadwalHari(user.id, tambahHari(hariIni, 1)),
    apakahPro(user.id),
  ]);

  return (
    <BerandaView
      namaDepan={user.name?.split(" ")[0] ?? ""}
      tanggalISO={hariIni}
      hariIni={itemHariIni}
      besok={itemBesok}
      pro={pro}
    />
  );
}
