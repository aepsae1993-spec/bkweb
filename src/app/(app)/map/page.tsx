import { createClient } from "@/lib/supabase/server";
import MapView, { type MapPoint } from "@/components/MapView";
import { thaiLongDate } from "@/lib/date";

export const dynamic = "force-dynamic";

interface VisitRow {
  latitude: number | null;
  longitude: number | null;
  visited: boolean;
  visit_date: string | null;
  hv_students: { number: number | null; prefix: string | null; full_name: string } | null;
  hv_classrooms: { grade_level: string } | null;
}

export default async function MapPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hv_visits")
    .select("latitude, longitude, visited, visit_date, hv_students(number, prefix, full_name), hv_classrooms(grade_level)")
    .not("latitude", "is", null);

  const rows = (data ?? []) as unknown as VisitRow[];
  const points: MapPoint[] = rows
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => ({
      lat: r.latitude as number,
      lng: r.longitude as number,
      grade: r.hv_classrooms?.grade_level ?? "ไม่ระบุ",
      name: `${r.hv_students?.prefix ?? ""}${r.hv_students?.full_name ?? ""}`,
      number: r.hv_students?.number ?? null,
      visited: r.visited,
      date: thaiLongDate(r.visit_date),
    }));

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🗺️ แผนที่บ้านนักเรียน</h1>
          <p className="text-sm text-slate-500">
            จุดที่เช็คอินแล้ว {points.length} ตำแหน่ง · คลิกจุดเพื่อดูชั้น/ชื่อ/สถานะ · กดป้ายสีเพื่อกรองตามชั้น
          </p>
        </div>
      </div>

      {points.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-500 ring-1 ring-slate-200">
          ยังไม่มีการเช็คอิน GPS — เปิดหน้ากรอกข้อมูลนักเรียนแล้วกด “เช็คอินตำแหน่งบ้าน” ขณะอยู่ที่บ้าน
        </div>
      ) : (
        <MapView points={points} />
      )}
    </div>
  );
}
