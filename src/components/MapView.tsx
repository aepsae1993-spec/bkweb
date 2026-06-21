"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as LType from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  lat: number;
  lng: number;
  grade: string;
  name: string;
  number: number | null;
  visited: boolean;
  date: string | null;
}

const PALETTE = ["#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

// สีประจำแต่ละชั้น (ป.3 = เหลือง)
const GRADE_COLORS: Record<string, string> = {
  "อ.2": "#db2777",
  "อ.3": "#65a30d",
  "ป.1": "#2563eb",
  "ป.2": "#16a34a",
  "ป.3": "#eab308",
  "ป.4": "#e11d48",
  "ป.5": "#7c3aed",
  "ป.6": "#0891b2",
};

export default function MapView({ points }: { points: MapPoint[] }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const layerRef = useRef<LType.LayerGroup | null>(null);

  const grades = useMemo(() => Array.from(new Set(points.map((p) => p.grade))).sort(), [points]);
  const colorOf = useMemo(() => {
    const m: Record<string, string> = {};
    grades.forEach((g, i) => (m[g] = GRADE_COLORS[g] ?? PALETTE[i % PALETTE.length]));
    return m;
  }, [grades]);

  const [active, setActive] = useState<Set<string>>(new Set());
  useEffect(() => setActive(new Set(grades)), [grades]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current) return;

      if (!mapRef.current) {
        const map = L.map(mapEl.current).setView([13.55, 100.27], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
      }

      const layer = layerRef.current!;
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
      if (latlngs.length) mapRef.current!.fitBounds(latlngs, { padding: [40, 40], maxZoom: 16 });
    })();
    return () => { cancelled = true; };
  }, [points, active, colorOf]);

  function toggle(g: string) {
    setActive((cur) => {
      const next = new Set(cur);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });
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
      <div ref={mapEl} className="h-[70vh] w-full rounded-2xl ring-1 ring-slate-200" />
    </div>
  );
}
