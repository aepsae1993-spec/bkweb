import { FORM_SECTIONS, OTHER_SUFFIX, type VisitData } from "@/lib/form-schema";
import type { ReportStudent } from "@/lib/report";

const TH_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const toThai = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "๐๑๒๓๔๕๖๗๘๙"[+d]);
function thaiDate(iso: string | null): string {
  if (!iso) return "....../....../......";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
}
function thaiDateNum(iso: string | null): string {
  if (!iso) return "วันที่ ......... เดือน ..................... พ.ศ. .........";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `วันที่ ${toThai(d.getDate())} เดือน ${TH_MONTHS[d.getMonth()]} พ.ศ. ${toThai(d.getFullYear() + 543)}`;
}
function gradeFull(grade: string): string {
  const m = grade.match(/(\d+)/);
  const n = m ? toThai(m[1]) : "";
  if (/ม/.test(grade)) return `มัธยมศึกษาปีที่ ${n}`;
  if (/อ/.test(grade)) return `อนุบาลปีที่ ${n}`;
  return `ประถมศึกษาปีที่ ${n}`;
}
const PHOTO_TYPES = [
  "บ้านที่อาศัยอยู่กับพ่อแม่ (เป็นเจ้าของ/เช่า)",
  "บ้านของญาติ/ผู้ปกครองที่ไม่ใช่ญาติ",
  "บ้านหรือที่พักประเภท วัด มูลนิธิ หอพัก โรงงาน อยู่กับนายจ้าง",
  "ภาพนักเรียนและป้ายชื่อโรงเรียนเนื่องจากถ่ายภาพบ้านไม่ได้ เพราะบ้านอยู่ต่างอำเภอ/ต่างจังหวัด/ต่างประเทศ หรือไม่ได้รับอนุญาตให้ถ่ายภาพ",
];
const CAPTIONS = ["รูปที่ ๑ ภาพถ่ายสภาพบ้านนักเรียน", "รูปที่ ๒ ภาพถ่ายภายในบ้านนักเรียน"];

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
    <>
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
    </div>
    <PhotoCertPage s={s} ctx={ctx} photoUrls={photoUrls} />
    </>
  );
}

// หน้า "บันทึกการเยี่ยมบ้าน" (ภาพถ่าย) — ขึ้นหน้าใหม่เสมอ
function PhotoCertPage({ s, ctx, photoUrls }: { s: ReportStudent; ctx: FormCtx; photoUrls: Record<string, string> }) {
  return (
    <div className="mx-auto mb-6 max-w-3xl rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200 print-page">
      <h2 className="border-b-2 border-slate-800 pb-1 text-center text-lg font-bold">บันทึกการเยี่ยมบ้าน</h2>
      <p className="mt-4 text-sm font-semibold">ภาพถ่ายบ้านนักเรียนที่ได้รับการเยี่ยมบ้าน</p>
      <p className="text-sm">ชื่อ – นามสกุลนักเรียน　{s.prefix || ""}{s.full_name}</p>
      <p className="text-sm">กรุณาระบุ ภาพถ่ายที่แนบมาคือ</p>
      <div className="ml-3 space-y-0.5">
        {PHOTO_TYPES.map((t, i) => <Box key={i} checked={i === 0} label={t} />)}
      </div>

      <div className="mt-3 space-y-2">
        {[0, 1].map((i) => {
          const p = s.photos[i];
          return (
            <figure key={i} className="text-center">
              <figcaption className="mb-1 text-sm">{CAPTIONS[i]}</figcaption>
              {p && photoUrls[p.storage_path] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrls[p.storage_path]} alt={CAPTIONS[i]} className="mx-auto max-h-44 rounded object-contain ring-1 ring-slate-200" />
              ) : (
                <div className="mx-auto flex h-36 w-1/2 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">(ยังไม่มีภาพถ่าย)</div>
              )}
            </figure>
          );
        })}
      </div>

      <div className="mt-6 rounded border border-slate-400 p-4 text-center text-sm">
        <p>ขอรับรองว่าข้อมูล และภาพถ่ายบ้านของนักเรียนเป็นความจริง</p>
        <p className="mt-4">ลงชื่อ...........................................................</p>
        <p>({ctx.teacher.full_name})</p>
        <p>{ctx.teacher.position || "ครู"}ประจำชั้น{gradeFull(ctx.classroom.grade_level)}</p>
        <p>{thaiDateNum(s.visit_date)}</p>
      </div>
    </div>
  );
}
