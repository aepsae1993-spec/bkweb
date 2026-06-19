import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildReportData, REPORT_PRINCIPLE, REPORT_OBJECTIVES, REPORT_CONCLUSION } from "@/lib/report";
import ReportActions from "@/components/ReportActions";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = await buildReportData(id);
  if (!r) notFound();

  // signed URLs สำหรับรูปภาพในภาคผนวก
  const supabase = await createClient();
  const allPaths = r.students.flatMap((s) => s.photos.map((p) => p.storage_path));
  const signed: Record<string, string> = {};
  if (allPaths.length) {
    const { data } = await supabase.storage.from("hv-photos").createSignedUrls(allPaths, 3600);
    for (const item of data || []) {
      if (item.signedUrl && item.path) signed[item.path] = item.signedUrl;
    }
  }

  const cls = `${r.classroom.grade_level}${r.classroom.room ? " ห้อง " + r.classroom.room : ""}`;
  const pageBox = "mx-auto mb-6 max-w-3xl rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200 print-page";
  const th = "border border-slate-300 px-2 py-1 text-sm font-semibold bg-slate-50";
  const td = "border border-slate-300 px-2 py-1 text-sm";

  return (
    <div>
      <div className="no-print mb-4">
        <Link href={`/classrooms/${id}`} className="text-sm text-indigo-600 hover:underline">← กลับชั้นเรียน</Link>
        <h1 className="text-2xl font-bold text-slate-900">รายงานการเยี่ยมบ้าน {cls}</h1>
      </div>

      <ReportActions classroomId={id} />

      {/* ===== 1. ปกแบบบันทึกผลการออกเยี่ยมบ้าน ===== */}
      <section className={pageBox}>
        <h2 className="mb-1 text-center text-xl font-bold">แบบบันทึกผลการออกเยี่ยมบ้านนักเรียน</h2>
        <p className="mb-1 text-center">{r.school.name}</p>
        <p className="mb-4 text-center">ระดับชั้น{cls} ภาคเรียนที่ {r.classroom.semester} ปีการศึกษา {r.classroom.academic_year}</p>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th} rowSpan={2}>เลขที่</th>
              <th className={th} rowSpan={2}>ชื่อ - สกุล</th>
              <th className={th} colSpan={2}>ผลการออกเยี่ยมบ้าน</th>
              <th className={th} rowSpan={2}>หมายเหตุ</th>
            </tr>
            <tr><th className={th}>ได้</th><th className={th}>ไม่ได้</th></tr>
          </thead>
          <tbody>
            {r.students.map((s) => (
              <tr key={s.id}>
                <td className={`${td} text-center`}>{s.number}</td>
                <td className={td}>{s.prefix || ""}{s.full_name}</td>
                <td className={`${td} text-center`}>{s.visited === true ? "✓" : ""}</td>
                <td className={`${td} text-center`}>{s.visited === false ? "✓" : ""}</td>
                <td className={td}>{s.note || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-sm">
          <p>นักเรียนทั้งหมด {r.totals.total} คน · ชาย {r.totals.male} คน · หญิง {r.totals.female} คน</p>
          <p>ได้รับการเยี่ยมบ้าน {r.totals.visited} คน คิดเป็นร้อยละ {r.totals.total ? Math.round((r.totals.visited / r.totals.total) * 10000) / 100 : 0}</p>
          <p>ไม่ได้รับการเยี่ยมบ้าน {r.totals.notVisited} คน</p>
        </div>
        <div className="mt-8 text-center text-sm">
          <p>ลงชื่อ …………………………………………</p>
          <p>({r.teacher.full_name})</p>
          <p>{r.teacher.position || "ครู"}ประจำชั้น</p>
        </div>
      </section>

      {/* ===== 2. รายงานผลเชิงพรรณนา ===== */}
      <section className={pageBox}>
        <h2 className="mb-3 text-center text-xl font-bold">รายงานผลการออกเยี่ยมบ้านนักเรียน</h2>
        <p className="mb-3 text-center">ภาคเรียนที่ {r.classroom.semester} ปีการศึกษา {r.classroom.academic_year}</p>

        <h3 className="mt-4 font-bold">หลักการและเหตุผล</h3>
        <p className="indent-8 text-justify leading-relaxed">{REPORT_PRINCIPLE}</p>

        <h3 className="mt-4 font-bold">วัตถุประสงค์</h3>
        <ol className="ml-6 list-decimal space-y-1 leading-relaxed">
          {REPORT_OBJECTIVES.map((o, i) => <li key={i}>{o}</li>)}
        </ol>

        <h3 className="mt-4 font-bold">เป้าหมาย</h3>
        <p className="indent-8 leading-relaxed">
          นักเรียนจำนวน {r.totals.total} คน ได้รับการเยี่ยมบ้านและได้รับการช่วยเหลือ ส่งเสริมตามลักษณะความสามารถของแต่ละบุคคล
          ผู้ปกครองและครูประจำชั้นมีความสัมพันธ์ที่ดีต่อกัน เข้าใจและให้ความร่วมมือในการดูแลช่วยเหลือนักเรียน
        </p>

        <h3 className="mt-4 font-bold">สรุปผล</h3>
        <p className="indent-8 text-justify leading-relaxed">{REPORT_CONCLUSION}</p>

        <div className="mt-8 text-center text-sm">
          <p>ลงชื่อ …………………………………………</p>
          <p>({r.teacher.full_name})</p>
          <p>{r.teacher.position || "ครู"}</p>
        </div>
      </section>

      {/* ===== 3. บันทึกรายบุคคล ===== */}
      <section className={pageBox}>
        <h2 className="mb-3 text-center text-xl font-bold">บันทึกการเยี่ยมบ้านนักเรียนเป็นรายบุคคล</h2>
        <p className="mb-4 text-center">{cls} · {r.school.name}</p>
        <ol className="ml-5 list-decimal space-y-3">
          {r.students.map((s) => (
            <li key={s.id}>
              <span className="font-semibold">{s.prefix || ""}{s.full_name}</span>
              <p className="text-justify leading-relaxed text-slate-700">{s.narrative || "— ยังไม่ได้บันทึกข้อมูล —"}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ===== 4. แบบสรุปสถิติ 17 หมวด ===== */}
      <section className={pageBox}>
        <h2 className="mb-1 text-center text-xl font-bold">แบบสรุปผลการเยี่ยมบ้านนักเรียน</h2>
        <p className="mb-3 text-center">{cls} ภาคเรียนที่ {r.classroom.semester} ปีการศึกษา {r.classroom.academic_year} · จำนวน {r.totals.total} คน (ชาย {r.totals.male} หญิง {r.totals.female})</p>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>รายการ</th>
              <th className={th}>ข้อมูล/รายละเอียดที่พบ</th>
              <th className={th}>รวม(คน)</th>
              <th className={th}>ร้อยละ</th>
            </tr>
          </thead>
          <tbody>
            {r.stats.map((sec) =>
              sec.options.map((opt, oi) => (
                <tr key={sec.no + opt.label}>
                  {oi === 0 && (
                    <td className={`${td} align-top font-medium`} rowSpan={sec.options.length}>
                      {sec.no}. {sec.label}
                    </td>
                  )}
                  <td className={td}>{opt.label}</td>
                  <td className={`${td} text-center`}>{opt.count}</td>
                  <td className={`${td} text-center`}>{opt.percent.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* ===== 5. ภาคผนวก: ภาพถ่าย ===== */}
      <section className={pageBox}>
        <h2 className="mb-4 text-center text-xl font-bold">ภาคผนวก — ภาพถ่ายบ้านนักเรียน</h2>
        {r.students.filter((s) => s.photos.length).length === 0 ? (
          <p className="text-center text-slate-400">ยังไม่มีภาพถ่าย</p>
        ) : (
          <div className="space-y-6">
            {r.students.filter((s) => s.photos.length).map((s) => (
              <div key={s.id}>
                <p className="mb-2 font-semibold">{s.prefix || ""}{s.full_name}</p>
                <div className="grid grid-cols-2 gap-3">
                  {s.photos.map((p, i) => (
                    <figure key={i} className="text-center">
                      {signed[p.storage_path] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={signed[p.storage_path]} alt={p.caption || ""} className="h-48 w-full rounded object-cover ring-1 ring-slate-200" />
                      ) : (
                        <div className="h-48 w-full rounded bg-slate-100" />
                      )}
                      <figcaption className="mt-1 text-xs text-slate-500">{p.caption}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
