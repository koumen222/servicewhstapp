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
      label: "Total Instances",
      value: instances.length,
      max: user?.maxInstances ?? 1,
      icon: Activity,
      color: "#22c55e",
      sub: `${user?.maxInstances ?? 1} max autorisé`,
    },
    {
      label: "Connecté",
      value: active,
      icon: Wifi,
      color: "#22c55e",
      sub: active > 0 ? "En ligne maintenant" : "Aucune active",
    },
    {
      label: "Messages (30j)",
      value: totalMsgs,
      icon: MessageSquare,
      color: "#3b82f6",
      sub: "Sur toutes les instances",
    },
    {
      label: "Expiré",
      value: expired,
      icon: AlertCircle,
      color: expired > 0 ? "#ef4444" : "#4a6a4a",
      sub: expired > 0 ? "Paiement requis" : "Tous les plans actifs",
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
        <h2 className="text-xl font-bold text-white">
          Bienvenue,{" "}
          <span className="text-gradient-green">
            {user?.name?.split(" ")[0] ?? "là"}
          </span>{" "}
          👋
        </h2>
        <p className="text-[13px] text-[#5a7a5a] mt-0.5">
          Voici ce qui se passe avec vos instances WhatsApp aujourd'hui.
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
                <span className="text-[10px] text-[#4a6a4a] font-mono">
                  {value}/{max}
                </span>
              )}
            </div>
            <p
              className="text-2xl font-bold mb-0.5"
              style={{ color }}
            >
              {formatNumber(value)}
            </p>
            <p className="text-xs font-medium text-white mb-0.5">{label}</p>
            <p className="text-[10px] text-[#4a6a4a]">{sub}</p>

            {/* Usage bar */}
            {max !== undefined && max > 0 && (
              <div className="mt-2.5 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
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
          background: "linear-gradient(135deg, #0d2510 0%, #051405 100%)",
          border: "1px solid #1a3a1a",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#22c55e20" }}
          >
            <Zap size={16} className="text-[#22c55e]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {user?.plan?.toUpperCase() ?? "FREE"} Plan
            </p>
            <p className="text-[11px] text-[#5a7a5a]">
              {user?.maxInstances ?? 1} instance
              {(user?.maxInstances ?? 1) !== 1 ? "s" : ""} · Améliorez pour plus
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/balance"
          className="btn-green text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0"
        >
          <TrendingUp size={12} />
          Améliorer
        </Link>
      </motion.div>

      {/* Recent instances */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-white">
            Vos Instances
          </h3>
          <Link
            href="/dashboard/instances"
            className="text-[11px] text-[#22c55e] hover:text-[#4ade80] flex items-center gap-1 transition-colors"
          >
            Voir tout <ArrowRight size={11} />
          </Link>
        </div>

        {isLoadingInstances ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl animate-pulse"
                style={{ background: "#131313" }}
              />
            ))}
          </div>
        ) : instances.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center border border-dashed border-[#1e1e1e]"
            style={{ background: "#0d0d0d" }}
          >
            <div
              className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: "#0d2510" }}
            >
              <Plus size={20} className="text-[#22c55e]" />
            </div>
            <p className="text-sm font-medium text-white mb-1">
              Aucune instance pour le moment
            </p>
            <p className="text-[12px] text-[#4a6a4a] mb-4">
              Créez votre première instance WhatsApp pour commencer.
            </p>
            <Link href="/dashboard/instances" className="btn-green text-xs">
              Créer une instance
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
        <h3 className="text-[13px] font-semibold text-white mb-3">
          Actions Rapides
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Créer Instance", href: "/dashboard/instances", icon: Plus, color: "#22c55e" },
            { label: "Clés API", href: "/dashboard/api", icon: Zap, color: "#3b82f6" },
            { label: "Solde", href: "/dashboard/balance", icon: TrendingUp, color: "#f59e0b" },
            { label: "Compte", href: "/dashboard/account", icon: Activity, color: "#8b5cf6" },
          ].map(({ label, href, icon: Icon, color }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#1a1a1a] hover:border-[#2a2a2a] transition-all duration-150 group"
              style={{ background: "#0d0d0d" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `${color}18` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <span className="text-[11px] font-medium text-[#8a9a8a] group-hover:text-white transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function InstanceMiniCard({ instance }: { instance: Instance }) {
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
            background: isExpired ? "#1a0505" : "#0d2510",
            color: isExpired ? "#ef4444" : "#22c55e",
          }}
        >
          {instance.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-white truncate">
            {instance.name}
          </p>
          <p className="text-[10px] text-[#4a6a4a] truncate font-mono">
            {instance.instanceName?.slice(0, 28)}…
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <StatusBadge status={displayStatus} size="sm" />
        <span className="text-[10px] text-[#4a6a4a]">
          {formatNumber(instance.stats?.messagesLast30Days ?? 0)} msgs
        </span>
      </div>

      {isExpired && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-400">
          <AlertCircle size={10} />
          Paiement requis
        </div>
      )}
    </motion.div>
  );
}
