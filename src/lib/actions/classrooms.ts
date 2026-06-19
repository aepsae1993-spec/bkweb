"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createClassroom(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("hv_profiles")
    .select("school_id")
    .eq("id", user.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("hv_classrooms")
    .insert({
      teacher_id: user.id,
      school_id: profile?.school_id ?? null,
      grade_level: String(formData.get("grade_level") || "").trim(),
      room: String(formData.get("room") || "").trim() || null,
      academic_year: String(formData.get("academic_year") || "").trim(),
      semester: String(formData.get("semester") || "").trim(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/classrooms");
  redirect(`/classrooms/${data.id}`);
}

export async function deleteClassroom(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  await supabase.from("hv_classrooms").delete().eq("id", id);
  revalidatePath("/classrooms");
  redirect("/classrooms");
}

// เพิ่มนักเรียนทีละหลายคน (วางรายชื่อ บรรทัดละ 1 คน)
export async function addStudentsBulk(formData: FormData) {
  const { supabase } = await requireUser();
  const classroomId = String(formData.get("classroom_id"));
  const raw = String(formData.get("names") || "");
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  // หาเลขที่ล่าสุด
  const { data: existing } = await supabase
    .from("hv_students")
    .select("number")
    .eq("classroom_id", classroomId)
    .order("number", { ascending: false })
    .limit(1);
  let next = (existing?.[0]?.number ?? 0) + 1;

  const rows = lines.map((line) => {
    // เดาคำนำหน้า/เพศจากข้อความ
    let prefix: string | null = null;
    let gender: string | null = null;
    let name = line;
    const m = line.match(/^(เด็กชาย|เด็กหญิง|นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.)\s*(.*)$/);
    if (m) {
      prefix = m[1];
      name = m[2].trim() || line;
      gender = /ชาย|นาย|ช\./.test(m[1]) ? "M" : "F";
    }
    return {
      classroom_id: classroomId,
      number: next++,
      prefix,
      full_name: name,
      gender,
    };
  });

  if (rows.length) await supabase.from("hv_students").insert(rows);
  revalidatePath(`/classrooms/${classroomId}`);
}

export async function deleteStudent(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id"));
  const classroomId = String(formData.get("classroom_id"));
  await supabase.from("hv_students").delete().eq("id", id);
  revalidatePath(`/classrooms/${classroomId}`);
}
