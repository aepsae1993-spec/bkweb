// คำนวณระยะทาง/เวลา ขับรถตามถนน ผ่าน OSRM (ฟรี ไม่ต้องใช้คีย์)
// ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น (เลี่ยง CORS) แล้ว cache ผลไว้ในฐานข้อมูล

export interface LatLng {
  lat: number;
  lng: number;
}

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

// ระยะเส้นตรง (กม.) — ใช้เป็น fallback
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export interface RoadResult {
  distanceM: number;
  durationS: number;
  approx: boolean; // true = ใช้เส้นตรงประมาณ (OSRM ใช้ไม่ได้)
}

export async function roadDistance(from: LatLng, to: LatLng): Promise<RoadResult> {
  const url = `${OSRM_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const j = await res.json();
      if (j.code === "Ok" && j.routes?.[0]) {
        return { distanceM: j.routes[0].distance, durationS: j.routes[0].duration, approx: false };
      }
    }
  } catch {
    // ตกไปใช้เส้นตรง
  }
  const km = haversineKm(from, to);
  return { distanceM: km * 1000, durationS: (km / 30) * 3600, approx: true }; // ประมาณ 30 กม./ชม.
}
