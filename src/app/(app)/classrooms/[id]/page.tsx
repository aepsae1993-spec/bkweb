import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addStudentsBulk, deleteStudent, deleteClassroom } from "@/lib/actions/classrooms";
import CheckInButton from "@/components/CheckInButton";

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
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">เลขที่</th>
                <th className="px-4 py-3 font-medium">ชื่อ - นามสกุล</th>
                <th className="px-4 py-3 font-medium">การเยี่ยม</th>
                <th className="px-4 py-3 font-medium">ข้อมูล</th>
                <th className="px-4 py-3 text-right font-medium">เช็คอิน</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {total === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">ยังไม่มีนักเรียน เพิ่มจากกล่องด้านขวา</td></tr>
              )}
              {(students || []).map((s) => {
                const v = visitMap.get(s.id);
                const checkedIn = !!v?.checked_in_at;
                const recorded = hasData(v);
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{s.number}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <Link href={`/classrooms/${id}/students/${s.id}`} className="hover:text-indigo-600 hover:underline">
                        {s.prefix || ""}{s.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {checkedIn
                        ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">เยี่ยมแล้ว</span>
                        : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">ยังไม่เยี่ยม</span>}
                    </td>
                    <td className="px-4 py-3">
                      {recorded
                        ? <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">บันทึกข้อมูลแล้ว</span>
                        : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">ยังไม่ได้บันทึก</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CheckInButton studentId={s.id} classroomId={id} checkedIn={checkedIn} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/classrooms/${id}/students/${s.id}`} className="text-xs font-semibold text-indigo-600 hover:underline">กรอกข้อมูล</Link>
                        <form action={deleteStudent}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="classroom_id" value={id} />
                          <button className="text-xs text-red-500 hover:underline">ลบ</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
