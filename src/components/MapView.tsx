"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type * as LType from "leaflet";
import "leaflet/dist/leaflet.css";
import { gradeOrder } from "@/lib/grade";
import { createClient } from "@/lib/supabase/client";

export interface MapPoint {
  lat: number;
  lng: number;
  grade: string;
  name: string;
  number: number | null;
  visited: boolean;
  date: string | null;
}

export interface SchoolLoc {
  id: string;
  lat: number | null;
  lng: number | null;
}

const PALETTE = ["#2563EB", "#16A34A", "#F97316", "#DC2626", "#9333EA", "#EAB308", "#06B6D4", "#EC4899"];
const GRADE_COLORS: Record<string, string> = {
  "อ.2": "#2563EB", "อ.3": "#16A34A", "ป.1": "#F97316", "ป.2": "#DC2626",
  "ป.3": "#9333EA", "ป.4": "#EAB308", "ป.5": "#06B6D4", "ป.6": "#EC4899",
};

export default function MapView({ points, school }: { points: MapPoint[]; school: SchoolLoc | null }) {
  const router = useRouter();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);
  const layerRef = useRef<LType.LayerGroup | null>(null);
  const schoolMarkerRef = useRef<LType.Marker | null>(null);
  const [ready, setReady] = useState(0);

  const grades = useMemo(
    () => Array.from(new Set(points.map((p) => p.grade))).sort((a, b) => gradeOrder(a) - gradeOrder(b)),
    [points]
  );
  const colorOf = useMemo(() => {
    const m: Record<string, string> = {};
    grades.forEach((g, i) => (m[g] = GRADE_COLORS[g] ?? PALETTE[i % PALETTE.length]));
    return m;
  }, [grades]);
  const [active, setActive] = useState<Set<string>>(new Set());
  useEffect(() => setActive(new Set(grades)), [grades]);

  // ตั้งตำแหน่งโรงเรียน
  const [setMode, setSetMode] = useState(false);
  const setModeRef = useRef(false);
  useEffect(() => { setModeRef.current = setMode; }, [setMode]);
  const [schoolPos, setSchoolPos] = useState<{ lat: number; lng: number } | null>(
    school?.lat != null && school?.lng != null ? { lat: school.lat, lng: school.lng } : null
  );
  const [saving, setSaving] = useState(false);

  // init map ครั้งเดียว
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(mapEl.current).setView([13.55, 100.27], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap", maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      map.on("click", (e: LType.LeafletMouseEvent) => {
        if (setModeRef.current) {
          setSchoolPos({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) });
        }
      });
      mapRef.current = map;
      setReady((v) => v + 1);
    })();
    return () => { cancelled = true; };
  }, []);

  // หมุดบ้านนักเรียน
  useEffect(() => {
    const L = LRef.current, map = mapRef.current, layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();
    const shown = points.filter((p) => active.has(p.grade));
    const latlngs: [number, number][] = [];
    for (const p of shown) {
      const m = L.circleMarker([p.lat, p.lng], {
        radius: 8, color: "#fff", weight: 2, fillColor: colorOf[p.grade], fillOpacity: 0.9,
      });
      m.bindPopup(
        `<div style="font-family:sans-serif;font-size:13px;line-height:1.5">
          <b>${p.grade} เลขที่ ${p.number ?? "-"}</b><br/>${p.name}<br/>
          <span style="color:#16a34a">${p.visited ? "เยี่ยมแล้ว ✓" : "ยังไม่เยี่ยม"}</span>
          ${p.date ? "<br/>วันที่ " + p.date : ""}
          <br/><a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block;margin-top:6px;padding:4px 10px;background:#2563eb;color:#fff;border-radius:8px;font-weight:600;text-decoration:none">🧭 นำทางไปบ้านนี้</a>
        </div>`
      );
      m.addTo(layer);
      latlngs.push([p.lat, p.lng]);
    }
    if (latlngs.length && !setMode) map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 16 });
  }, [points, active, colorOf, ready, setMode]);

  // หมุดโรงเรียน
  useEffect(() => {
    const L = LRef.current, map = mapRef.current;
    if (!L || !map) return;
    if (!schoolPos) {
      schoolMarkerRef.current?.remove();
      schoolMarkerRef.current = null;
      return;
    }
    const icon = L.divIcon({
      className: "",
      html: `<div style="font-size:30px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">🏫</div>`,
      iconSize: [30, 30], iconAnchor: [15, 28],
    });
    if (!schoolMarkerRef.current) {
      const mk = L.marker([schoolPos.lat, schoolPos.lng], { icon, draggable: setMode, zIndexOffset: 1000 })
        .addTo(map).bindPopup("📍 โรงเรียน (จุดเริ่มวัดระยะทาง)");
      mk.on("dragend", () => {
        const ll = mk.getLatLng();
        setSchoolPos({ lat: +ll.lat.toFixed(6), lng: +ll.lng.toFixed(6) });
      });
      schoolMarkerRef.current = mk;
    } else {
      schoolMarkerRef.current.setLatLng([schoolPos.lat, schoolPos.lng]);
      const dragging = schoolMarkerRef.current.dragging;
      if (dragging) {
        if (setMode) dragging.enable();
        else dragging.disable();
      }
    }
  }, [schoolPos, setMode, ready]);

  function toggle(g: string) {
    setActive((cur) => {
      const next = new Set(cur);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });
  }

  async function saveSchool() {
    if (!school?.id || !schoolPos) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("hv_schools")
      .update({ latitude: schoolPos.lat, longitude: schoolPos.lng })
      .eq("id", school.id);
    setSaving(false);
    if (error) alert("บันทึกไม่สำเร็จ: " + error.message);
    else { setSetMode(false); router.refresh(); }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {grades.map((g) => (
          <button key={g} onClick={() => toggle(g)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 transition ${
              active.has(g) ? "bg-white ring-slate-300" : "bg-slate-100 text-slate-400 ring-transparent"
            }`}>
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: colorOf[g] }} />
            {g}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSetMode((m) => !m)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ${
            setMode ? "bg-rose-50 text-rose-700 ring-rose-300" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50"
          }`}
        >
          {setMode ? "✖ ยกเลิก" : "🏫 ตั้งตำแหน่งโรงเรียน"}
        </button>
        {setMode && <span className="text-sm text-slate-600">คลิกบนแผนที่เพื่อวางหมุดโรงเรียน (ลากปรับได้)</span>}
        {setMode && schoolPos && (
          <button onClick={saveSchool} disabled={saving}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
            {saving ? "กำลังบันทึก…" : "💾 บันทึกตำแหน่งโรงเรียน"}
          </button>
        )}
        {!setMode && !schoolPos && <span className="text-sm text-amber-600">ยังไม่ได้ตั้งตำแหน่งโรงเรียน</span>}
      </div>

      <div ref={mapEl} className="h-[70vh] w-full rounded-2xl ring-1 ring-slate-200" />
    </div>
  );
}
