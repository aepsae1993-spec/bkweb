"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CheckInButton({
  studentId,
  classroomId,
  checkedIn,
}: {
  studentId: string;
  classroomId: string;
  checkedIn: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function checkIn() {
    if (!navigator.geolocation) {
      setErr("อุปกรณ์ไม่รองรับ GPS");
      return;
    }
    setBusy(true);
    setErr(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const supabase = createClient();
        const { error } = await supabase.from("hv_visits").upsert(
          {
            student_id: studentId,
            classroom_id: classroomId,
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            checked_in_at: new Date().toISOString(),
            visited: true,
          },
          { onConflict: "student_id" }
        );
        setBusy(false);
        if (error) setErr(error.message);
        else router.refresh();
      },
      () => {
        setBusy(false);
        setErr("ขอตำแหน่งไม่สำเร็จ (ต้องอนุญาตตำแหน่ง)");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  return (
    <div className="inline-flex flex-col items-end">
      <button
        onClick={checkIn}
        disabled={busy}
        title="เช็คอินพิกัดบ้าน ณ ตำแหน่งปัจจุบัน"
        className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 disabled:opacity-60 ${
          checkedIn
            ? "bg-emerald-50 text-emerald-700 ring-emerald-300 hover:bg-emerald-100"
            : "bg-rose-600 text-white ring-rose-600 hover:bg-rose-700"
        }`}
      >
        {busy ? "กำลังหา…" : checkedIn ? "📍 เช็คอินใหม่" : "📍 เช็คอิน"}
      </button>
      {err && <span className="mt-0.5 max-w-[120px] text-right text-[10px] text-red-500">{err}</span>}
    </div>
  );
}
