import { wajibLogin } from "@/lib/sesi";
import { ambilRiwayat } from "@/lib/jadwal";
import RiwayatView from "./RiwayatView";

export default async function RiwayatPage() {
  const { user } = await wajibLogin();
  const data = await ambilRiwayat(user.id);
  return <RiwayatView data={data} />;
}