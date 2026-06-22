"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { VisitData } from "@/lib/form-schema";

export interface VisitPayload {
  student_id: string;
  classroom_id: string;
  visited: boolean;
  visit_date: string | null;
  phone: string | null;
  note: string | null;
  narrative: string | null;
  parent_wish: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  data: VisitData;
}

export async function saveVisit(payload: VisitPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("hv_visits")
    .upsert(
      {
        student_id: payload.student_id,
        classroom_id: payload.classroom_id,
        visited: payload.visited,
        visit_date: payload.visit_date,
        phone: payload.phone,
        note: payload.note,
        narrative: payload.narrative,
        parent_wish: payload.parent_wish,
        guardian_name: payload.guardian_name,
        guardian_relation: payload.guardian_relation,
        data: payload.data,
        deleted_at: null,
        created_by: user.id,
      },
      { onConflict: "student_id" }
    )
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/classrooms/${payload.classroom_id}`);
  return { ok: true as const, visitId: data.id };
}
