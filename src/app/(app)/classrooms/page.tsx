import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClassroom } from "@/lib/actions/classrooms";
import { sortClassrooms } from "@/lib/grade";

export default async function ClassroomsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hv_classrooms")
    .select("id, grade_level, room, academic_year, semester");
  const classrooms = sortClassrooms(data ?? []);

  const input =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
  const label = "mb-1 block text-sm font-medium text-slate-700";

  const thisYear = new Date().getFullYear() + 543; // พ.ศ.

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">ชั้นเรียน</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {(classrooms || []).length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center text-slate-500 ring-1 ring-slate-200">
              ยังไม่มีชั้นเรียน เพิ่มได้จากฟอร์มด้านขวา →
            </div>
          ) : (
            <div className="space-y-3">
              {(classrooms || []).map((c) => (
                <Link key={c.id} href={`/classrooms/${c.id}`} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-indigo-300">
                  <div>
                    <div className="font-semibold text-slate-900">{c.grade_level} {c.room ? `ห้อง ${c.room}` : ""}</div>
                    <div className="text-sm text-slate-500">ภาคเรียน {c.semester}/{c.academic_year}</div>
                  </div>
                  <span className="text-indigo-600">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <form action={createClassroom} className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">+ เพิ่มชั้นเรียน</h2>
          <div className="space-y-3">
            <div>
              <label className={label}>ระดับชั้น</label>
              <input name="grade_level" required className={input} placeholder="ป.4" />
            </div>
            <div>
              <label className={label}>ห้อง (ถ้ามี)</label>
              <input name="room" className={input} placeholder="1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>ปีการศึกษา</label>
                <input name="academic_year" required defaultValue={String(thisYear)} className={input} />
              </div>
              <div>
                <label className={label}>ภาคเรียน</label>
                <select name="semester" className={input} defaultValue="1">
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              สร้างชั้นเรียน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
