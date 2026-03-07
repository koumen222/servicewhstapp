"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Moon,
  User,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { useAppStore } from "@/store/useStore";
import { cn, deleteCookie } from "@/lib/utils";

const LANG_OPTIONS = ["EN", "FR", "ES", "PT", "AR"];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/dashboard/instances": "Instances",
  "/dashboard/chats": "Conversations",
  "/dashboard/api": "API",
  "/dashboard/balance": "Solde",
  "/dashboard/purchases": "Achats",
  "/dashboard/integrations": "Intégrations",
  "/dashboard/proxy": "Proxy",
  "/dashboard/account": "Compte",
  "/admin/users": "Utilisateurs",
  "/admin/instances": "Toutes les Instances",
  "/admin/plans": "Plans",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, instances, logout } = useAppStore();
  const [lang, setLang] = useState("EN");
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const title = PAGE_TITLES[pathname] ?? "Tableau de bord";
  const hasExpired = instances.some(
    (i) => i.status === "expired" || i.connectionStatus === "expired"
  );

  function handleLogout() {
    logout();
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    deleteCookie("auth_token");
    router.push("/login");
  }

  return (
    <header className="header-glass sticky top-0 z-30 shrink-0">
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-[#5a7a5a] hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Page title */}
        <h1 className="text-[15px] font-semibold text-white flex-1 truncate">
          {title}
        </h1>

        {/* ── Right controls ────────────────── */}
        <div className="flex items-center gap-1.5">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => { setLangOpen(!langOpen); setUserOpen(false); }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                "text-[#6a8a6a] hover:text-white hover:bg-[#141f14]",
                "border border-[#1c2c1c]"
              )}
            >
              <Globe size={13} />
              {lang === "EN" ? "EN" : "FR"}
              <ChevronDown size={11} />
            </button>
            {langOpen && (
                <AnimatePresence>
                  <motion.div
                    key="lang-dropdown"
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setLangOpen(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-4 top-14 z-50 rounded-lg overflow-hidden py-1 min-w-[80px]"
                      style={{
                        background: "#111",
                        border: "1px solid #1e1e1e",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {["FR", "EN"].map((l) => (
                        <button
                          key={l}
                          onClick={() => { setLang(l); setLangOpen(false); }}
                          className={cn(
                            "w-full px-3 py-1.5 text-xs font-medium text-left transition-colors",
                            l === lang
                              ? "text-[#22c55e] bg-[#0d1f0d]"
                              : "text-[#8a9a8a] hover:bg-[#161616] hover:text-white"
                          )}
                        >
                          {l}
                        </button>
                      ))}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              )}
          </div>

          {/* Moon */}
          <button className="flex items-center justify-center w-8 h-8 rounded-lg text-[#5a7a5a] hover:text-[#22c55e] hover:bg-[#0d1f0d] transition-all duration-150">
            <Moon size={15} />
          </button>

          {/* Notifications */}
          <button className="relative flex items-center justify-center w-8 h-8 rounded-lg text-[#5a7a5a] hover:text-white hover:bg-[#141414] transition-all duration-150">
            <Bell size={15} />
            {hasExpired && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => { setUserOpen(!userOpen); setLangOpen(false); }}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-150",
                "text-[#8a9a8a] hover:text-white hover:bg-[#141414]",
                "border border-[#1c1c1c]"
              )}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: "#0d2510", color: "#22c55e" }}
              >
                {user?.name?.charAt(0)?.toUpperCase() ??
                  user?.email?.charAt(0)?.toUpperCase() ??
                  "U"}
              </div>
              <span className="text-xs font-medium hidden sm:block max-w-[140px] truncate">
                {user?.email ?? "user@example.com"}
              </span>
              <ChevronDown size={11} />
            </button>

            {userOpen && (
                <AnimatePresence>
                  <motion.div
                    key="user-dropdown"
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setUserOpen(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-4 top-14 z-50 rounded-xl overflow-hidden w-52"
                      style={{
                        background: "#111",
                        border: "1px solid #1e1e1e",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* User info */}
                      <div className="px-3 py-2.5 border-b border-[#1a1a1a]">
                        <p className="text-xs font-semibold text-white truncate">
                          {user?.name ?? "User"}
                        </p>
                        <p className="text-[10px] text-[#5a7a5a] truncate">
                          {user?.email}
                        </p>
                        <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#0d2510] text-[#22c55e]">
                          {user?.plan?.toUpperCase() ?? "FREE"}
                        </span>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => { router.push("/dashboard/account"); setUserOpen(false); }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-[#8a9a8a] hover:bg-[#161616] hover:text-white transition-colors"
                        >
                          <User size={13} /> Compte
                        </button>
                        <button
                          onClick={() => { router.push("/dashboard/account"); setUserOpen(false); }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-[#8a9a8a] hover:bg-[#161616] hover:text-white transition-colors"
                        >
                          <Settings size={13} /> Paramètres
                        </button>
                      </div>

                      <div className="border-t border-[#1a1a1a] py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-400 hover:bg-[#1a0a0a] transition-colors"
                        >
                          <LogOut size={13} /> Déconnexion
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              )}
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
                  <span className="font-semibold">Paiement requis.</span>{" "}
                  <span className="hidden sm:inline">Une ou plusieurs instances ont expiré.</span>
                  <span className="sm:hidden">Instance(s) expirée(s).</span>
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/balance")}
                className="shrink-0 text-[10px] font-semibold text-red-300 hover:text-white bg-red-500/15 hover:bg-red-500/25 px-2 py-1 rounded transition-colors self-end sm:self-auto"
              >
                Payer maintenant →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
