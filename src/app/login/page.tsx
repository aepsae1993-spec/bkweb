"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SCHOOL_LOGO_URL, LOGIN_EMAIL, TEACHERS } from "@/lib/branding";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [teacher, setTeacher] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teacher) {
      setError("กรุณาเลือกชื่อครู");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: LOGIN_EMAIL, password });
    if (error) {
      setError("เข้าสู่ระบบไม่สำเร็จ: รหัสผ่านไม่ถูกต้อง");
      setLoading(false);
      return;
    }
    // เก็บชื่อครูที่เลือกไว้ใน cookie ของเครื่องนี้ (แยกกันแต่ละคน ไม่ทับกัน)
    document.cookie = `hv_teacher=${encodeURIComponent(teacher)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.push(params.get("next") || "/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 text-center">
          <Image src={SCHOOL_LOGO_URL} alt="โลโก้โรงเรียน" width={80} height={80} className="mx-auto mb-3 object-contain" priority />
          <h1 className="text-xl font-bold text-slate-900">ระบบเยี่ยมบ้านนักเรียน</h1>
          <p className="mt-1 text-sm text-slate-500">เข้าสู่ระบบสำหรับครู</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">เลือกชื่อครู</label>
            <select
              required
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">— เลือกชื่อครู —</option>
              {TEACHERS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">รหัสผ่าน</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
