"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADMIN_PASSWORD = "admin1234";

export default function ClearVisitButton({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function clear() {
    const pwd = window.prompt("ใส่รหัสผ่านผู้ดูแลเพื่อล้างข้อมูลที่กรอก + เช็คอินของนักเรียนคนนี้");
    if (pwd == null) return;
    if (pwd !== ADMIN_PASSWORD) {
      alert("รหัสผ่านไม่ถูกต้อง");
      return;
    }
    if (!confirm("ยืนยันล้างข้อมูลการเยี่ยม + เช็คอิน + รูปภาพ ของนักเรียนคนนี้?")) return;
    setBusy(true);
    const supabase = createClient();
    // ลบ visit (รวมข้อมูลฟอร์ม + พิกัดเช็คอิน + รูปภาพ ผ่าน cascade)
    const { error } = await supabase.from("hv_visits").delete().eq("student_id", studentId);
    setBusy(false);
    if (error) alert("ล้างข้อมูลไม่สำเร็จ: " + error.message);
    else router.refresh();
  }

  return (
    <button
      onClick={clear}
      disabled={busy}
      title="ล้างข้อมูลที่กรอก + เช็คอิน (สำหรับทดสอบ)"
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-60"
    >
      {busy ? "กำลังล้าง…" : "🧹 ล้างข้อมูล"}
    </button>
  );
}
