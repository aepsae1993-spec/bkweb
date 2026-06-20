import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, Table, TableRow, AlignmentType, WidthType, PageBreak } from "docx";
import { createClient } from "@/lib/supabase/server";
import { buildReportData, REPORT_PRINCIPLE, REPORT_OBJECTIVES, REPORT_CONCLUSION } from "@/lib/report";
import { P, cell, FONT, studentFormChildren, type PhotoImage } from "@/lib/docx-helpers";

export const runtime = "nodejs";

async function fetchImage(supabase: Awaited<ReturnType<typeof createClient>>, path: string) {
  const { data } = await supabase.storage.from("hv-photos").download(path);
  if (!data) return null;
  const buf = Buffer.from(await data.arrayBuffer());
  const ext = (path.split(".").pop() || "jpg").toLowerCase();
  const type = ext === "png" ? "png" : ext === "gif" ? "gif" : "jpg";
  return { buf, type: type as "png" | "gif" | "jpg" };
}

export async function GET(req: NextRequest) {
  const classroomId = req.nextUrl.searchParams.get("classroomId");
  if (!classroomId) return NextResponse.json({ error: "missing classroomId" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const r = await buildReportData(classroomId);
  if (!r) return NextResponse.json({ error: "not found" }, { status: 404 });

  const cls = `${r.classroom.grade_level}${r.classroom.room ? " ห้อง " + r.classroom.room : ""}`;
  const visitedPct = r.totals.total ? Math.round((r.totals.visited / r.totals.total) * 10000) / 100 : 0;
  const children: (Paragraph | Table)[] = [];

  // ===== 1. ปกแบบบันทึก =====
  children.push(P("แบบบันทึกผลการออกเยี่ยมบ้านนักเรียน", { bold: true, align: AlignmentType.CENTER, size: 36 }));
  children.push(P(r.school.name, { align: AlignmentType.CENTER }));
  children.push(P(`ระดับชั้น${cls} ภาคเรียนที่ ${r.classroom.semester} ปีการศึกษา ${r.classroom.academic_year}`, { align: AlignmentType.CENTER }));

  const coverRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        cell("เลขที่", { bold: true, align: AlignmentType.CENTER, fill: "EEEEEE", width: 900 }),
        cell("ชื่อ - สกุล", { bold: true, fill: "EEEEEE", width: 5000 }),
        cell("ได้", { bold: true, align: AlignmentType.CENTER, fill: "EEEEEE", width: 1000 }),
        cell("ไม่ได้", { bold: true, align: AlignmentType.CENTER, fill: "EEEEEE", width: 1000 }),
        cell("หมายเหตุ", { bold: true, align: AlignmentType.CENTER, fill: "EEEEEE", width: 1460 }),
      ],
    }),
    ...r.students.map((s) =>
      new TableRow({
        children: [
          cell(String(s.number ?? ""), { align: AlignmentType.CENTER }),
          cell(`${s.prefix || ""}${s.full_name}`),
          cell(s.visited === true ? "✓" : "", { align: AlignmentType.CENTER }),
          cell(s.visited === false ? "✓" : "", { align: AlignmentType.CENTER }),
          cell(s.note || ""),
        ],
      })
    ),
  ];
  children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [900, 5000, 1000, 1000, 1460], rows: coverRows }));
  children.push(P(""));
  children.push(P(`นักเรียนทั้งหมด ${r.totals.total} คน  ชาย ${r.totals.male} คน  หญิง ${r.totals.female} คน`));
  children.push(P(`ได้รับการเยี่ยมบ้าน ${r.totals.visited} คน คิดเป็นร้อยละ ${visitedPct}`));
  children.push(P(`ไม่ได้รับการเยี่ยมบ้าน ${r.totals.notVisited} คน`));
  children.push(P(""));
  children.push(P("ลงชื่อ …………………………………………", { align: AlignmentType.CENTER }));
  children.push(P(`(${r.teacher.full_name})`, { align: AlignmentType.CENTER }));
  children.push(P(`${r.teacher.position || "ครู"}ประจำชั้น`, { align: AlignmentType.CENTER }));

  // ===== 2. รายงานเชิงพรรณนา =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(P("รายงานผลการออกเยี่ยมบ้านนักเรียน", { bold: true, align: AlignmentType.CENTER, size: 36 }));
  children.push(P(`ภาคเรียนที่ ${r.classroom.semester} ปีการศึกษา ${r.classroom.academic_year}`, { align: AlignmentType.CENTER }));
  children.push(P("หลักการและเหตุผล", { bold: true }));
  children.push(P(REPORT_PRINCIPLE, { indent: true, align: AlignmentType.JUSTIFIED }));
  children.push(P("วัตถุประสงค์", { bold: true }));
  REPORT_OBJECTIVES.forEach((o, i) => children.push(P(`${i + 1}. ${o}`)));
  children.push(P("เป้าหมาย", { bold: true }));
  children.push(P(`นักเรียนจำนวน ${r.totals.total} คน ได้รับการเยี่ยมบ้านและได้รับการช่วยเหลือ ส่งเสริมตามลักษณะความสามารถของแต่ละบุคคล ผู้ปกครองและครูประจำชั้นมีความสัมพันธ์ที่ดีต่อกัน เข้าใจและให้ความร่วมมือในการดูแลช่วยเหลือนักเรียน`, { indent: true }));
  children.push(P("สรุปผล", { bold: true }));
  children.push(P(REPORT_CONCLUSION, { indent: true, align: AlignmentType.JUSTIFIED }));

  // ===== 3. บันทึกรายบุคคล =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(P("บันทึกการเยี่ยมบ้านนักเรียนเป็นรายบุคคล", { bold: true, align: AlignmentType.CENTER, size: 36 }));
  children.push(P(`${cls} · ${r.school.name}`, { align: AlignmentType.CENTER }));
  r.students.forEach((s, i) => {
    children.push(P(`${i + 1}. ${s.prefix || ""}${s.full_name}`, { bold: true }));
    children.push(P(s.narrative || "— ยังไม่ได้บันทึกข้อมูล —", { indent: true, align: AlignmentType.JUSTIFIED }));
  });

  // ===== 4. สถิติ 17 หมวด =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(P("แบบสรุปผลการเยี่ยมบ้านนักเรียน", { bold: true, align: AlignmentType.CENTER, size: 36 }));
  children.push(P(`${cls} ภาคเรียนที่ ${r.classroom.semester} ปีการศึกษา ${r.classroom.academic_year} · จำนวน ${r.totals.total} คน`, { align: AlignmentType.CENTER }));
  const statRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        cell("รายการ", { bold: true, align: AlignmentType.CENTER, fill: "EEEEEE", width: 3800 }),
        cell("ข้อมูล/รายละเอียดที่พบ", { bold: true, align: AlignmentType.CENTER, fill: "EEEEEE", width: 3760 }),
        cell("รวม(คน)", { bold: true, align: AlignmentType.CENTER, fill: "EEEEEE", width: 900 }),
        cell("ร้อยละ", { bold: true, align: AlignmentType.CENTER, fill: "EEEEEE", width: 900 }),
      ],
    }),
  ];
  for (const sec of r.stats) {
    sec.options.forEach((opt, oi) => {
      statRows.push(new TableRow({
        children: [
          ...(oi === 0 ? [cell(`${sec.no}. ${sec.label}`, { rowSpan: sec.options.length })] : []),
          cell(opt.label),
          cell(String(opt.count), { align: AlignmentType.CENTER }),
          cell(opt.percent.toFixed(2), { align: AlignmentType.CENTER }),
        ],
      }));
    });
  }
  children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [3800, 3760, 900, 900], rows: statRows }));

  // ===== 5. ภาคผนวก: แบบบันทึกการเยี่ยมบ้านรายบุคคล (1..N) =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(P("ภาคผนวก", { bold: true, align: AlignmentType.CENTER, size: 36 }));
  children.push(P("แบบบันทึกการเยี่ยมบ้านนักเรียนเป็นรายบุคคล", { align: AlignmentType.CENTER, size: 30 }));
  const ctx = { classroom: r.classroom, school: r.school, teacher: r.teacher };
  for (const s of r.students) {
    const photoImages: PhotoImage[] = [];
    for (const ph of s.photos) {
      photoImages.push({ caption: ph.caption, image: await fetchImage(supabase, ph.storage_path) });
    }
    children.push(...studentFormChildren(s, ctx, photoImages, { pageBreakBefore: true }));
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: 32 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `report-${r.classroom.grade_level}-${r.classroom.semester}-${r.classroom.academic_year}.docx`;
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
