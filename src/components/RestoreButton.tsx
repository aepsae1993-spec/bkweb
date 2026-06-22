"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Kind = "visit" | "student" | "classroom";

export default function RestoreButton({ kind, id }: { kind: Kind; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function restore() {
    setBusy(true);
    const supabase = createClient();
    const fn = kind === "visit" ? "hv_restore_visit" : kind === "student" ? "hv_restore_student" : "hv_restore_classroom";
    const arg = kind === "visit" ? { vid: id } : kind === "student" ? { sid: id } : { cid: id };
    const { error } = await supabase.rpc(fn, arg);
    setBusy(false);
    if (error) alert("กู้คืนไม่สำเร็จ: " + error.message);
    else router.refresh();
  }

  return (
    <button
      onClick={restore}
      disabled={busy}
      className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
    >
      {busy ? "กำลังกู้…" : "↩ กู้คืน"}
    </button>
  );
}
