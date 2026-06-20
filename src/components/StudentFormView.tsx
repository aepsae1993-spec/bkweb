import { FORM_SECTIONS, OTHER_SUFFIX, type VisitData } from "@/lib/form-schema";
import type { ReportStudent } from "@/lib/report";

const TH_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
function thaiDate(iso: string | null): string {
  if (!iso) return "....../....../......";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
}

export interface FormCtx {
  classroom: { grade_level: string; room: string | null; academic_year: string; semester: string };
  school: { name: string; area: string | null; director_name: string | null };
  teacher: { full_name: string; position: string | null };
}

function Box({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-start gap-1.5 text-sm">
      <span className={checked ? "text-slate-900" : "text-slate-400"}>{checked ? "■" : "□"}</span>
      <span className={checked ? "font-medium text-slate-900" : "text-slate-600"}>{label}</span>
    </div>
  );
}

export default function StudentFormView({
  s, ctx, photoUrls,
}: {
  s: ReportStudent;
  ctx: FormCtx;
  photoUrls: Record<string, string>;
}) {
  const data: VisitData = s.data || {};
  const cls = `${ctx.classroom.grade_level}${ctx.classroom.room ? " ห้อง " + ctx.classroom.room : ""}`;

  return (
    <div className="mx-auto mb-6 max-w-3xl rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200 print-page">
      <h2 className="text-center text-lg font-bold">{s.number}. แบบบันทึกการเยี่ยมบ้านนักเรียน (รายบุคคล)</h2>
      <p className="mb-3 text-center text-sm">{ctx.school.name}</p>

      <div className="mb-3 text-sm">
        <p>ชื่อ – นามสกุล <b>{s.prefix || ""}{s.full_name}</b>　ชั้น {cls}　เลขที่ {s.number}</p>
        <p>เบอร์โทรผู้ปกครอง {s.phone || "-"}　วันที่เยี่ยม {thaiDate(s.visit_date)}　ผล: {s.visited === false ? "เยี่ยมไม่ได้" : "เยี่ยมได้"}</p>
      </div>

      <div className="space-y-3">
        {FORM_SECTIONS.map((f) => {
          const val = data[f.id];
          const other = (data[f.id + OTHER_SUFFIX] as string) || "";
          return (
            <div key={f.id}>
              <p className="text-sm font-semibold text-slate-800">{f.no}. {f.label}</p>
              <div className="ml-3 grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
                {f.options.map((opt) => {
                  const checked = f.type === "single" ? val === opt : Array.isArray(val) && val.includes(opt);
                  return <Box key={opt} checked={checked} label={opt} />;
                })}
                {f.allowOther && <Box checked={other.trim().length > 0} label={`อื่นๆ ${other.trim()}`} />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm">
        <p className="font-semibold">สรุปการเยี่ยมบ้าน (รายบุคคล)</p>
        <p className="text-justify text-slate-700">{s.narrative || "-"}</p>
        <p className="mt-2 font-semibold">ความต้องการ/ความคิดเห็นของผู้ปกครอง</p>
        <p className="text-slate-700">{s.parent_wish || "-"}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-center text-sm">
        <div>
          <p>ลงชื่อ .....................................</p>
          <p>({s.guardian_name || "....................."}) {s.guardian_relation || ""}</p>
          <p>ผู้ปกครอง</p>
        </div>
        <div>
          <p>ลงชื่อ .....................................</p>
          <p>({ctx.teacher.full_name})</p>
          <p>{ctx.teacher.position || "ครู"}ประจำชั้น</p>
        </div>
      </div>

      {s.photos.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-center text-sm font-semibold">ภาพถ่ายบ้านนักเรียน</p>
          <div className="grid grid-cols-2 gap-3">
            {s.photos.map((p, i) => (
              <figure key={i} className="text-center">
                {photoUrls[p.storage_path] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrls[p.storage_path]} alt={p.caption || ""} className="h-44 w-full rounded object-cover ring-1 ring-slate-200" />
                ) : (
                  <div className="h-44 w-full rounded bg-slate-100" />
                )}
                <figcaption className="mt-1 text-xs text-slate-500">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
