"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SCHOOL_LOGO_URL } from "@/lib/branding";

const links = [
  { href: "/dashboard", label: "หน้าหลัก", icon: "🏠" },
  { href: "/classrooms", label: "ชั้นเรียน", icon: "📚" },
  { href: "/map", label: "แผนที่", icon: "🗺️" },
  { href: "/setup", label: "ตั้งค่า", icon: "⚙️" },
];

export default function AppNav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          <Link href="/dashboard" className="mr-3 flex items-center gap-2">
            <Image src={SCHOOL_LOGO_URL} alt="โลโก้โรงเรียน" width={32} height={32} className="object-contain" />
            <span className="hidden text-lg font-bold text-indigo-700 sm:inline">เยี่ยมบ้าน</span>
          </Link>
          <nav className="flex gap-1">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="mr-1">{l.icon}</span>
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:inline">{name}</span>
          <button
            onClick={signOut}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </header>
  );
}
