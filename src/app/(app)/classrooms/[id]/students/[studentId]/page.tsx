import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VisitForm from "@/components/VisitForm";
import type { VisitData } from "@/lib/form-schema";

export default async function StudentVisitPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id, studentId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("hv_students")
    .select("id, number, prefix, full_name, gender, classroom_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) notFound();

  const { data: visit } = await supabase
    .from("hv_visits")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  const { data: photos } = await supabase
    .from("hv_photos")
    .select("id, storage_path, caption, sort_order")
    .eq("visit_id", visit?.id || "00000000-0000-0000-0000-000000000000")
    .order("sort_order");

  return (
    <div>
      <Link href={`/classrooms/${id}`} className="text-sm text-indigo-600 hover:underline">← กลับชั้นเรียน</Link>
      <h1 className="mb-1 mt-1 text-2xl font-bold text-slate-900">
        แบบเยี่ยมบ้าน: {student.prefix || ""}{student.full_name}
      </h1>
      <p className="mb-6 text-sm text-slate-500">เลขที่ {student.number}</p>

      <VisitForm
        classroomId={id}
        studentId={studentId}
        initial={{
          id: visit?.id ?? null,
          visited: visit?.visited ?? true,
          visit_date: visit?.visit_date ?? null,
          phone: visit?.phone ?? null,
          note: visit?.note ?? null,
          narrative: visit?.narrative ?? null,
          parent_wish: visit?.parent_wish ?? null,
          guardian_name: visit?.guardian_name ?? null,
          guardian_relation: visit?.guardian_relation ?? null,
          data: (visit?.data as VisitData) ?? {},
        }}
        photos={photos ?? []}
      />
    </div>
  );
}
