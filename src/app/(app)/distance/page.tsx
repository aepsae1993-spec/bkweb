import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { sortClassrooms } from "@/lib/grade";
import ComputeDistanceButton from "@/components/ComputeDistanceButton";

export const dynamic = "force-dynamic";

function km(m: number | null) {
  if (m == null) return null;
  return (m / 1000).toFixed(m < 10000 ? 1 : 0);
}
function mins(s: number | null) {
  if (s == null) return null;
  return Math.max(1, Math.round(s / 60));
}

export default async function DistancePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const supabase = await createClient();

  const { data: clsData } = await supabase
    .from("hv_classrooms")
    .select("id, grade_level, room, academic_year, semester, school_id");
  const classrooms = sortClassrooms(clsData ?? []);

  // ตรวจว่ามีพิกัดโรงเรียนหรือยัง
  const schoolId = classrooms[0]?.school_id ?? null;
  const { data: school } = schoolId
    ? await supabase.from("hv_schools").select("name, latitude, longitude").eq("id", schoolId).maybeSingle()
    : { data: null };
  const hasSchoolLoc = !!(school?.latitude && school?.longitude);

  const selected = classrooms.find((x) => x.id === c) || null;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">📏 ระยะทางจากโรงเรียนไปบ้านนักเรียน</h1>
      <p className="mb-4 text-sm text-slate-500">วัดระยะตามถนน (ขับรถ) จากโรงเรียน → บ้านที่เช็คอินไว้ · เรียงไกล → ใกล้</p>

      {!hasSchoolLoc && (
        <div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
          ยังไม่ได้ตั้งตำแหน่งโรงเรียน — ไปที่{" "}
          <Link href="/map" className="font-semibold underline">หน้าแผนที่</Link>{" "}
          แล้วกด “ตั้งตำแหน่งโรงเรียน” เพื่อปักหมุดก่อน
        </div>
      )}

      {/* เลือกห้อง */}
      <div className="mb-6 flex flex-wrap gap-2">
        {classrooms.map((cl) => {
          const active = cl.id === c;
          return (
            <Link
              key={cl.id}
              href={`/distance?c=${cl.id}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${
                active ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50"
              }`}
            >
              {cl.grade_level}{cl.room ? `/${cl.room}` : ""}
            </Link>
          );
        })}
      </div>

      {!selected ? (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-500 ring-1 ring-slate-200">
          เลือกห้องด้านบนเพื่อดูระยะทาง
        </div>
      ) : (
        <RoomDistance classroomId={selected.id} title={`${selected.grade_level}${selected.room ? " ห้อง " + selected.room : ""}`} canCompute={hasSchoolLoc} />
      )}
    </div>
  );
}

async function RoomDistance({ classroomId, title, canCompute }: { classroomId: string; title: string; canCompute: boolean }) {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("hv_students")
    .select("id, number, prefix, full_name")
    .eq("classroom_id", classroomId);
  const { data: visits } = await supabase
    .from("hv_visits")
    .select("student_id, latitude, road_distance_m, road_duration_s")
    .eq("classroom_id", classroomId)
    .not("latitude", "is", null);

  const vmap = new Map((visits || []).map((v) => [v.student_id, v]));
  const rows = (students || [])
    .map((s) => ({ s, v: vmap.get(s.id) }))
    .filter((r) => r.v) // เฉพาะคนที่เช็คอินแล้ว
    .sort((a, b) => (b.v!.road_distance_m ?? -1) - (a.v!.road_distance_m ?? -1));

  const td = "border-b border-slate-100 px-4 py-3 text-sm";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800">{title} · เช็คอินแล้ว {rows.length} คน</h2>
        {canCompute && <ComputeDistanceButton classroomId={classroomId} />}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-400 ring-1 ring-slate-200">
          ยังไม่มีนักเรียนที่เช็คอิน GPS ในห้องนี้
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">อันดับ</th>
                <th className="px-4 py-2 font-medium">ชื่อ - นามสกุล</th>
                <th className="px-4 py-2 text-right font-medium">ระยะทาง</th>
                <th className="px-4 py-2 text-right font-medium">เวลาขับ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.s.id} className="hover:bg-slate-50">
                  <td className={`${td} text-slate-400`}>{i + 1}</td>
                  <td className={`${td} font-medium text-slate-800`}>{r.s.prefix || ""}{r.s.full_name}</td>
                  <td className={`${td} text-right`}>
                    {r.v!.road_distance_m != null ? (
                      <span className="font-semibold text-indigo-700">{km(r.v!.road_distance_m)} กม.</span>
                    ) : (
                      <span className="text-slate-400">กดคำนวณ</span>
                    )}
                  </td>
                  <td className={`${td} text-right text-slate-600`}>
                    {r.v!.road_duration_s != null ? `${mins(r.v!.road_duration_s)} นาที` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
