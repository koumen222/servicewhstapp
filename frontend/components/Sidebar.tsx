"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  MessageSquare,
  Code2,
  CreditCard,
  ShoppingCart,
  Puzzle,
  Globe,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Wifi,
  ExternalLink,
} from "lucide-react";
import { useAppStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { deleteCookie } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const NAV_ITEMS = [
  { href: "/dashboard/instances", labelKey: "sidebar.instances" as const, icon: LayoutGrid },
  { href: "/dashboard/chats", labelKey: "sidebar.chats" as const, icon: MessageSquare },
  { href: "/dashboard/api", labelKey: "sidebar.api" as const, icon: Code2 },
  { href: "/dashboard/balance", labelKey: "sidebar.balance" as const, icon: CreditCard },
  { href: "/dashboard/purchases", labelKey: "sidebar.purchases" as const, icon: ShoppingCart },
  { href: "/dashboard/integrations", labelKey: "sidebar.integrations" as const, icon: Puzzle },
  { href: "/dashboard/proxy", labelKey: "sidebar.proxy" as const, icon: Globe },
  { href: "/dashboard/account", labelKey: "sidebar.account" as const, icon: User },
];

const ADMIN_ITEMS = [
  { href: "/admin/users", labelKey: "sidebar.admin.users" as const, icon: ShieldCheck },
  { href: "/admin/instances", labelKey: "sidebar.admin.instances" as const, icon: Wifi },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, sidebarOpen, toggleSidebar, logout } = useAppStore();
  const { t } = useI18n();
  const isAdmin = user?.role === "admin";

  const collapsed = !mobile && !sidebarOpen;

  function handleLogout() {
    logout();
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    deleteCookie("auth_token");
    router.push("/login");
  }

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 72 },
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? "collapsed" : "expanded"}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "flex flex-col h-full shrink-0 overflow-hidden",
        "border-r border-[#162016]",
        mobile ? "w-[260px]" : ""
      )}
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      {/* ── Logo ──────────────────────────────────────── */}
      <div className="flex items-center h-14 px-4 border-b border-[#162016] shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: "0 0 12px rgba(34,197,94,0.35)",
            }}
          >
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.15 }}
                className="font-semibold text-sm tracking-wide text-white whitespace-nowrap overflow-hidden"
              >
                ZeChat.site
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {!mobile && (
          <button
            onClick={toggleSidebar}
            className={cn(
              "ml-auto flex items-center justify-center w-6 h-6 rounded-md transition-colors duration-150 shrink-0",
              "text-[#4a6a4a] hover:text-[#22c55e] hover:bg-[#0d1f0d]"
            )}
          >
            {collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        )}

        {mobile && onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-[#4a6a4a] hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-0.5">
        {!collapsed && (
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#3a5a3a] mb-1">
                {t("sidebar.main")}
              </p>
            )}

        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const label = t(labelKey);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={cn("sidebar-link", active && "active")}
            >
              <Icon
                size={16}
                className={cn(
                  "shrink-0",
                  active ? "text-[#22c55e]" : "text-[#4a6a4a]"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="truncate"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-[#162016]" />
            {!collapsed && (
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#3a5a3a] mb-1">
                {t("sidebar.admin")}
              </p>
            )}
            {ADMIN_ITEMS.map(({ href, labelKey, icon: Icon }) => {
              const active = pathname.startsWith(href);
              const label = t(labelKey);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  className={cn("sidebar-link", active && "active")}
                >
                  <Icon
                    size={16}
                    className={cn(
                      "shrink-0",
                      active ? "text-[#22c55e]" : "text-[#4a6a4a]"
                    )}
                  />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="truncate"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </>
        )}

        {/* Documentation */}
        <div className="my-2 border-t border-[#162016]" />
        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? t("sidebar.docs") : undefined}
          className="sidebar-link"
        >
          <BookOpen size={16} className="shrink-0 text-[#4a6a4a]" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 truncate"
              >
                {t("sidebar.docs")}
                <ExternalLink size={11} className="text-[#3a5a3a]" />
              </motion.span>
            )}
          </AnimatePresence>
        </a>
      </nav>

      {/* ── User Footer ───────────────────────────────── */}
      <div className="shrink-0 border-t border-[#162016] p-2">
        <div
          className={cn(
            "flex items-center gap-2.5 px-2 py-2 rounded-lg",
            "hover:bg-[#0d1f0d] transition-colors duration-150 cursor-default"
          )}
        >
          <div
            className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-xs font-bold"
            style={{ background: "#0d2510", color: "#22c55e" }}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-[#c8d8c8] truncate">
                  {user?.name ?? t("sidebar.user.default")}
                </p>
                <p className="text-[10px] text-[#4a6a4a] truncate">
                  {user?.email ?? ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                title={t("sidebar.logout")}
                className="shrink-0 text-[#3a5a3a] hover:text-red-400 transition-colors duration-150"
              >
                <LogOut size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
