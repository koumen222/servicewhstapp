"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  QrCode,
  RotateCcw,
  Trash2,
  MoreVertical,
  Wifi,
  WifiOff,
  AlertCircle,
  Clock,
  MessageSquare,
  Key,
  CreditCard,
} from "lucide-react";
import { cn, getAvatarColor, timeAgo, formatNumber } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { useInstanceStatus } from "@/hooks/useInstanceStatus";
import type { Instance } from "@/lib/types";

interface InstanceCardProps {
  instance: Instance;
  onQRCode: (instance: Instance) => void;
  onDelete: (instance: Instance) => void;
}

export function InstanceCard({
  instance,
  onQRCode,
  onDelete,
}: InstanceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Real-time instance status
  const {
    status: realTimeStatus,
    connectionInfo,
  } = useInstanceStatus({
    instanceName: instance.name,
    enabled: true,
    pollInterval: 5000,
  });
  
  // Normalize: real-time takes priority, fallback to DB status
  const currentStatus = realTimeStatus !== 'unknown' ? realTimeStatus :
    ({ open: 'connected', connecting: 'connecting', close: 'disconnected', closed: 'disconnected', expired: 'expired' } as Record<string, string>)[instance.connectionStatus ?? instance.status] || 'unknown';

  const isExpired = currentStatus === 'expired';
  const isConnected = currentStatus === 'connected';
  const isConnecting = currentStatus === 'connecting';

  const statusDotColor = isConnected ? '#22c55e' : isConnecting ? '#f59e0b' : isExpired ? '#ef4444' : '#6b7280';
  const statusLabel = isConnected ? '🟢 Connected' : isConnecting ? '🟡 Connecting…' : isExpired ? '🔴 Expired' : '⚫ Disconnected';

  const avatarColor = getAvatarColor(instance.name);
  const initials = instance.name
    .split(/[\s_-]/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displayStatus = (instance.connectionStatus ??
    instance.status) as Instance["status"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("instance-card p-5", isExpired && "expired")}
    >
      {/* ── Top row ─────────────────────────────── */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 text-sm font-bold"
          style={{
            background: `${avatarColor}18`,
            color: avatarColor,
            border: `1px solid ${avatarColor}30`,
          }}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-semibold text-white truncate">
              {instance.name}
            </h3>
            <StatusBadge status={displayStatus} size="sm" />
          </div>

          <p className="text-[11px] text-[#4a6a4a] mt-0.5 font-mono truncate">
            {instance.instanceName
              ? instance.instanceName.length > 36
                ? instance.instanceName.slice(0, 36) + "…"
                : instance.instanceName
              : instance.id}
          </p>

          {instance.profileName && (
            <p className="text-[11px] text-[#6a8a6a] mt-0.5 truncate">
              📱 {instance.profileName}
            </p>
          )}
        </div>

        {/* More menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-[#4a6a4a] hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <MoreVertical size={14} />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-8 z-50 rounded-lg py-1 min-w-[140px]"
                style={{
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onQRCode(instance);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#8a9a8a] hover:bg-[#161616] hover:text-white transition-colors"
                >
                  <QrCode size={13} /> Scan QR
                </button>
                <div className="my-1 border-t border-[#1a1a1a]" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(instance);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-[#1a0a0a] transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* ── Inline Status ────────────────────── */}
      <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${isConnecting ? 'animate-pulse' : ''}`}
          style={{ background: statusDotColor }}
        />
        <span className="text-[11px]" style={{ color: statusDotColor }}>{statusLabel}</span>
        {(connectionInfo?.profileName || instance.profileName) && (
          <span className="text-[10px] text-white/40 ml-auto truncate">
            {connectionInfo?.profileName || instance.profileName}
          </span>
        )}
      </div>

      {/* ── Stats row ───────────────────────────── */}
      <div className="flex items-center gap-3 mt-3.5 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] text-[#5a7a5a]">
          <MessageSquare size={11} className="shrink-0" />
          <span>
            {formatNumber(instance.stats?.messagesLast30Days ?? 0)} msgs/30d
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#5a7a5a]">
          <Key size={11} className="shrink-0" />
          <span>{instance.stats?.totalApiKeys ?? 0} API keys</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#5a7a5a]">
          <Clock size={11} className="shrink-0" />
          <span>{timeAgo(instance.createdAt)}</span>
        </div>
      </div>

      {/* ── Quota bar ───────────────────────────── */}
      {instance.quotas && instance.quotas.length > 0 && (() => {
        const q = instance.quotas[0];
        const pct = q.limit > 0 ? Math.round((q.used / q.limit) * 100) : 0;
        return (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#4a6a4a]">
                Messages quota
              </span>
              <span className="text-[10px] text-[#5a7a5a]">
                {formatNumber(q.used)} / {formatNumber(q.limit)}
              </span>
            </div>
            <div className="h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background:
                    pct > 80
                      ? "#ef4444"
                      : pct > 60
                      ? "#f59e0b"
                      : "#22c55e",
                }}
              />
            </div>
          </div>
        );
      })()}

      {/* ── Expired banner ──────────────────────── */}
      {isExpired && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="payment-banner mt-3.5 px-3 py-2 flex items-center gap-2"
        >
          <AlertCircle size={12} className="text-red-400 shrink-0" />
          <p className="text-[11px] text-red-400 flex-1">
            <span className="font-semibold">Payment is required</span> to use
            this instance.
          </p>
          <button className="btn-danger text-[10px] px-2 py-1 flex items-center gap-1">
            <CreditCard size={10} />
            Pay
          </button>
        </motion.div>
      )}

      {/* ── Action buttons ──────────────────────── */}
      <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-[#161616]">
        <button
          onClick={() => onQRCode(instance)}
          disabled={isExpired}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex-1 justify-center",
            isExpired
              ? "bg-[#1a1a1a] text-[#3a3a3a] cursor-not-allowed"
              : "bg-[#0d1f0d] text-[#22c55e] hover:bg-[#0d2510] border border-[#1a2e1a] hover:border-[#22c55e30]"
          )}
        >
          <QrCode size={12} />
          {isConnected ? "QR Code" : isConnecting ? "Connecting…" : "Scan QR"}
        </button>

        <button
          onClick={() => onDelete(instance)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium btn-danger transition-all duration-150"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}
