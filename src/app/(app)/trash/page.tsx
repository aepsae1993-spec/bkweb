import { createClient } from "@/lib/supabase/server";
import RestoreButton from "@/components/RestoreButton";
import { thaiLongDate } from "@/lib/date";

export const dynamic = "force-dynamic";

interface TrashVisit { id: string; grade_level: string; room: string | null; prefix: string | null; full_name: string; number: number | null; deleted_at: string; has_form: boolean; has_gps: boolean; }
interface TrashStudent { id: string; grade_level: string; room: string | null; prefix: string | null; full_name: string; number: number | null; deleted_at: string; }
interface TrashClass { id: string; grade_level: string; room: string | null; academic_year: string; semester: string; deleted_at: string; }
interface Trash { visits: TrashVisit[]; students: TrashStudent[]; classrooms: TrashClass[]; }

function delDate(s: string) {
  return thaiLongDate(s.slice(0, 10));
}

export default async function TrashPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("hv_trash");
  const trash = (data as unknown as Trash) ?? { visits: [], students: [], classrooms: [] };
  const empty = trash.visits.length === 0 && trash.students.length === 0 && trash.classrooms.length === 0;

  const card = "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200";
  const row = "flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-0";

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">🗑️ ถังขยะ</h1>
      <p className="mb-6 text-sm text-slate-500">ข้อมูลที่ลบจะมาอยู่ที่นี่ กดกู้คืนได้</p>

      {empty ? (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-400 ring-1 ring-slate-200">ถังขยะว่าง</div>
      ) : (
        <div className="space-y-6">
          {trash.classrooms.length > 0 && (
            <section>
              <h2 className="mb-2 font-semibold text-slate-800">ชั้นเรียน ({trash.classrooms.length})</h2>
              <div className={card}>
                {trash.classrooms.map((c) => (
                  <div key={c.id} className={row}>
                    <div>
                      <span className="font-medium text-slate-800">{c.grade_level}{c.room ? ` ห้อง ${c.room}` : ""}</span>
                      <span className="ml-2 text-slate-400">ภาคเรียน {c.semester}/{c.academic_year} · ลบเมื่อ {delDate(c.deleted_at)}</span>
                    </div>
                    <RestoreButton kind="classroom" id={c.id} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {trash.students.length > 0 && (
            <section>
              <h2 className="mb-2 font-semibold text-slate-800">นักเรียน ({trash.students.length})</h2>
              <div className={card}>
                {trash.students.map((s) => (
                  <div key={s.id} className={row}>
                    <div>
                      <span className="font-medium text-slate-800">{s.prefix || ""}{s.full_name}</span>
                      <span className="ml-2 text-slate-400">{s.grade_level} เลขที่ {s.number ?? "-"} · ลบเมื่อ {delDate(s.deleted_at)}</span>
                    </div>
                    <RestoreButton kind="student" id={s.id} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {trash.visits.length > 0 && (
            <section>
              <h2 className="mb-2 font-semibold text-slate-800">ข้อมูลการเยี่ยม/เช็คอิน ({trash.visits.length})</h2>
              <div className={card}>
                {trash.visits.map((v) => (
                  <div key={v.id} className={row}>
                    <div>
                      <span className="font-medium text-slate-800">{v.prefix || ""}{v.full_name}</span>
                      <span className="ml-2 text-slate-400">
                        {v.grade_level} เลขที่ {v.number ?? "-"}
                        {v.has_gps ? " · มีพิกัด" : ""}{v.has_form ? " · มีข้อมูลฟอร์ม" : ""} · ลบเมื่อ {delDate(v.deleted_at)}
                      </span>
                    </div>
                    <RestoreButton kind="visit" id={v.id} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
