"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveSetup(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = String(formData.get("full_name") || "").trim();
  const position = String(formData.get("position") || "ครู").trim();
  const schoolName = String(formData.get("school_name") || "").trim();
  const schoolArea = String(formData.get("school_area") || "").trim();
  const directorName = String(formData.get("director_name") || "").trim();

  // มีโรงเรียนอยู่แล้วหรือยัง
  const { data: profile } = await supabase
    .from("hv_profiles")
    .select("school_id")
    .eq("id", user.id)
    .maybeSingle();

  let schoolId = profile?.school_id ?? null;

  if (schoolName) {
    if (schoolId) {
      await supabase
        .from("hv_schools")
        .update({ name: schoolName, area: schoolArea, director_name: directorName })
        .eq("id", schoolId);
    } else {
      const { data: school } = await supabase
        .from("hv_schools")
        .insert({ name: schoolName, area: schoolArea, director_name: directorName })
        .select("id")
        .single();
      schoolId = school?.id ?? null;
    }
  }

  await supabase
    .from("hv_profiles")
    .update({ full_name: fullName, position, school_id: schoolId })
    .eq("id", user.id);

  revalidatePath("/setup");
  redirect("/dashboard");
}
