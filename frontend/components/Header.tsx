"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  AlertTriangle,
  Check,
} from "lucide-react";
import { useAppStore } from "@/store/useStore";
import { cn, deleteCookie } from "@/lib/utils";
import { useI18n, type Locale } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const PAGE_TITLE_KEYS: Record<string, string> = {
  "/dashboard": "page.dashboard",
  "/dashboard/instances": "page.instances",
  "/dashboard/chats": "page.chats",
  "/dashboard/api": "page.api",
  "/dashboard/balance": "page.balance",
  "/dashboard/purchases": "page.purchases",
  "/dashboard/integrations": "page.integrations",
  "/dashboard/proxy": "page.proxy",
  "/dashboard/account": "page.account",
  "/admin/users": "page.admin.users",
  "/admin/instances": "page.admin.instances",
  "/admin/plans": "page.admin.plans",
};

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, instances, logout } = useAppStore();
  const { locale, setLocale, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const titleKey = PAGE_TITLE_KEYS[pathname] ?? "page.dashboard";
  const title = t(titleKey as any);
  const hasExpired = instances.some(
    (i) => i.status === "expired" || i.connectionStatus === "expired"
  );

  const currentLang = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  function handleLogout() {
    logout();
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    deleteCookie("auth_token");
    router.push("/login");
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="header-glass sticky top-0 z-30 shrink-0">
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <Menu size={20} />
        </button>

        {/* Page title */}
        <h1
          className="text-[15px] font-semibold flex-1 truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>

        {/* ── Right controls ────────────────── */}
        <div className="flex items-center gap-1.5">
          {/* Language selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => { setLangOpen(!langOpen); setUserOpen(false); }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                "hover:opacity-80"
              )}
              style={{
                color: "var(--text-secondary)",
                border: "1px solid var(--btn-ghost-border)",
              }}
              title={t("header.language")}
            >
              <Globe size={13} />
              <span className="hidden sm:inline">{currentLang.flag} {locale.toUpperCase()}</span>
              <span className="sm:hidden">{currentLang.flag}</span>
              <ChevronDown size={11} className={cn("transition-transform duration-150", langOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden py-1 min-w-[160px] shadow-xl"
                  style={{
                    background: "var(--dropdown-bg)",
                    border: "1px solid var(--dropdown-border)",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                  }}
                >
                  <p
                    className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {t("header.language")}
                  </p>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setLocale(lang.code); setLangOpen(false); }}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-left transition-colors"
                      )}
                      style={{
                        color: lang.code === locale ? "var(--brand-green)" : "var(--text-secondary)",
                        backgroundColor: lang.code === locale ? "var(--sidebar-active)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (lang.code !== locale) e.currentTarget.style.backgroundColor = "var(--dropdown-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (lang.code !== locale) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <span className="text-sm">{lang.flag}</span>
                      <span className="flex-1">{lang.label}</span>
                      {lang.code === locale && <Check size={12} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              color: theme === "dark" ? "var(--brand-green)" : "var(--text-secondary)",
              backgroundColor: theme === "dark" ? "var(--sidebar-active)" : "transparent",
            }}
            title={theme === "dark" ? t("header.theme.light") : t("header.theme.dark")}
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Moon size={15} />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Sun size={15} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Notifications */}
          <button
            className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150"
            style={{ color: "var(--text-muted)" }}
            title={t("header.notifications")}
          >
            <Bell size={15} />
            {hasExpired && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2" style={{ ringColor: "var(--header-bg)" }} />
            )}
          </button>

          {/* User dropdown */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => { setUserOpen(!userOpen); setLangOpen(false); }}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-150"
              )}
              style={{
                color: "var(--text-secondary)",
                border: "1px solid var(--btn-ghost-border)",
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: "var(--avatar-bg)", color: "var(--avatar-text)" }}
              >
                {user?.name?.charAt(0)?.toUpperCase() ??
                  user?.email?.charAt(0)?.toUpperCase() ??
                  "U"}
              </div>
              <span
                className="text-xs font-medium hidden sm:block max-w-[140px] truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {user?.email ?? "user@example.com"}
              </span>
              <ChevronDown size={11} className={cn("transition-transform duration-150", userOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {userOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden w-56 shadow-xl"
                  style={{
                    background: "var(--dropdown-bg)",
                    border: "1px solid var(--dropdown-border)",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* User info */}
                  <div className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--dropdown-border)" }}>
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {user?.name ?? "User"}
                    </p>
                    <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {user?.email}
                    </p>
                    <span
                      className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                      style={{ background: "var(--avatar-bg)", color: "var(--avatar-text)" }}
                    >
                      {user?.plan?.toUpperCase() ?? "FREE"}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { router.push("/dashboard/account"); setUserOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--dropdown-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <User size={13} /> {t("user.account")}
                    </button>
                    <button
                      onClick={() => { router.push("/dashboard/account"); setUserOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--dropdown-hover)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <Settings size={13} /> {t("user.settings")}
                    </button>
                  </div>

                  <div className="py-1" style={{ borderTop: "1px solid var(--dropdown-border)" }}>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={13} /> {t("user.logout")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Payment required banner ───────────────────── */}
      <AnimatePresence>
        {hasExpired && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="payment-banner mx-3 mb-2 px-3 py-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <AlertTriangle size={13} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-400">
                  <span className="font-semibold">{t("banner.payment.title")}</span>{" "}
                  <span className="hidden sm:inline">{t("banner.payment.desc")}</span>
                  <span className="sm:hidden">{t("banner.payment.short")}</span>
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/balance")}
                className="shrink-0 text-[10px] font-semibold text-red-300 hover:text-white bg-red-500/15 hover:bg-red-500/25 px-2 py-1 rounded transition-colors self-end sm:self-auto"
              >
                {t("banner.payment.cta")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
