import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addStudentsBulk, deleteStudent, updateStudent, deleteClassroom } from "@/lib/actions/classrooms";

const PREFIXES = ["เด็กชาย", "เด็กหญิง", "ด.ช.", "ด.ญ.", "นาย", "นางสาว", "นาง"];

export default async function ManageStudentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: classroom } = await supabase
    .from("hv_classrooms")
    .select("grade_level, room, academic_year, semester")
    .eq("id", id)
    .maybeSingle();
  if (!classroom) notFound();

  const { data: students } = await supabase
    .from("hv_students")
    .select("id, number, prefix, full_name, gender")
    .eq("classroom_id", id)
    .order("number", { ascending: true });

  const input =
    "rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div>
      <Link href={`/classrooms/${id}`} className="text-sm text-indigo-600 hover:underline">← กลับหน้ารายชื่อ</Link>
      <h1 className="mb-1 mt-1 text-2xl font-bold text-slate-900">
        จัดการนักเรียน {classroom.grade_level} {classroom.room ? `ห้อง ${classroom.room}` : ""}
      </h1>
      <p className="mb-6 text-sm text-slate-500">เพิ่ม / แก้ไขชื่อ-สกุล / เปลี่ยนเลขที่ / ลบ นักเรียน ({students?.length || 0} คน)</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* รายการแก้ไข */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <ul className="divide-y divide-slate-100">
            {(students || []).map((s) => {
              const prefixOptions = PREFIXES.includes(s.prefix || "")
                ? PREFIXES
                : [s.prefix || "", ...PREFIXES].filter(Boolean);
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-2 px-3 py-3">
                  <form action={updateStudent} className="flex flex-1 flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="classroom_id" value={id} />
                    <input name="number" type="number" defaultValue={s.number ?? ""} className={`${input} w-16`} placeholder="เลขที่" />
                    <select name="prefix" defaultValue={s.prefix || ""} className={`${input} w-24`}>
                      <option value="">— คำนำหน้า —</option>
                      {prefixOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input name="full_name" defaultValue={s.full_name} className={`${input} min-w-[140px] flex-1`} placeholder="ชื่อ - สกุล" />
                    <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">
                      บันทึก
                    </button>
                  </form>
                  <form action={deleteStudent}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="classroom_id" value={id} />
                    <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100">
                      ลบ
                    </button>
                  </form>
                </li>
              );
            })}
            {(students?.length || 0) === 0 && (
              <li className="px-4 py-8 text-center text-slate-400">ยังไม่มีนักเรียน เพิ่มจากกล่องด้านขวา</li>
            )}
          </ul>
        </div>

        {/* เพิ่มนักเรียน */}
        <form action={addStudentsBulk} className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-2 text-lg font-semibold text-slate-800">+ เพิ่มนักเรียน</h2>
          <p className="mb-3 text-xs text-slate-500">วางรายชื่อ บรรทัดละ 1 คน (ใส่คำนำหน้าได้ เช่น เด็กชาย/เด็กหญิง/ด.ช./ด.ญ.)</p>
          <input type="hidden" name="classroom_id" value={id} />
          <textarea name="names" rows={8} className={`${input} w-full`} placeholder={"เด็กชายสมชาย ใจดี\nเด็กหญิงสมหญิง ใจงาม"} />
          <button type="submit" className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            เพิ่มเข้าชั้นเรียน
          </button>
        </form>
      </div>

      <form action={deleteClassroom} className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <input type="hidden" name="id" value={id} />
        <button className="text-sm text-red-500 hover:underline">🗑 ลบชั้นเรียนนี้ทั้งหมด</button>
      </form>
    </div>
  );
}
