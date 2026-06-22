import { createClient } from "@/lib/supabase/server";
import { computeStatistics, type VisitData, type SectionStat } from "@/lib/form-schema";
import { getCurrentTeacher } from "@/lib/teacher";

export interface ReportStudent {
  id: string;
  number: number | null;
  prefix: string | null;
  full_name: string;
  gender: string | null;
  visited: boolean | null;
  note: string | null;
  narrative: string | null;
  phone: string | null;
  visit_date: string | null;
  parent_wish: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  data: VisitData;
  photos: { storage_path: string; caption: string | null }[];
}

export interface ReportData {
  classroom: { grade_level: string; room: string | null; academic_year: string; semester: string };
  school: { name: string; area: string | null; director_name: string | null };
  teacher: { full_name: string; position: string | null };
  students: ReportStudent[];
  stats: SectionStat[];
  totals: { total: number; male: number; female: number; visited: number; notVisited: number };
}

export async function buildReportData(classroomId: string): Promise<ReportData | null> {
  const supabase = await createClient();

  const { data: classroom } = await supabase
    .from("hv_classrooms")
    .select("grade_level, room, academic_year, semester, school_id, teacher_id")
    .eq("id", classroomId)
    .maybeSingle();
  if (!classroom) return null;

  const [{ data: school }, { data: teacher }, { data: students }, { data: visits }] = await Promise.all([
    classroom.school_id
      ? supabase.from("hv_schools").select("name, area, director_name").eq("id", classroom.school_id).maybeSingle()
      : Promise.resolve({ data: null }),
    classroom.teacher_id
      ? supabase.from("hv_profiles").select("full_name, position").eq("id", classroom.teacher_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("hv_students").select("id, number, prefix, full_name, gender").eq("classroom_id", classroomId).order("number"),
    supabase.from("hv_visits").select("id, student_id, visited, note, narrative, data, phone, visit_date, parent_wish, guardian_name, guardian_relation").eq("classroom_id", classroomId),
  ]);

  const visitByStudent = new Map((visits || []).map((v) => [v.student_id, v]));
  const visitIds = (visits || []).map((v) => v.id);

  const photosByVisit = new Map<string, { storage_path: string; caption: string | null }[]>();
  if (visitIds.length) {
    const { data: photos } = await supabase
      .from("hv_photos")
      .select("visit_id, storage_path, caption, sort_order")
      .in("visit_id", visitIds)
      .order("sort_order");
    for (const p of photos || []) {
      const arr = photosByVisit.get(p.visit_id) || [];
      arr.push({ storage_path: p.storage_path, caption: p.caption });
      photosByVisit.set(p.visit_id, arr);
    }
  }

  const reportStudents: ReportStudent[] = (students || []).map((s) => {
    const v = visitByStudent.get(s.id);
    return {
      id: s.id,
      number: s.number,
      prefix: s.prefix,
      full_name: s.full_name,
      gender: s.gender,
      visited: v ? v.visited : null,
      note: v?.note ?? null,
      narrative: v?.narrative ?? null,
      phone: v?.phone ?? null,
      visit_date: v?.visit_date ?? null,
      parent_wish: v?.parent_wish ?? null,
      guardian_name: v?.guardian_name ?? null,
      guardian_relation: v?.guardian_relation ?? null,
      data: (v?.data as VisitData) ?? {},
      photos: v ? photosByVisit.get(v.id) || [] : [],
    };
  });

  const male = reportStudents.filter((s) => s.gender === "M").length;
  const female = reportStudents.filter((s) => s.gender === "F").length;
  const visited = reportStudents.filter((s) => s.visited === true).length;

  const stats = computeStatistics(
    (visits || []).map((v) => ({ data: (v.data as VisitData) || {} }))
  );

  // ชื่อครูผู้ทำรายงาน = ครูที่ล็อกอินอยู่ตอนนี้ (จาก cookie) ถ้ามี
  const currentTeacher = await getCurrentTeacher();
  const teacherName = currentTeacher || teacher?.full_name || "";

  return {
    classroom: {
      grade_level: classroom.grade_level,
      room: classroom.room,
      academic_year: classroom.academic_year,
      semester: classroom.semester,
    },
    school: school || { name: "", area: null, director_name: null },
    teacher: { full_name: teacherName, position: teacher?.position || "ครู" },
    students: reportStudents,
    stats,
    totals: {
      total: reportStudents.length,
      male,
      female,
      visited,
      notVisited: reportStudents.length - visited,
    },
  };
}

// ===== ข้อความรายงานเชิงพรรณนา (boilerplate) =====
export const REPORT_OBJECTIVES = [
  "เพื่อสร้างความสัมพันธ์ที่ดีระหว่างบ้านกับโรงเรียน ผู้ปกครองกับครูประจำชั้น",
  "เพื่อให้ผู้ปกครองได้ทราบถึงพฤติกรรมของบุตรหลานของตนเองในขณะที่อยู่โรงเรียน",
  "เพื่อให้ครูประจำชั้นได้ทราบถึงพฤติกรรมอันพึงและไม่พึงประสงค์ของนักเรียนในขณะที่อยู่บ้าน",
  "เพื่อให้ครูประจำชั้นได้เห็นสภาพชีวิตความเป็นอยู่ที่แท้จริงของนักเรียนและผู้ปกครอง",
  "เพื่อนำข้อมูลที่ได้จากการเยี่ยมบ้านนักเรียนมาคัดกรอง ช่วยเหลือนักเรียนที่มีปัญหาทางด้านต่างๆ",
  "เพื่อนำข้อมูลที่ได้จากการเยี่ยมบ้านนักเรียนมาส่งเสริมความสามารถของนักเรียนตามศักยภาพ",
  "เพื่อนำข้อมูลที่ได้จากการเยี่ยมบ้านนักเรียน นำมาคัดกรองนักเรียนยากจน",
];

export const REPORT_PRINCIPLE =
  "ในการพัฒนานักเรียนให้มีความสมบูรณ์พร้อมทั้งร่างกาย จิตใจ สติปัญญา ความรู้ คุณธรรม จริยธรรม และการดำรงตนให้มีความสุขได้ในสังคมปัจจุบัน ต้องมีการร่วมมือระหว่างโรงเรียน ครูและผู้ปกครองนักเรียน โดยทางโรงเรียนต้องมีการจัดระบบการดูแลช่วยเหลือนักเรียนในด้านต่างๆ ขึ้นเพื่อช่วยเหลือส่งเสริมให้นักเรียนเป็นบุคคลที่มีความรู้ มีคุณธรรม จริยธรรม และสามารถดำรงชีวิตให้มีความสุขในสังคมได้ กิจกรรมการเยี่ยมบ้านนักเรียนเป็นอีกกิจกรรมหนึ่งในระบบดูแลช่วยเหลือนักเรียนที่มีความสำคัญเป็นอย่างมาก เป็นการสร้างความสัมพันธ์ที่ดีระหว่างบ้านกับโรงเรียน";

export const REPORT_CONCLUSION =
  "ครูประจำชั้นจะได้ทราบข้อมูลที่แท้จริงของนักเรียน เช่น สภาพครอบครัว ที่อยู่อาศัย การเลี้ยงดูนักเรียนของผู้ปกครอง พฤติกรรมของนักเรียน ข้อดีและข้อเสียของนักเรียน สร้างความร่วมมือที่ดีในการช่วยเหลือป้องกัน แก้ไข และพัฒนานักเรียนที่อยู่ในความปกครองให้เป็นคนดี มีคุณธรรม จริยธรรมของสังคมต่อไป";
