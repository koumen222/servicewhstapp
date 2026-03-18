"use client";

import { motion } from "framer-motion";
import {
  Wifi,
  WifiOff,
  MessageSquare,
  AlertCircle,
  Plus,
  TrendingUp,
  Activity,
  Zap,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store/useStore";
import { StatusBadge } from "@/components/StatusBadge";
import { formatNumber, timeAgo } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Instance } from "@/lib/types";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DashboardPage() {
  const { user, instances, isLoadingInstances } = useAppStore();
  const { t } = useI18n();

  const active = instances.filter(
    (i) => i.connectionStatus === "open" || i.status === "open"
  ).length;
  const expired = instances.filter(
    (i) => i.connectionStatus === "expired" || i.status === "expired"
  ).length;
  const totalMsgs = instances.reduce(
    (s, i) => s + (i.stats?.messagesLast30Days ?? 0),
    0
  );

  const STATS = [
    {
      label: t("dash.stat.total"),
      value: instances.length,
      max: user?.maxInstances ?? 1,
      icon: Activity,
      color: "#22c55e",
      sub: `${user?.maxInstances ?? 1} ${t("dash.stat.maxAllowed")}`,
    },
    {
      label: t("dash.stat.connected"),
      value: active,
      icon: Wifi,
      color: "#22c55e",
      sub: active > 0 ? t("dash.stat.onlineNow") : t("dash.stat.noActive"),
    },
    {
      label: t("dash.stat.messages30d"),
      value: totalMsgs,
      icon: MessageSquare,
      color: "#3b82f6",
      sub: t("dash.stat.allInstances"),
    },
    {
      label: t("dash.stat.expired"),
      value: expired,
      icon: AlertCircle,
      color: expired > 0 ? "#ef4444" : "#4a6a4a",
      sub: expired > 0 ? t("dash.stat.paymentRequired") : t("dash.stat.allActive"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {t("dash.welcome")}{" "}
          <span className="text-gradient-green">
            {user?.name?.split(" ")[0] ?? t("dash.welcome.fallback")}
          </span>{" "}
          👋
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          {t("dash.subtitle")}
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {STATS.map(({ label, value, icon: Icon, color, sub, max }) => (
          <motion.div key={label} variants={fadeUp} className="stat-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              {max !== undefined && (
                <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                  {value}/{max}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold mb-0.5" style={{ color }}>
              {formatNumber(value)}
            </p>
            <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>{label}</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{sub}</p>

            {/* Usage bar */}
            {max !== undefined && max > 0 && (
              <div className="mt-2.5 h-1 rounded-full overflow-hidden" style={{ background: "var(--card-border)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((value / max) * 100, 100)}%`,
                    background: color,
                  }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Plan info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl p-4 flex items-center justify-between gap-4"
        style={{
          background: "linear-gradient(135deg, var(--sidebar-active) 0%, var(--sidebar-bg) 100%)",
          border: "1px solid var(--sidebar-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--brand-green-muted)" }}
          >
            <Zap size={16} style={{ color: "var(--brand-green)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {(!user?.hasPaid && !user?.isPaidAccount && user?.trialEndsAt && new Date(user.trialEndsAt) > new Date()) 
                ? "ESSAI GRATUIT" 
                : (user?.plan?.toUpperCase() ?? "BASIC")} {t("dash.plan.plan")}
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {user?.maxInstances ?? 1} {(user?.maxInstances ?? 1) !== 1 ? t("dash.plan.instances") : t("dash.plan.instance")} · {t("dash.plan.upgradeMore")}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/balance"
          className="btn-green text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0"
        >
          <TrendingUp size={12} />
          {t("dash.plan.upgrade")}
        </Link>
      </motion.div>

      {/* Recent instances */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("dash.yourInstances")}
          </h3>
          <Link
            href="/dashboard/instances"
            className="text-[11px] flex items-center gap-1 transition-colors"
            style={{ color: "var(--brand-green)" }}
          >
            {t("dash.viewAll")} <ArrowRight size={11} />
          </Link>
        </div>

        {isLoadingInstances ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl animate-pulse"
                style={{ background: "var(--card-bg)" }}
              />
            ))}
          </div>
        ) : instances.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center border border-dashed"
            style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
          >
            <div
              className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: "var(--avatar-bg)" }}
            >
              <Plus size={20} style={{ color: "var(--brand-green)" }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              {t("dash.noInstances")}
            </p>
            <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>
              {t("dash.noInstances.desc")}
            </p>
            <Link href="/dashboard/instances" className="btn-green text-xs">
              {t("dash.createInstance")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {instances.slice(0, 3).map((inst) => (
              <InstanceMiniCard key={inst.id} instance={inst} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-[13px] font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          {t("dash.quickActions")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { labelKey: "dash.action.createInstance" as const, href: "/dashboard/instances", icon: Plus, color: "#22c55e" },
            { labelKey: "dash.action.apiKeys" as const, href: "/dashboard/api", icon: Zap, color: "#3b82f6" },
            { labelKey: "dash.action.balance" as const, href: "/dashboard/balance", icon: TrendingUp, color: "#f59e0b" },
            { labelKey: "dash.action.account" as const, href: "/dashboard/account", icon: Activity, color: "#8b5cf6" },
          ].map(({ labelKey, href, icon: Icon, color }) => (
            <Link
              key={labelKey}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-150 group"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `${color}18` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <span className="text-[11px] font-medium transition-colors" style={{ color: "var(--text-secondary)" }}>
                {t(labelKey)}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function InstanceMiniCard({ instance }: { instance: Instance }) {
  const { t } = useI18n();
  const displayStatus = (instance.connectionStatus ?? instance.status) as Instance["status"];
  const isExpired = displayStatus === "expired";

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`instance-card p-4 ${isExpired ? "expired" : ""}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            background: isExpired ? "#1a0505" : "var(--avatar-bg)",
            color: isExpired ? "#ef4444" : "var(--avatar-text)",
          }}
        >
          {instance.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {instance.name}
          </p>
          <p className="text-[10px] truncate font-mono" style={{ color: "var(--text-muted)" }}>
            {instance.instanceName?.slice(0, 28)}…
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <StatusBadge status={displayStatus} size="sm" />
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {formatNumber(instance.stats?.messagesLast30Days ?? 0)} {t("common.msgs")}
        </span>
      </div>

      {isExpired && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-400">
          <AlertCircle size={10} />
          {t("dash.paymentRequired")}
        </div>
      )}
    </motion.div>
  );
}
