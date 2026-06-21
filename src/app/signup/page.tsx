"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SCHOOL_LOGO_URL } from "@/lib/branding";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setError("สมัครไม่สำเร็จ: " + error.message);
      setLoading(false);
      return;
    }
    if (!data.session) {
      // เปิดการยืนยันอีเมลไว้ — ต้องยืนยันก่อนเข้าใช้งาน
      setError("สมัครสำเร็จ! กรุณายืนยันอีเมลจากกล่องจดหมายก่อนเข้าสู่ระบบ (หรือให้ผู้ดูแลปิด Email confirmation ใน Supabase)");
      setLoading(false);
      return;
    }
    // โปรไฟล์ถูกสร้างอัตโนมัติด้วย trigger; ไปตั้งค่าครั้งแรก
    router.push("/setup");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 text-center">
          <Image src={SCHOOL_LOGO_URL} alt="โลโก้โรงเรียน" width={72} height={72} className="mx-auto mb-3 object-contain" priority />
          <h1 className="text-xl font-bold text-slate-900">สมัครใช้งาน</h1>
          <p className="mt-1 text-sm text-slate-500">สำหรับครูประจำชั้น</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อ - นามสกุล</label>
            <input
              required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="เช่น นายสมชาย ใจดี"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">อีเมล</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">รหัสผ่าน (อย่างน้อย 6 ตัว)</label>
            <input
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "กำลังสมัคร…" : "สมัครใช้งาน"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}
