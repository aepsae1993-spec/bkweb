"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roadDistance } from "@/lib/osrm";

export async function computeClassroomDistances(classroomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // พิกัดโรงเรียน
  const { data: classroom } = await supabase
    .from("hv_classrooms")
    .select("school_id")
    .eq("id", classroomId)
    .maybeSingle();
  const { data: school } = classroom?.school_id
    ? await supabase.from("hv_schools").select("latitude, longitude").eq("id", classroom.school_id).maybeSingle()
    : { data: null };

  if (!school?.latitude || !school?.longitude) {
    return { ok: false as const, error: "ยังไม่ได้ตั้งตำแหน่งโรงเรียน — ไปที่หน้าแผนที่เพื่อปักหมุดโรงเรียนก่อน" };
  }

  // นักเรียนที่เช็คอินแล้ว (มีพิกัด)
  const { data: visits } = await supabase
    .from("hv_visits")
    .select("id, latitude, longitude")
    .eq("classroom_id", classroomId)
    .not("latitude", "is", null);

  const from = { lat: school.latitude, lng: school.longitude };
  await Promise.all(
    (visits || []).map(async (v) => {
      if (v.latitude == null || v.longitude == null) return;
      const r = await roadDistance(from, { lat: v.latitude, lng: v.longitude });
      await supabase
        .from("hv_visits")
        .update({ road_distance_m: r.distanceM, road_duration_s: r.durationS })
        .eq("id", v.id);
    })
  );

  revalidatePath("/distance");
  return { ok: true as const, count: visits?.length ?? 0 };
}
