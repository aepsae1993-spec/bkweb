import { cookies } from "next/headers";

export const TEACHER_COOKIE = "hv_teacher";

// ชื่อครูปัจจุบัน เก็บใน cookie ต่อเบราว์เซอร์ (แยกกันแต่ละเครื่อง ไม่ทับกัน)
export async function getCurrentTeacher(): Promise<string> {
  const c = await cookies();
  const v = c.get(TEACHER_COOKIE)?.value;
  return v ? decodeURIComponent(v) : "";
}
