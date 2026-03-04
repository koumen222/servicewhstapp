"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Wifi,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useAppStore } from "@/store/useStore";
import { cn, deleteCookie } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/instances", label: "All Instances", icon: Wifi },
  { href: "/admin/plans", label: "Plans", icon: CreditCard },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAppStore();

  function handleLogout() {
    logout();
    localStorage.removeItem("auth_token");
    deleteCookie("auth_token");
    router.push("/login");
  }

  return (
    <aside
      className="flex flex-col h-full shrink-0 overflow-hidden w-[240px] border-r border-[#1a2a1a]"
      style={{ backgroundColor: "#040d04" }}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-[#1a2a1a] gap-2.5">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold shrink-0"
          style={{
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
            color: "#fff",
          }}
        >
          A
        </div>
        <span className="text-sm font-semibold text-white">Admin Panel</span>
      </div>

      {/* Back to dashboard */}
      <div className="px-2 py-2 border-b border-[#0d1f0d]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-[#5a7a5a] hover:text-white hover:bg-[#0d1f0d] transition-colors"
        >
          <ArrowLeft size={13} />
          Back to Dashboard
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-0.5">
        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#3a5a3a] mb-1">
          Management
        </p>
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn("sidebar-link", active && "active")}
            >
              <Icon
                size={15}
                className={cn(
                  "shrink-0",
                  active ? "text-[#22c55e]" : "text-[#4a6a4a]"
                )}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#1a2a1a] p-2">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0"
            style={{ background: "#1a0505", color: "#ef4444" }}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#c8d8c8] truncate">
              {user?.name ?? "Admin"}
            </p>
            <p className="text-[10px] text-red-500 truncate">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-[#3a5a3a] hover:text-red-400 transition-colors"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
