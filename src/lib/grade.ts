// ลำดับชั้นเรียน: อนุบาล < ประถม < มัธยม (อ.2 บนสุด, ป.6 ล่างสุด)
export function gradeOrder(grade: string): number {
  const m = grade.match(/(\d+)/);
  const n = m ? parseInt(m[1], 10) : 0;
  if (/อ/.test(grade)) return 0 + n; // อนุบาล
  if (/ป/.test(grade)) return 100 + n; // ประถม
  if (/ม/.test(grade)) return 200 + n; // มัธยม
  return 300 + n;
}

export function sortClassrooms<T extends { grade_level: string; room?: string | null }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      gradeOrder(a.grade_level) - gradeOrder(b.grade_level) ||
      (a.room || "").localeCompare(b.room || "")
  );
}
