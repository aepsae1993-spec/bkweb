"use client";

export default function ReportActions({ classroomId }: { classroomId: string }) {
  return (
    <div className="no-print mb-6 flex flex-wrap items-center gap-3">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        🖨 พิมพ์ / บันทึก PDF
      </button>
      <a
        href={`/api/export/docx?classroomId=${classroomId}`}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        ⬇ ดาวน์โหลด Word (.docx)
      </a>
      <span className="text-sm text-slate-400">เคล็ดลับ: “พิมพ์” แล้วเลือกปลายทางเป็น “บันทึกเป็น PDF” เพื่อได้ไฟล์ PDF</span>
    </div>
  );
}
