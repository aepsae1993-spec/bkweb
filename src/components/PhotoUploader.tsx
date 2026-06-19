"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface PhotoRow {
  id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
}

const CAPTIONS = ["รูปที่ ๑ ภาพถ่ายสภาพบ้านนักเรียน", "รูปที่ ๒ ภาพถ่ายภายในบ้านนักเรียน"];

export default function PhotoUploader({
  visitId,
  initialPhotos,
}: {
  visitId: string;
  initialPhotos: PhotoRow[];
}) {
  const supabase = createClient();
  const [photos, setPhotos] = useState<PhotoRow[]>(initialPhotos);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const entries: Record<string, string> = {};
      for (const p of photos) {
        const { data } = await supabase.storage.from("hv-photos").createSignedUrl(p.storage_path, 3600);
        if (data?.signedUrl) entries[p.id] = data.signedUrl;
      }
      if (active) setUrls(entries);
    })();
    return () => { active = false; };
  }, [photos, supabase]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files.length) return;
    setBusy(true);
    const added: PhotoRow[] = [];
    let order = photos.length;
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${visitId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("hv-photos").upload(path, file, { upsert: false });
      if (upErr) { alert("อัปโหลดไม่สำเร็จ: " + upErr.message); continue; }
      const caption = CAPTIONS[order] || `รูปที่ ${order + 1}`;
      const { data, error } = await supabase
        .from("hv_photos")
        .insert({ visit_id: visitId, storage_path: path, caption, sort_order: order })
        .select("id, storage_path, caption, sort_order")
        .single();
      if (!error && data) added.push(data);
      order++;
    }
    setPhotos((p) => [...p, ...added]);
    setBusy(false);
    e.target.value = "";
  }

  async function remove(p: PhotoRow) {
    if (!confirm("ลบรูปนี้?")) return;
    await supabase.storage.from("hv-photos").remove([p.storage_path]);
    await supabase.from("hv_photos").delete().eq("id", p.id);
    setPhotos((cur) => cur.filter((x) => x.id !== p.id));
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-lg ring-1 ring-slate-200">
            {urls[p.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls[p.id]} alt={p.caption || ""} className="h-32 w-full object-cover" />
            ) : (
              <div className="flex h-32 w-full items-center justify-center bg-slate-100 text-xs text-slate-400">กำลังโหลด…</div>
            )}
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="truncate text-xs text-slate-500">{p.caption}</span>
              <button onClick={() => remove(p)} className="text-xs text-red-500 hover:underline">ลบ</button>
            </div>
          </div>
        ))}
      </div>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
        <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={busy} />
        {busy ? "กำลังอัปโหลด…" : "+ เพิ่มรูปภาพ"}
      </label>
    </div>
  );
}
