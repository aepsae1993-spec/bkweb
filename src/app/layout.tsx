import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ระบบรายงานเยี่ยมบ้านนักเรียน",
  description: "บันทึก สรุปสถิติ และออกรูปเล่มรายงานการเยี่ยมบ้านนักเรียน",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 font-sans">
        {children}
      </body>
    </html>
  );
}
