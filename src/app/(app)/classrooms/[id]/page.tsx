import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addStudentsBulk, deleteStudent, deleteClassroom } from "@/lib/actions/classrooms";
import CheckInButton from "@/components/CheckInButton";
import ClearVisitButton from "@/components/ClearVisitButton";

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
        <div className="flex gap-2">
          <Link href={`/classrooms/${id}/report`} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            📄 รายงาน / ออกรูปเล่ม
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {total === 0 && (
            <div className="px-4 py-8 text-center text-slate-400">ยังไม่มีนักเรียน เพิ่มจากกล่องด้านล่าง</div>
          )}
          <ul className="divide-y divide-slate-100">
            {(students || []).map((s) => {
              const v = visitMap.get(s.id);
              const checkedIn = !!v?.checked_in_at;
              const recorded = hasData(v);
              return (
                <li key={s.id} className="flex flex-col gap-2 px-3 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-3">
                  {/* เลขที่ + ชื่อ */}
                  <div className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="w-6 shrink-0 text-sm text-slate-400">{s.number}</span>
                    <Link href={`/classrooms/${id}/students/${s.id}`} className="truncate font-medium text-slate-800 hover:text-indigo-600 hover:underline">
                      {shortPrefix(s.prefix)}{s.full_name}
                    </Link>
                  </div>
                  {/* สถานะ + ปุ่ม */}
                  <div className="flex flex-wrap items-center gap-1.5 pl-8 sm:justify-end sm:pl-0">
                    {checkedIn
                      ? <span className="whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">เยี่ยมแล้ว</span>
                      : <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">ยังไม่เยี่ยม</span>}
                    {recorded
                      ? <span className="whitespace-nowrap rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">บันทึกแล้ว</span>
                      : <span className="whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">ยังไม่บันทึก</span>}
                    <CheckInButton studentId={s.id} classroomId={id} checkedIn={checkedIn} />
                    <Link href={`/classrooms/${id}/students/${s.id}`} className="whitespace-nowrap text-xs font-semibold text-indigo-600 hover:underline">กรอกข้อมูล</Link>
                    {v && <ClearVisitButton studentId={s.id} />}
                    <form action={deleteStudent}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="classroom_id" value={id} />
                      <button className="whitespace-nowrap text-xs text-red-500 hover:underline">ลบ</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-4">
          <form action={addStudentsBulk} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-2 text-lg font-semibold text-slate-800">+ เพิ่มนักเรียน</h2>
            <p className="mb-3 text-xs text-slate-500">วางรายชื่อ บรรทัดละ 1 คน (ใส่คำนำหน้าได้ เช่น เด็กชาย/เด็กหญิง ระบบจะแยกเพศให้)</p>
            <input type="hidden" name="classroom_id" value={id} />
            <textarea
              name="names" rows={8}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={"เด็กชายนนทกร แสงศรี\nเด็กหญิงระพีพรรณ คำกลั่น"}
            />
            <button type="submit" className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              เพิ่มเข้าชั้นเรียน
            </button>
          </form>

          <form action={deleteClassroom} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <input type="hidden" name="id" value={id} />
            <button className="text-sm text-red-500 hover:underline">🗑 ลบชั้นเรียนนี้</button>
          </form>
        </div>
      </div>
    </div>
  );
}
