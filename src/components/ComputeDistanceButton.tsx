"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { computeClassroomDistances } from "@/lib/actions/distance";

export default function ComputeDistanceButton({ classroomId }: { classroomId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMsg(null);
    const res = await computeClassroomDistances(classroomId);
    setBusy(false);
    if (res.ok) {
      setMsg(`คำนวณแล้ว ${res.count} คน`);
      router.refresh();
    } else {
      setMsg(res.error);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={run}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {busy ? "กำลังคำนวณระยะทาง…" : "📏 คำนวณ/อัปเดตระยะทาง"}
      </button>
      {msg && <span className="text-sm text-slate-600">{msg}</span>}
    </div>
  );
}
