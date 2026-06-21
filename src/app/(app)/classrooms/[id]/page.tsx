import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckInButton from "@/components/CheckInButton";
import ClearVisitButton from "@/components/ClearVisitButton";
import ClearClassButton from "@/components/ClearClassButton";

// ย่อคำนำหน้าให้ประหยัดพื้นที่บนมือถือ
function shortPrefix(prefix: string | null): string {
  if (!prefix) return "";
  return prefix
    .replace(/^เด็กชาย\s*/, "ด.ช.")
    .replace(/^เด็กหญิง\s*/, "ด.ญ.")
    .replace(/^นางสาว\s*/, "น.ส.");
}

export default async function ClassroomDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: classroom } = await supabase
    .from("hv_classrooms")
    .select("id, grade_level, room, academic_year, semester")
    .eq("id", id)
    .maybeSingle();
  if (!classroom) notFound();

  const { data: students } = await supabase
    .from("hv_students")
    .select("id, number, prefix, full_name, gender")
    .eq("classroom_id", id)
    .order("number", { ascending: true });

  const { data: visits } = await supabase
    .from("hv_visits")
    .select("student_id, checked_in_at, narrative, note, data")
    .eq("classroom_id", id);
  const visitMap = new Map((visits || []).map((v) => [v.student_id, v]));

  const hasData = (v: { narrative: string | null; note: string | null; data: unknown } | undefined) =>
    !!v && (
      !!v.narrative ||
      !!v.note ||
      (typeof v.data === "object" && v.data !== null && Object.keys(v.data as object).length > 0)
    );

  const total = students?.length || 0;
  const checkedInCount = (visits || []).filter((v) => v.checked_in_at).length;
  const recordedCount = (visits || []).filter((v) => hasData(v)).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/classrooms" className="text-sm text-indigo-600 hover:underline">← ชั้นเรียนทั้งหมด</Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {classroom.grade_level} {classroom.room ? `ห้อง ${classroom.room}` : ""}
            <span className="ml-2 text-base font-normal text-slate-500">ภาคเรียน {classroom.semester}/{classroom.academic_year}</span>
          </h1>
          <p className="text-sm text-slate-500">นักเรียน {total} คน · เยี่ยมแล้ว (เช็คอิน) {checkedInCount} คน · บันทึกข้อมูลแล้ว {recordedCount} คน</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/classrooms/${id}/manage`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            👥 จัดการนักเรียน
          </Link>
          <Link href={`/classrooms/${id}/report`} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            📄 รายงาน / ออกรูปเล่ม
          </Link>
          <ClearClassButton classroomId={id} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {total === 0 ? (
          <div className="px-4 py-10 text-center text-slate-400">
            ยังไม่มีนักเรียน — <Link href={`/classrooms/${id}/manage`} className="font-semibold text-indigo-600 hover:underline">เพิ่มนักเรียน</Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(students || []).map((s) => {
              const v = visitMap.get(s.id);
              const checkedIn = !!v?.checked_in_at;
              const recorded = hasData(v);
              return (
                <li key={s.id} className="flex flex-col gap-2 px-3 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4">
                  {/* เลขที่ + ชื่อ */}
                  <div className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="w-6 shrink-0 text-sm text-slate-400">{s.number}</span>
                    <Link href={`/classrooms/${id}/students/${s.id}`} className="truncate font-medium text-slate-800 hover:text-indigo-600 hover:underline">
                      {shortPrefix(s.prefix)}{s.full_name}
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pl-8 sm:pl-0">
                    {/* สถานะ (ป้ายบอกสถานะ ไม่ใช่ปุ่ม) */}
                    <div className="flex cursor-default select-none items-center gap-1.5">
                      {checkedIn
                        ? <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />เยี่ยมแล้ว</span>
                        : <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" />ยังไม่เยี่ยม</span>}
                      {recorded
                        ? <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700"><span className="h-1.5 w-1.5 rounded-full bg-sky-500" />บันทึกแล้ว</span>
                        : <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />ยังไม่บันทึก</span>}
                    </div>

                    {/* ปุ่มกด */}
                    <div className="flex items-center gap-2 sm:border-l sm:border-slate-200 sm:pl-3">
                      <CheckInButton studentId={s.id} classroomId={id} checkedIn={checkedIn} />
                      <Link href={`/classrooms/${id}/students/${s.id}`} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                        ✏️ กรอกข้อมูล
                      </Link>
                      {v && <ClearVisitButton studentId={s.id} />}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
