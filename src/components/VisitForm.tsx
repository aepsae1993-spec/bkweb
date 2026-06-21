"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FORM_SECTIONS, OTHER_SUFFIX, type VisitData } from "@/lib/form-schema";
import { saveVisit } from "@/lib/actions/visits";
import PhotoUploader, { type PhotoRow } from "@/components/PhotoUploader";

interface Initial {
  id: string | null;
  visited: boolean;
  visit_date: string | null;
  phone: string | null;
  note: string | null;
  narrative: string | null;
  parent_wish: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  data: VisitData;
  latitude: number | null;
  longitude: number | null;
}

export default function VisitForm({
  classroomId,
  studentId,
  initial,
  photos,
}: {
  classroomId: string;
  studentId: string;
  initial: Initial;
  photos: PhotoRow[];
}) {
  const router = useRouter();
  const [visited, setVisited] = useState(initial.visited);
  const [visitDate, setVisitDate] = useState(initial.visit_date || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [narrative, setNarrative] = useState(initial.narrative || "");
  const [parentWish, setParentWish] = useState(initial.parent_wish || "");
  const [guardianName, setGuardianName] = useState(initial.guardian_name || "");
  const [guardianRelation, setGuardianRelation] = useState(initial.guardian_relation || "");
  const [note, setNote] = useState(initial.note || "");
  const [data, setData] = useState<VisitData>(initial.data || {});
  const [lat, setLat] = useState<number | null>(initial.latitude);
  const [lng, setLng] = useState<number | null>(initial.longitude);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [visitId, setVisitId] = useState<string | null>(initial.id);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function checkIn() {
    if (!navigator.geolocation) {
      setGeoMsg("อุปกรณ์ไม่รองรับ GPS");
      return;
    }
    setGeoBusy(true);
    setGeoMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setGeoBusy(false);
        setGeoMsg("ได้ตำแหน่งแล้ว — อย่าลืมกดบันทึกข้อมูล");
      },
      (err) => {
        setGeoBusy(false);
        setGeoMsg("ขอตำแหน่งไม่สำเร็จ: " + err.message + " (ต้องอนุญาตให้เข้าถึงตำแหน่ง)");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function setSingle(fieldId: string, value: string) {
    setData((d) => ({ ...d, [fieldId]: value }));
  }
  function toggleMulti(fieldId: string, value: string) {
    setData((d) => {
      const cur = Array.isArray(d[fieldId]) ? (d[fieldId] as string[]) : [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...d, [fieldId]: next };
    });
  }
  function setOther(fieldId: string, value: string) {
    setData((d) => ({ ...d, [fieldId + OTHER_SUFFIX]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await saveVisit({
      student_id: studentId,
      classroom_id: classroomId,
      visited,
      visit_date: visitDate || null,
      phone: phone || null,
      note: note || null,
      narrative: narrative || null,
      parent_wish: parentWish || null,
      guardian_name: guardianName || null,
      guardian_relation: guardianRelation || null,
      data,
      latitude: lat,
      longitude: lng,
    });
    setSaving(false);
    if (res.ok) {
      setVisitId(res.visitId);
      setMsg("บันทึกข้อมูลเรียบร้อย ✓");
      router.refresh();
    } else {
      setMsg("เกิดข้อผิดพลาด: " + res.error);
    }
  }

  const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200";
  const input =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
  const label = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <div className="space-y-6 pb-24">
      {/* ข้อมูลทั่วไป */}
      <section className={card}>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">ข้อมูลการเยี่ยม</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>สถานะการเยี่ยม</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setVisited(true)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ring-1 ${visited ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : "bg-white text-slate-600 ring-slate-300"}`}>
                เยี่ยมได้
              </button>
              <button type="button" onClick={() => setVisited(false)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ring-1 ${!visited ? "bg-amber-50 text-amber-700 ring-amber-300" : "bg-white text-slate-600 ring-slate-300"}`}>
                เยี่ยมไม่ได้
              </button>
            </div>
          </div>
          <div>
            <label className={label}>วันที่เยี่ยม</label>
            <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>เบอร์โทรผู้ปกครอง</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} placeholder="08x-xxxxxxx" />
          </div>
        </div>
      </section>

      {/* 17 หมวด */}
      {FORM_SECTIONS.map((f) => {
        const val = data[f.id];
        const otherVal = (data[f.id + OTHER_SUFFIX] as string) || "";
        return (
          <section key={f.id} className={card}>
            <h3 className="mb-3 font-semibold text-slate-800">
              <span className="mr-2 text-indigo-600">{f.no}.</span>{f.label}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {f.options.map((opt) => {
                const checked = f.type === "single" ? val === opt : Array.isArray(val) && val.includes(opt);
                return (
                  <label key={opt} className={`flex cursor-pointer items-start gap-2 rounded-lg px-3 py-2 text-sm ring-1 ${checked ? "bg-indigo-50 text-indigo-800 ring-indigo-300" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"}`}>
                    <input
                      type={f.type === "single" ? "radio" : "checkbox"}
                      name={f.id}
                      checked={checked}
                      onChange={() => (f.type === "single" ? setSingle(f.id, opt) : toggleMulti(f.id, opt))}
                      className="mt-0.5"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
            {f.allowOther && (
              <div className="mt-2">
                <input value={otherVal} onChange={(e) => setOther(f.id, e.target.value)} className={input} placeholder="อื่นๆ ระบุ…" />
              </div>
            )}
          </section>
        );
      })}

      {/* บันทึก/บรรยาย */}
      <section className={card}>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">บันทึกเพิ่มเติม</h2>
        <div className="space-y-4">
          <div>
            <label className={label}>สรุปการเยี่ยมบ้าน (บรรยายรายบุคคล)</label>
            <textarea value={narrative} onChange={(e) => setNarrative(e.target.value)} rows={4} className={input}
              placeholder="ครอบครัวอาศัยอยู่ด้วยกัน … นักเรียนมีอุปนิสัย … การเอาใจใส่ด้านการเรียน …" />
          </div>
          <div>
            <label className={label}>ความต้องการ/ความคิดเห็นของผู้ปกครอง</label>
            <textarea value={parentWish} onChange={(e) => setParentWish(e.target.value)} rows={2} className={input}
              placeholder="อยากให้ตั้งใจเรียนและเป็นเด็กดี" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>ชื่อผู้ปกครอง (ผู้ให้ข้อมูล)</label>
              <input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className={input} placeholder="นายสมปอง แสงศรี" />
            </div>
            <div>
              <label className={label}>ความเกี่ยวข้อง</label>
              <input value={guardianRelation} onChange={(e) => setGuardianRelation(e.target.value)} className={input} placeholder="บิดา / มารดา / ผู้ปกครอง" />
            </div>
          </div>
          <div>
            <label className={label}>หมายเหตุ</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={input} />
          </div>
        </div>
      </section>

      {/* เช็คอินพิกัดบ้าน (GPS) */}
      <section className={card}>
        <h2 className="mb-2 text-lg font-semibold text-slate-800">📍 เช็คอินตำแหน่งบ้าน (GPS)</h2>
        <p className="mb-3 text-sm text-slate-500">กดเมื่ออยู่ที่บ้านนักเรียน เพื่อบันทึกพิกัดสำหรับดูบนแผนที่ภายหลัง</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={checkIn} disabled={geoBusy}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60">
            {geoBusy ? "กำลังหาตำแหน่ง…" : "📍 เช็คอินตำแหน่งนี้"}
          </button>
          {lat != null && lng != null ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </span>
              <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer"
                className="text-indigo-600 hover:underline">ดูบนแผนที่</a>
              <button type="button" onClick={() => { setLat(null); setLng(null); }}
                className="text-red-500 hover:underline">ล้าง</button>
            </div>
          ) : (
            <span className="text-sm text-slate-400">ยังไม่ได้เช็คอิน</span>
          )}
        </div>
        {geoMsg && <p className="mt-2 text-sm text-slate-600">{geoMsg}</p>}
      </section>

      {/* ภาพถ่ายบ้าน */}
      <section className={card}>
        <h2 className="mb-2 text-lg font-semibold text-slate-800">📷 ภาพถ่ายบ้านนักเรียน</h2>
        {visitId ? (
          <PhotoUploader visitId={visitId} initialPhotos={photos} />
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
            กดบันทึกข้อมูลด้านล่างก่อน จึงจะอัปโหลดรูปภาพได้
          </p>
        )}
      </section>

      {/* แถบบันทึก */}
      <div className="no-print fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-slate-500">{msg}</span>
          <button onClick={handleSave} disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {saving ? "กำลังบันทึก…" : "💾 บันทึกข้อมูล"}
          </button>
        </div>
      </div>
    </div>
  );
}
