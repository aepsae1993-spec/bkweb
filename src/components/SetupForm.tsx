"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Initial {
  full_name: string;
  position: string;
  school_id: string | null;
  school_name: string;
  school_area: string;
  director_name: string;
}

export default function SetupForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.full_name);
  const [position, setPosition] = useState(initial.position);
  const [schoolName, setSchoolName] = useState(initial.school_name);
  const [schoolArea, setSchoolArea] = useState(initial.school_area);
  const [directorName, setDirectorName] = useState(initial.director_name);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      let schoolId = initial.school_id;
      if (schoolName.trim()) {
        if (schoolId) {
          const { error } = await supabase
            .from("hv_schools")
            .update({ name: schoolName.trim(), area: schoolArea.trim(), director_name: directorName.trim() })
            .eq("id", schoolId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("hv_schools")
            .insert({ name: schoolName.trim(), area: schoolArea.trim(), director_name: directorName.trim() })
            .select("id")
            .single();
          if (error) throw error;
          schoolId = data.id;
        }
      }

      const { error: pErr } = await supabase
        .from("hv_profiles")
        .update({ full_name: fullName.trim(), position: position.trim() || "ครู", school_id: schoolId })
        .eq("id", user.id);
      if (pErr) throw pErr;

      setMsg({ ok: true, text: "บันทึกข้อมูลเรียบร้อย ✓ กำลังไปหน้าหลัก…" });
      router.refresh();
      setTimeout(() => router.push("/dashboard"), 800);
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : String(err);
      setMsg({ ok: false, text: "บันทึกไม่สำเร็จ: " + m });
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
  const label = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">ข้อมูลครู</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>ชื่อ - นามสกุล</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} placeholder="เช่น นายสมชาย ใจดี" />
          </div>
          <div>
            <label className={label}>ตำแหน่ง</label>
            <input value={position} onChange={(e) => setPosition(e.target.value)} className={input} placeholder="ครู" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">ข้อมูลโรงเรียน</h2>
        <div className="space-y-4">
          <div>
            <label className={label}>ชื่อโรงเรียน</label>
            <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className={input} placeholder="โรงเรียนวัดบางขุด (อุ่นพิทยาคาร)" />
          </div>
          <div>
            <label className={label}>สังกัด / สำนักงานเขตพื้นที่</label>
            <input value={schoolArea} onChange={(e) => setSchoolArea(e.target.value)} className={input} placeholder="สพป.สมุทรสาคร" />
          </div>
          <div>
            <label className={label}>ชื่อผู้อำนวยการ</label>
            <input value={directorName} onChange={(e) => setDirectorName(e.target.value)} className={input} placeholder="นายณรงค์ เนตรลา" />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {saving ? "กำลังบันทึก…" : "บันทึกข้อมูล"}
        </button>
        {msg && (
          <span className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</span>
        )}
      </div>
    </form>
  );
}
