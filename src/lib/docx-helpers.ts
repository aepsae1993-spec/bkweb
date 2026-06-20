import {
  Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, WidthType, BorderStyle, VerticalAlign, PageBreak,
} from "docx";
import { FORM_SECTIONS, OTHER_SUFFIX, type VisitData } from "@/lib/form-schema";
import type { ReportStudent } from "@/lib/report";

export const FONT = "TH Sarabun New";
const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
export const borders = { top: border, bottom: border, left: border, right: border };

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

export function P(
  text: string,
  opts: { bold?: boolean; align?: Align; size?: number; indent?: boolean; spacingAfter?: number } = {}
) {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.spacingAfter ?? 80 },
    indent: opts.indent ? { firstLine: 480 } : undefined,
    children: [new TextRun({ text, bold: opts.bold, font: FONT, size: opts.size ?? 30 })],
  });
}

export function cell(
  text: string,
  opts: { bold?: boolean; width?: number; align?: Align; fill?: string; rowSpan?: number } = {}
) {
  return new TableCell({
    borders,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    rowSpan: opts.rowSpan,
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.fill ? { fill: opts.fill, type: "clear", color: "auto" } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ alignment: opts.align, children: [new TextRun({ text, bold: opts.bold, font: FONT, size: 26 })] })],
  });
}

const TH_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
export function thaiDate(iso: string | null): string {
  if (!iso) return "....... / ....... / .......";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `วันที่ ${d.getDate()} เดือน ${TH_MONTHS[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
}

// บรรทัดตัวเลือกแบบติ๊ก (■ เลือก / □ ไม่เลือก)
function optionLine(checked: boolean, text: string) {
  return new Paragraph({
    spacing: { after: 20 },
    indent: { left: 360 },
    children: [new TextRun({ text: `${checked ? "■" : "□"}  ${text}`, font: FONT, size: 26 })],
  });
}

export interface FormContext {
  classroom: { grade_level: string; room: string | null; academic_year: string; semester: string };
  school: { name: string; area: string | null; director_name: string | null };
  teacher: { full_name: string; position: string | null };
}

export type PhotoImage = { caption: string | null; image: { buf: Buffer; type: "png" | "jpg" | "gif" } | null };

// สร้างเนื้อหา "แบบบันทึกการเยี่ยมบ้านรายบุคคล" ของนักเรียน 1 คน
export function studentFormChildren(
  s: ReportStudent,
  ctx: FormContext,
  photoImages: PhotoImage[],
  opts: { pageBreakBefore?: boolean } = {}
): (Paragraph | Table)[] {
  const data: VisitData = s.data || {};
  const cls = `${ctx.classroom.grade_level}${ctx.classroom.room ? " ห้อง " + ctx.classroom.room : ""}`;
  const out: (Paragraph | Table)[] = [];

  if (opts.pageBreakBefore) out.push(new Paragraph({ children: [new PageBreak()] }));

  out.push(P(`${s.number ?? ""}. แบบบันทึกการเยี่ยมบ้านนักเรียน (รายบุคคล)`, { bold: true, align: AlignmentType.CENTER, size: 32 }));
  out.push(P(ctx.school.name, { align: AlignmentType.CENTER, size: 28 }));

  // ข้อมูลนักเรียน
  out.push(P(`ชื่อ – นามสกุล  ${s.prefix || ""}${s.full_name}        ชั้น ${cls}   เลขที่ ${s.number ?? ""}`, { spacingAfter: 40 }));
  out.push(P(`เบอร์โทรผู้ปกครอง  ${s.phone || "-"}        ${thaiDate(s.visit_date)}        ผลการเยี่ยม: ${s.visited === false ? "เยี่ยมไม่ได้" : "เยี่ยมได้"}`, { spacingAfter: 120 }));

  // 17 หมวด แบบติ๊ก
  for (const f of FORM_SECTIONS) {
    out.push(P(`${f.no}. ${f.label}`, { bold: true, size: 28, spacingAfter: 20 }));
    const val = data[f.id];
    for (const optText of f.options) {
      const checked = f.type === "single" ? val === optText : Array.isArray(val) && val.includes(optText);
      out.push(optionLine(checked, optText));
    }
    if (f.allowOther) {
      const other = (data[f.id + OTHER_SUFFIX] as string) || "";
      out.push(optionLine(other.trim().length > 0, `อื่นๆ ${other.trim()}`));
    }
  }

  // บรรยาย / ความต้องการผู้ปกครอง
  out.push(P("สรุปการเยี่ยมบ้าน (รายบุคคล)", { bold: true, size: 28 }));
  out.push(P(s.narrative || "-", { indent: true, align: AlignmentType.JUSTIFIED }));
  out.push(P("ความต้องการ/ความคิดเห็นของผู้ปกครอง", { bold: true, size: 28 }));
  out.push(P(s.parent_wish || "-", { indent: true }));

  // ลายเซ็น
  out.push(P("", { spacingAfter: 120 }));
  out.push(P(`ลงชื่อ ...........................................  ผู้ปกครอง`, { align: AlignmentType.CENTER }));
  out.push(P(`(${s.guardian_name || "....................................."})  ${s.guardian_relation || ""}`, { align: AlignmentType.CENTER, spacingAfter: 120 }));
  out.push(P(`ลงชื่อ ...........................................  ครูผู้เยี่ยม`, { align: AlignmentType.CENTER }));
  out.push(P(`(${ctx.teacher.full_name})`, { align: AlignmentType.CENTER }));
  out.push(P(`${ctx.teacher.position || "ครู"}ประจำชั้น${cls}`, { align: AlignmentType.CENTER }));

  // รูปภาพบ้าน
  const imgs = photoImages.filter((p) => p.image);
  if (imgs.length) {
    out.push(P("ภาพถ่ายบ้านนักเรียน", { bold: true, align: AlignmentType.CENTER, size: 28, spacingAfter: 80 }));
    for (const ph of imgs) {
      out.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ type: ph.image!.type, data: ph.image!.buf, transformation: { width: 300, height: 225 }, altText: { title: ph.caption || "photo", description: ph.caption || "", name: "photo" } })],
      }));
      out.push(P(ph.caption || "", { align: AlignmentType.CENTER, size: 26 }));
    }
  }

  return out;
}
