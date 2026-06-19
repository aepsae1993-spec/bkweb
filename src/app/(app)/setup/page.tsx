import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { saveSetup } from "@/lib/actions/setup";

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

  const input =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
  const label = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">ตั้งค่าข้อมูลครูและโรงเรียน</h1>
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">ข้าม / กลับหน้าหลัก</Link>
      </div>

      <form action={saveSetup} className="space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">ข้อมูลครู</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>ชื่อ - นามสกุล</label>
              <input name="full_name" required defaultValue={profile?.full_name || ""} className={input} placeholder="นายประวีณ เส็งเรียบ" />
            </div>
            <div>
              <label className={label}>ตำแหน่ง</label>
              <input name="position" defaultValue={profile?.position || "ครู"} className={input} placeholder="ครู" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">ข้อมูลโรงเรียน</h2>
          <div className="space-y-4">
            <div>
              <label className={label}>ชื่อโรงเรียน</label>
              <input name="school_name" defaultValue={school?.name || ""} className={input} placeholder="โรงเรียนวัดบางขุด (อุ่นพิทยาคาร)" />
            </div>
            <div>
              <label className={label}>สังกัด / สำนักงานเขตพื้นที่</label>
              <input name="school_area" defaultValue={school?.area || ""} className={input} placeholder="สพป.สมุทรสาคร" />
            </div>
            <div>
              <label className={label}>ชื่อผู้อำนวยการ</label>
              <input name="director_name" defaultValue={school?.director_name || ""} className={input} placeholder="นายณรงค์ เนตรลา" />
            </div>
          </div>
        </section>

        <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
          บันทึกข้อมูล
        </button>
      </form>
    </div>
  );
}
