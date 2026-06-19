# ระบบรายงานเยี่ยมบ้านนักเรียน (bkweb)

เว็บแอปสำหรับบันทึกข้อมูลการเยี่ยมบ้านนักเรียน สรุปสถิติอัตโนมัติ และออกรูปเล่มรายงาน (Word/PDF)
อ้างอิงรูปแบบจากเอกสาร *รูปเล่มเยี่ยมบ้าน* และ *เยี่ยมบ้านรายบุคคล* (ระบบดูแลช่วยเหลือนักเรียน)

- **Live:** https://bkweb-home-visit.vercel.app
- **Stack:** Next.js 16 (App Router) · Supabase (Postgres + Auth + Storage) · Tailwind · deploy บน Vercel

## ความสามารถ
- เข้าสู่ระบบสำหรับครู (หลายครู หลายห้อง ทั้งโรงเรียน)
- จัดการชั้นเรียน + รายชื่อนักเรียน (วางรายชื่อทีละหลายคน ระบบแยกเพศ/คำนำหน้าให้)
- แบบฟอร์มเยี่ยมบ้านครบ 17 หมวด (สภาพครอบครัว บ้าน ยานพาหนะ รายได้ พฤติกรรม/ความเสี่ยง ฯลฯ)
- อัปโหลดรูปถ่ายบ้าน (เก็บใน Supabase Storage แบบส่วนตัว)
- สรุปสถิติทั้งห้อง + ร้อยละ อัตโนมัติ
- รายงานรูปเล่ม 5 ส่วน: ปกแบบบันทึก · รายงานเชิงพรรณนา · บันทึกรายบุคคล · ตารางสถิติ · ภาคผนวกรูปภาพ
- ส่งออกเป็นไฟล์ **Word (.docx)** และพิมพ์/บันทึกเป็น **PDF**

## โครงสร้างหลัก
```
src/
  app/
    login, signup            หน้าเข้าสู่ระบบ/สมัคร
    (app)/                   ส่วนที่ต้องล็อกอิน (มีแถบเมนู)
      dashboard, setup
      classrooms/[id]/...    จัดการห้อง, ฟอร์มเยี่ยม, รายงาน
    api/export/docx          สร้างไฟล์ Word ฝั่งเซิร์ฟเวอร์
  components/                VisitForm, PhotoUploader, AppNav, ReportActions
  lib/
    form-schema.ts           นิยาม 17 หมวด + ฟังก์ชันคำนวณสถิติ
    report.ts                ดึงข้อมูล+รวมรายงาน
    supabase/                client/server
  proxy.ts                   ป้องกัน route (Next 16 ใช้ proxy แทน middleware)
```

## รันในเครื่อง
```bash
npm install
npm run dev        # http://localhost:3000
```
ต้องมีไฟล์ `.env.local` (มี `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## ฐานข้อมูล (Supabase)
ตารางนำหน้าด้วย `hv_`: `hv_schools, hv_profiles, hv_classrooms, hv_students, hv_visits, hv_photos`
เปิด Row Level Security ทุกตาราง — ครูเห็น/แก้ได้เฉพาะห้องของตน (admin เห็นทั้งโรงเรียน)
Storage bucket: `hv-photos` (private)

## หมายเหตุการดูแลระบบ
- **การสมัคร:** ระบบเปิดให้สมัครเองได้ หากต้องการจำกัด ให้คุมการสมัครใน Supabase Auth
- **ยืนยันอีเมล:** ถ้าต้องการให้สมัครแล้วใช้ได้ทันที ให้ปิด *Confirm email* ใน Supabase → Authentication → Providers → Email
- **บัญชีทดลอง:** `kru@test.local` / `test1234` (มีข้อมูล ป.4 ตัวอย่าง 16 คน)
