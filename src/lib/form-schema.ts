// ===== แบบสำรวจการเยี่ยมบ้านนักเรียน (17 หมวด) =====
// โครงสร้างนี้ใช้ทั้งเรนเดอร์ฟอร์ม และคำนวณสถิติสรุปทั้งห้อง

export type FieldType = "single" | "multi";

export interface Field {
  id: string;          // คีย์ที่เก็บใน hv_visits.data
  no: string;          // เลขหัวข้อในเอกสารต้นฉบับ
  label: string;       // ชื่อหมวด
  type: FieldType;     // เลือกได้ค่าเดียว / หลายค่า
  options: string[];   // ตัวเลือก
  allowOther?: boolean; // มีช่อง "อื่นๆ ระบุ"
}

export const FORM_SECTIONS: Field[] = [
  {
    id: "family_status", no: "1", label: "สภาพครอบครัว", type: "single",
    options: ["อยู่ด้วยกัน", "แยกกันอยู่", "หย่าร้าง", "บิดาหรือมารดาเสียชีวิต"],
  },
  {
    id: "house_type", no: "2", label: "ลักษณะบ้าน", type: "single",
    options: ["ถาวรชั้นเดียว", "ถาวร 2 ชั้น", "ชำรุดทรุดโทรม ทำจากวัสดุพื้นบ้านหรือวัสดุเหลือใช้", "บ้านเช่า"],
  },
  {
    id: "house_inside", no: "3", label: "สภาพภายในบ้าน", type: "single",
    options: ["แบ่งเป็นสัดส่วน", "เป็นห้องรวม"],
  },
  {
    id: "vehicle", no: "4", label: "ยานพาหนะของครอบครัว", type: "multi", allowOther: true,
    options: ["จักรยานยนต์", "รถยนต์", "รถบรรทุก/รถปิ๊กอัพ"],
  },
  {
    id: "relationship", no: "5", label: "ความสัมพันธ์ระหว่างนักเรียนกับสมาชิกในครอบครัว", type: "single",
    options: ["สนิทสนม", "เฉยๆ", "ห่างเหิน", "ขัดแย้ง"],
  },
  {
    id: "income_per_capita", no: "6", label: "รายได้ครัวเรือนเฉลี่ยต่อคน (รวมรายได้ครัวเรือนหารด้วยจำนวนสมาชิก)", type: "single",
    options: ["ต่ำกว่า 5,000", "5,001 – 10,000 บาท", "10,001 – 20,000 บาท", "20,001 – 30,000 บาท", "30,001 – 40,000 บาท", "มากกว่า 40,000 บาท"],
  },
  {
    id: "welfare_received", no: "7", label: "ความช่วยเหลือที่ครอบครัวเคยได้รับหรือต้องการได้รับ", type: "multi", allowOther: true,
    options: ["เบี้ยผู้สูงอายุ", "เบี้ยพิการ", "ไม่มี"],
  },
  {
    id: "distance", no: "8", label: "ระยะทางระหว่างบ้านไปโรงเรียน (ไป/กลับ)", type: "single",
    options: ["ไม่ถึง 1 กิโลเมตร", "ระยะทาง 1 - 5 กิโลเมตร", "ระยะทาง 6 - 10 กิโลเมตร", "มากกว่า 10 กิโลเมตร"],
  },
  {
    id: "travel_mode", no: "9", label: "การเดินทางระหว่างบ้านมาโรงเรียน", type: "single", allowOther: true,
    options: ["เดินด้วยเท้า", "ขี่รถจักรยาน", "ผู้ปกครองรับ – ส่ง", "รถรับจ้าง"],
  },
  {
    id: "house_chores", no: "10", label: "งานที่นักเรียนช่วยเหลือผู้ปกครองขณะอยู่ที่บ้าน", type: "multi", allowOther: true,
    options: ["ทำความสะอาดบ้าน", "รดน้ำต้นไม้", "ช่วยเลี้ยงน้อง", "ช่วยพับผ้า", "ล้างจาน"],
  },
  {
    id: "meals", no: "11", label: "การรับประทานอาหารของนักเรียน", type: "single",
    options: ["ครบ 3 มื้อ", "ไม่ครบ 3 มื้อ", "ขาดมื้อเช้า", "ขาดมื้อกลางวัน", "ขาดมื้อเย็น"],
  },
  {
    id: "allowance", no: "12", label: "นักเรียนได้รับเงินจากผู้ปกครองมาโรงเรียนวันละ", type: "single",
    options: ["1 – 10 บาท", "11 – 20 บาท", "มากกว่า 20 บาท"],
  },
  {
    id: "risk_health", no: "13.1", label: "พฤติกรรมและความเสี่ยง: ด้านสุขภาพ", type: "multi",
    options: ["ร่างกายไม่แข็งแรง", "มีสมรรถภาพทางร่างกายต่ำ", "ป่วยเป็นโรคร้ายแรง/เรื้อรัง", "มีภาวะทุพโภชนาการ", "มีโรคประจำตัว", "แพ้อาหาร", "สุขภาพแข็งแรง"],
  },
  {
    id: "risk_welfare", no: "13.2", label: "ด้านสวัสดิการหรือความปลอดภัย", type: "multi",
    options: ["พ่อแม่แยกทางกันหรือแต่งงานใหม่", "มีบุคคลในครอบครัวป่วยเป็นโรคร้ายแรง/เรื้อรัง", "ที่พักอาศัยอยู่ในชุมชนแออัดหรือใกล้แหล่งมั่วสุม/สถานเริงรมย์", "มีความขัดแย้ง/ทะเลาะกันและใช้ความรุนแรงในครอบครัว", "บุคคลในครอบครัวติดสารเสพติด", "บุคคลในครอบครัวเล่นการพนัน", "ไม่มีผู้ดูแล", "ถูกทำร้าย/ทารุณกรรมจากบุคคล", "ถูกล่วงละเมิดทางเพศ", "ไม่มีความเสี่ยง"],
  },
  {
    id: "risk_drugs", no: "13.3", label: "ด้านการใช้สารเสพติด", type: "multi", allowOther: true,
    options: ["คบเพื่อนในกลุ่มที่ใช้สารเสพติด", "สมาชิกในครอบครัวข้องเกี่ยวกับยาเสพติด", "อยู่ในสภาพแวดล้อมที่ใช้สารเสพติด", "ปัจจุบันเกี่ยวข้องกับสารเสพติด"],
  },
  {
    id: "internet_access", no: "13.4", label: "การเข้าถึงสื่อคอมพิวเตอร์และอินเตอร์เน็ตที่บ้าน", type: "single",
    options: ["สามารถเข้าถึงอินเตอร์เน็ตจากที่บ้าน", "ไม่สามารถเข้าถึงอินเตอร์เน็ตจากที่บ้าน"],
  },
  {
    id: "risk_game", no: "13.5", label: "การติดเกม", type: "multi", allowOther: true,
    options: ["เล่นเกมเกินวันละ 1 ชั่วโมง", "เก็บตัว แยกตัวจากกลุ่มเพื่อน", "ใช้จ่ายเงินผิดปกติ", "ร้านเกมอยู่ใกล้บ้านหรือโรงเรียน", "หมกมุ่น จริงจังในการเล่นเกม", "โกหก ลักขโมยเงินเพื่อเล่นเกม", "อยู่ในกลุ่มเพื่อนเล่นเกม"],
  },
  {
    id: "habits", no: "14", label: "อุปนิสัยของนักเรียนขณะอยู่บ้าน", type: "multi",
    options: ["ชอบเล่นสนุกสนาน", "ชอบรังแกผู้อื่น", "ก้าวร้าว", "ร่าเริง", "เซื่องซึม เหม่อลอย", "โมโหร้าย ทำลายข้าวของ", "เก็บตัวอยู่คนเดียว"],
  },
  {
    id: "study_support", no: "15", label: "การสนับสนุนการเรียนของผู้ปกครอง", type: "single",
    options: ["สนับสนุนการเรียนดี", "สนับสนุนการเรียนปานกลาง", "สนับสนุนการเรียนน้อย", "ไม่สนับสนุน"],
  },
  {
    id: "meet_time", no: "16", label: "ผู้ปกครองกับนักเรียนมีโอกาสพบเจอกันในช่วงเวลาใด", type: "single",
    options: ["เฉพาะก่อนไปโรงเรียน", "เฉพาะหลังเลิกเรียน", "มีโอกาสพบกันน้อย", "พบกันทั้งเช้าและเย็น"],
  },
  {
    id: "parent_need", no: "17", label: "ความคิดเห็นและความต้องการของผู้ปกครองที่มีต่อโรงเรียน", type: "multi", allowOther: true,
    options: ["พัฒนาด้านการเรียน", "พัฒนาด้านกีฬา", "ด้านพฤติกรรม", "ด้านทุนการศึกษา", "ปรับปรุงอาคารสถานที่"],
  },
];

export const OTHER_SUFFIX = "__other";

export type VisitData = Record<string, string | string[] | undefined>;

// ===== คำนวณสถิติสรุปทั้งห้อง =====
export interface OptionStat { label: string; count: number; percent: number }
export interface SectionStat { no: string; label: string; type: FieldType; options: OptionStat[] }

export function computeStatistics(
  visits: { data: VisitData }[]
): SectionStat[] {
  const total = visits.length || 1;
  return FORM_SECTIONS.map((f) => {
    const options: OptionStat[] = f.options.map((opt) => {
      const count = visits.filter((v) => {
        const val = v.data?.[f.id];
        if (Array.isArray(val)) return val.includes(opt);
        return val === opt;
      }).length;
      return { label: opt, count, percent: Math.round((count / total) * 10000) / 100 };
    });
    if (f.allowOther) {
      const count = visits.filter((v) => {
        const other = v.data?.[f.id + OTHER_SUFFIX];
        return typeof other === "string" && other.trim().length > 0;
      }).length;
      options.push({ label: "อื่นๆ", count, percent: Math.round((count / total) * 10000) / 100 });
    }
    return { no: f.no, label: f.label, type: f.type, options };
  });
}
