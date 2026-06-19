import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SetupForm from "@/components/SetupForm";

export default async function SetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("hv_profiles")
    .select("full_name, position, school_id")
    .eq("id", user.id)
    .maybeSingle();

  let school: { name: string; area: string | null; director_name: string | null } | null = null;
  if (profile?.school_id) {
    const { data } = await supabase
      .from("hv_schools")
      .select("name, area, director_name")
      .eq("id", profile.school_id)
      .maybeSingle();
    school = data;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">ตั้งค่าข้อมูลครูและโรงเรียน</h1>
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">ข้าม / กลับหน้าหลัก</Link>
      </div>

      <SetupForm
        initial={{
          full_name: profile?.full_name || "",
          position: profile?.position || "ครู",
          school_id: profile?.school_id ?? null,
          school_name: school?.name || "",
          school_area: school?.area || "",
          director_name: school?.director_name || "",
        }}
      />
    </div>
  );
}
