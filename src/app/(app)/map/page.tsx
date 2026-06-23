import { createClient } from "@/lib/supabase/server";
import MapView, { type MapPoint, type SchoolLoc, type RosterClass } from "@/components/MapView";
import { thaiLongDate } from "@/lib/date";
import { sortClassrooms } from "@/lib/grade";
import { getCurrentTeacher } from "@/lib/teacher";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // โหมดผู้ดูแล (ตั้งตำแหน่งโรงเรียน/ปักหมุดเอง) เปิดเฉพาะครูประวีณ
  const teacher = await getCurrentTeacher();
  const allowAdmin = teacher === "ครูประวีณ";

  // โรงเรียนของครู (สำหรับปักหมุด/วัดระยะทาง)
  const { data: profile } = await supabase
    .from("hv_profiles")
    .select("school_id")
    .eq("id", user!.id)
    .maybeSingle();
  const { data: schoolRow } = profile?.school_id
    ? await supabase.from("hv_schools").select("id, latitude, longitude").eq("id", profile.school_id).maybeSingle()
    : { data: null };
  const school: SchoolLoc | null = schoolRow
    ? { id: schoolRow.id, lat: schoolRow.latitude, lng: schoolRow.longitude }
    : null;

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

  // รายชื่อสำหรับ "ปักหมุดบ้านเอง"
  const [{ data: clsAll }, { data: studentsAll }, { data: pinned }] = await Promise.all([
    supabase.from("hv_classrooms").select("id, grade_level, room"),
    supabase.from("hv_students").select("id, classroom_id, number, prefix, full_name"),
    supabase.from("hv_visits").select("student_id").not("latitude", "is", null),
  ]);
  const pinnedSet = new Set((pinned ?? []).map((p) => p.student_id));
  const roster: RosterClass[] = sortClassrooms(clsAll ?? []).map((c) => ({
    id: c.id,
    label: `${c.grade_level}${c.room ? "/" + c.room : ""}`,
    students: (studentsAll ?? [])
      .filter((s) => s.classroom_id === c.id)
      .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
      .map((s) => ({
        id: s.id,
        label: `${s.number ? s.number + ". " : ""}${s.prefix ?? ""}${s.full_name}`,
        hasPin: pinnedSet.has(s.id),
      })),
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

      {points.length === 0 && (
        <div className="mb-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500 ring-1 ring-slate-200">
          ยังไม่มีการเช็คอิน GPS — แต่สามารถกด “🏫 ตั้งตำแหน่งโรงเรียน” เพื่อปักหมุดโรงเรียนไว้ก่อนได้
        </div>
      )}

      <MapView points={points} school={school} roster={roster} allowAdmin={allowAdmin} />
    </div>
  );
}
