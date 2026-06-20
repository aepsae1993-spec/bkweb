import { NextRequest, NextResponse } from "next/server";
import { Document, Packer } from "docx";
import { createClient } from "@/lib/supabase/server";
import { buildReportData } from "@/lib/report";
import { FONT, studentFormChildren, type PhotoImage } from "@/lib/docx-helpers";

export const runtime = "nodejs";

async function fetchImage(supabase: Awaited<ReturnType<typeof createClient>>, path: string) {
  const { data } = await supabase.storage.from("hv-photos").download(path);
  if (!data) return null;
  const buf = Buffer.from(await data.arrayBuffer());
  const ext = (path.split(".").pop() || "jpg").toLowerCase();
  const type = ext === "png" ? "png" : ext === "gif" ? "gif" : "jpg";
  return { buf, type: type as "png" | "gif" | "jpg" };
}

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!studentId) return NextResponse.json({ error: "missing studentId" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: student } = await supabase
    .from("hv_students")
    .select("classroom_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "not found" }, { status: 404 });

  const r = await buildReportData(student.classroom_id);
  if (!r) return NextResponse.json({ error: "not found" }, { status: 404 });

  const s = r.students.find((x) => x.id === studentId);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });

  const ctx = { classroom: r.classroom, school: r.school, teacher: r.teacher };
  const photoImages: PhotoImage[] = [];
  for (const ph of s.photos) {
    photoImages.push({ caption: ph.caption, image: await fetchImage(supabase, ph.storage_path) });
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: 30 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
      children: studentFormChildren(s, ctx, photoImages),
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `${s.number ?? "student"}.docx`;
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}
