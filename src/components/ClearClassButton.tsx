"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADMIN_PASSWORD = "admin1234";

export default function ClearClassButton({ classroomId }: { classroomId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function clearAll() {
    const pwd = window.prompt("ใส่รหัสผ่านผู้ดูแลเพื่อล้างข้อมูลการเยี่ยม + เช็คอิน ของนักเรียน 'ทั้งห้อง'");
    if (pwd == null) return;
    if (pwd !== ADMIN_PASSWORD) {
      alert("รหัสผ่านไม่ถูกต้อง");
      return;
    }
    if (!confirm("ยืนยันล้างข้อมูลการเยี่ยม + เช็คอิน + รูปภาพ ของนักเรียนทั้งห้อง? (ไม่ลบรายชื่อนักเรียน)")) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("hv_visits")
      .update({ deleted_at: new Date().toISOString() })
      .eq("classroom_id", classroomId)
      .is("deleted_at", null);
    setBusy(false);
    if (error) alert("ล้างข้อมูลไม่สำเร็จ: " + error.message);
    else router.refresh();
  }

  return (
    <button
      onClick={clearAll}
      disabled={busy}
      className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-60"
    >
      {busy ? "กำลังล้าง…" : "🧹 ล้างข้อมูลทั้งห้อง"}
    </button>
  );
}
