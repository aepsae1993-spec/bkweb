import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: classrooms } = await supabase
    .from("hv_classrooms")
    .select("id, grade_level, room, academic_year, semester")
    .order("created_at", { ascending: false });

  // นับนักเรียน/การเยี่ยม ต่อห้อง
  const ids = (classrooms || []).map((c) => c.id);
  const counts: Record<string, { students: number; visited: number }> = {};
  if (ids.length) {
    const { data: students } = await supabase
      .from("hv_students")
      .select("id, classroom_id")
      .in("classroom_id", ids);
    const { data: visits } = await supabase
      .from("hv_visits")
      .select("classroom_id, visited")
      .in("classroom_id", ids);
    for (const id of ids) counts[id] = { students: 0, visited: 0 };
    for (const s of students || []) counts[s.classroom_id].students++;
    for (const v of visits || []) if (v.visited) counts[v.classroom_id].visited++;
  }

  const { data: profile } = await supabase
    .from("hv_profiles")
    .select("full_name, school_id")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">สวัสดี {profile?.full_name || "คุณครู"} 👋</h1>
      <p className="mb-6 text-slate-500">ระบบบันทึกและรายงานการเยี่ยมบ้านนักเรียน</p>

      {!profile?.school_id && (
        <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
          ยังไม่ได้ตั้งค่าข้อมูลโรงเรียน{" "}
          <Link href="/setup" className="font-semibold underline">ตั้งค่าตอนนี้</Link>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">ชั้นเรียนของฉัน</h2>
        <Link href="/classrooms" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          + จัดการชั้นเรียน
        </Link>
      </div>

      {(classrooms || []).length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-500 ring-1 ring-slate-200">
          ยังไม่มีชั้นเรียน — <Link href="/classrooms" className="font-semibold text-indigo-600 hover:underline">สร้างชั้นเรียนแรก</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(classrooms || []).map((c) => {
            const ct = counts[c.id] || { students: 0, visited: 0 };
            const pct = ct.students ? Math.round((ct.visited / ct.students) * 100) : 0;
            return (
              <Link key={c.id} href={`/classrooms/${c.id}`} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-300">
                <div className="text-lg font-bold text-slate-900">
                  {c.grade_level} {c.room ? `ห้อง ${c.room}` : ""}
                </div>
                <div className="text-sm text-slate-500">ภาคเรียน {c.semester}/{c.academic_year}</div>
                <div className="mt-4 flex items-end justify-between">
                  <div className="text-sm text-slate-600">
                    นักเรียน <span className="font-semibold">{ct.students}</span> คน
                  </div>
                  <div className="text-sm text-slate-600">เยี่ยมแล้ว <span className="font-semibold text-emerald-600">{ct.visited}</span></div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
