import {
  Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, WidthType, BorderStyle, VerticalAlign, PageBreak,
} from "docx";
import { FORM_SECTIONS, OTHER_SUFFIX, type VisitData } from "@/lib/form-schema";
import type { ReportStudent } from "@/lib/report";

export const FONT = "TH SarabunPSK";
export const BODY = 32;   // 16pt
export const HEAD = 36;   // 18pt
const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
export const borders = { top: border, bottom: border, left: border, right: border };

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

export function P(
  text: string,
  opts: { bold?: boolean; align?: Align; size?: number; indent?: boolean; spacingAfter?: number; underlineRule?: boolean } = {}
) {
  return new Paragraph({
    alignment: opts.align,
    spacing: { after: opts.spacingAfter ?? 80 },
    indent: opts.indent ? { firstLine: 480 } : undefined,
    border: opts.underlineRule ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 4 } } : undefined,
    children: [new TextRun({ text, bold: opts.bold, font: FONT, size: opts.size ?? BODY })],
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
    children: [new Paragraph({ alignment: opts.align, children: [new TextRun({ text, bold: opts.bold, font: FONT, size: 28 })] })],
  });
}

const TH_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
function toThai(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => "๐๑๒๓๔๕๖๗๘๙"[+d]);
}
export function thaiDate(iso: string | null): string {
  if (!iso) return "....... / ....... / .......";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `วันที่ ${d.getDate()} เดือน ${TH_MONTHS[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
}
// แบบเลขไทย (ใช้ในหน้ารับรองภาพถ่าย)
function thaiDateNum(iso: string | null): string {
  if (!iso) return "วันที่ ......... เดือน ..................... พ.ศ. .........";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return `วันที่ ${toThai(d.getDate())} เดือน ${TH_MONTHS[d.getMonth()]} พ.ศ. ${toThai(d.getFullYear() + 543)}`;
}
// "ป.4" -> "ประถมศึกษาปีที่ ๔"
export function gradeFull(grade: string): string {
  const m = grade.match(/(\d+)/);
  const n = m ? toThai(m[1]) : "";
  if (/ม/.test(grade)) return `มัธยมศึกษาปีที่ ${n}`;
  if (/อ/.test(grade)) return `อนุบาลปีที่ ${n}`;
  return `ประถมศึกษาปีที่ ${n}`;
}

// ประเภทภาพถ่ายที่แนบ (ตามต้นฉบับ)
const PHOTO_TYPES = [
  "บ้านที่อาศัยอยู่กับพ่อแม่ (เป็นเจ้าของ/เช่า)",
  "บ้านของญาติ/ผู้ปกครองที่ไม่ใช่ญาติ",
  "บ้านหรือที่พักประเภท วัด มูลนิธิ หอพัก โรงงาน อยู่กับนายจ้าง",
  "ภาพนักเรียนและป้ายชื่อโรงเรียนเนื่องจากถ่ายภาพบ้านไม่ได้ เพราะบ้านอยู่ต่างอำเภอ/ต่างจังหวัด/ต่างประเทศ หรือไม่ได้รับอนุญาตให้ถ่ายภาพ",
];

function optionLine(checked: boolean, text: string, size = BODY) {
  return new Paragraph({
    spacing: { after: 30 },
    indent: { left: 360 },
    children: [new TextRun({ text: `${checked ? "■" : "□"}  ${text}`, font: FONT, size })],
  });
}

export interface FormContext {
  classroom: { grade_level: string; room: string | null; academic_year: string; semester: string };
  school: { name: string; area: string | null; director_name: string | null };
  teacher: { full_name: string; position: string | null };
}

export type PhotoImage = { caption: string | null; image: { buf: Buffer; type: "png" | "jpg" | "gif" } | null };

// กล่องรับรอง (ตาราง 1 ช่อง มีกรอบ)
function certBox(ctx: FormContext, s: ReportStudent): Table {
  const lines = [
    P("ขอรับรองว่าข้อมูล และภาพถ่ายบ้านของนักเรียนเป็นความจริง", { align: AlignmentType.CENTER, spacingAfter: 160 }),
    P("ลงชื่อ...........................................................", { align: AlignmentType.CENTER, spacingAfter: 40 }),
    P(`(${ctx.teacher.full_name})`, { align: AlignmentType.CENTER, spacingAfter: 0 }),
    P(`${ctx.teacher.position || "ครู"}ประจำชั้น${gradeFull(ctx.classroom.grade_level)}`, { align: AlignmentType.CENTER, spacingAfter: 0 }),
    P(thaiDateNum(s.visit_date), { align: AlignmentType.CENTER, spacingAfter: 0 }),
  ];
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders,
      width: { size: 9360, type: WidthType.DXA },
      margins: { top: 160, bottom: 160, left: 200, right: 200 },
      children: lines,
    })] })],
  });
}

// หน้า "บันทึกการเยี่ยมบ้าน" (ภาพถ่าย) — ขึ้นหน้าใหม่เสมอ
function photoCertPage(s: ReportStudent, ctx: FormContext, photoImages: PhotoImage[]): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(new Paragraph({ children: [new PageBreak()] }));
  out.push(P("บันทึกการเยี่ยมบ้าน", { bold: true, align: AlignmentType.CENTER, size: HEAD, underlineRule: true, spacingAfter: 160 }));
  out.push(P("ภาพถ่ายบ้านนักเรียนที่ได้รับการเยี่ยมบ้าน", { bold: true }));
  out.push(P(`ชื่อ – นามสกุลนักเรียน   ${s.prefix || ""}${s.full_name}`));
  out.push(P("กรุณาระบุ  ภาพถ่ายที่แนบมาคือ", { spacingAfter: 20 }));
  PHOTO_TYPES.forEach((t, i) => out.push(optionLine(i === 0, t)));

  const imgs = photoImages.filter((p) => p.image);
  const captions = ["รูปที่ ๑ ภาพถ่ายสภาพบ้านนักเรียน", "รูปที่ ๒ ภาพถ่ายภายในบ้านนักเรียน"];
  for (let i = 0; i < Math.max(2, imgs.length); i++) {
    out.push(P(captions[i] || `รูปที่ ${toThai(i + 1)}`, { align: AlignmentType.CENTER, spacingAfter: 40 }));
    const ph = imgs[i];
    if (ph?.image) {
      out.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new ImageRun({ type: ph.image.type, data: ph.image.buf, transformation: { width: 360, height: 270 }, altText: { title: captions[i] || "photo", description: "", name: "photo" } })],
      }));
    } else {
      out.push(P("(ยังไม่มีภาพถ่าย)", { align: AlignmentType.CENTER, spacingAfter: 120 }));
    }
  }
  out.push(P("", { spacingAfter: 80 }));
  out.push(certBox(ctx, s));
  return out;
}

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

  out.push(P(`${s.number ?? ""}. แบบบันทึกการเยี่ยมบ้านนักเรียน (รายบุคคล)`, { bold: true, align: AlignmentType.CENTER, size: HEAD }));
  out.push(P(ctx.school.name, { align: AlignmentType.CENTER }));

  out.push(P(`ชื่อ – นามสกุล  ${s.prefix || ""}${s.full_name}        ชั้น ${cls}   เลขที่ ${s.number ?? ""}`, { spacingAfter: 40 }));
  out.push(P(`เบอร์โทรผู้ปกครอง  ${s.phone || "-"}        ${thaiDate(s.visit_date)}        ผลการเยี่ยม: ${s.visited === false ? "เยี่ยมไม่ได้" : "เยี่ยมได้"}`, { spacingAfter: 120 }));

  for (const f of FORM_SECTIONS) {
    out.push(P(`${f.no}. ${f.label}`, { bold: true, spacingAfter: 20 }));
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

  out.push(P("สรุปการเยี่ยมบ้าน (รายบุคคล)", { bold: true }));
  out.push(P(s.narrative || "-", { indent: true, align: AlignmentType.JUSTIFIED }));
  out.push(P("ความต้องการ/ความคิดเห็นของผู้ปกครอง", { bold: true }));
  out.push(P(s.parent_wish || "-", { indent: true }));

  out.push(P("", { spacingAfter: 120 }));
  out.push(P(`ลงชื่อ ...........................................  ผู้ปกครอง`, { align: AlignmentType.CENTER }));
  out.push(P(`(${s.guardian_name || "....................................."})  ${s.guardian_relation || ""}`, { align: AlignmentType.CENTER }));

  // หน้าภาพถ่าย — ขึ้นหน้าใหม่เสมอ
  out.push(...photoCertPage(s, ctx, photoImages));
  return out;
}
