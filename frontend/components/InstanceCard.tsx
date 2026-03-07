"use client";

import { useState, useEffect } from "react";
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
  Copy,
  CheckCircle2,
} from "lucide-react";
import { apiKeysApi, usageApi } from "@/lib/api";
import { cn, getAvatarColor, timeAgo, formatNumber } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { InstanceTokenDisplay } from "./InstanceTokenDisplay";
import { useInstanceStatus } from "@/hooks/useInstanceStatus";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [msgUsage, setMsgUsage] = useState<{ daily: number; monthly: number; limits: { daily: number; monthly: number } } | null>(null);
  
  // Real-time instance status - DISABLED to avoid refresh loops
  // TODO: Re-enable with proper state management
  const realTimeStatus = 'unknown';
  const connectionInfo: any = null;
  // const {
  //   status: realTimeStatus,
  //   connectionInfo,
  // } = useInstanceStatus({
  //   instanceName: instance.instanceName,
  //   enabled: true,
  //   pollInterval: 5000,
  // });

  // Load API keys for this instance
  useEffect(() => {
    // TODO: Réactiver quand l'endpoint /api/api-keys sera créé
    // async function loadKeys() {
    //   try {
    //     const res = await apiKeysApi.getAll(instance.id);
    //     setApiKeys(res.data?.data ?? []);
    //   } catch {
    //     setApiKeys([]);
    //   }
    // }
    // loadKeys();
    setApiKeys([]);
  }, [instance.id]);

  useEffect(() => {
    if (instance.id) {
      usageApi.getInstance(instance.instanceName || instance.id)
        .then((r) => setMsgUsage(r.data?.data ?? null))
        .catch(() => {});
    }
  }, [instance.id, instance.instanceName]);

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  
  // Normalize: real-time takes priority, fallback to DB status
  const currentStatus = realTimeStatus !== 'unknown' ? realTimeStatus :
    ({ open: 'connected', connected: 'connected', connecting: 'connecting', close: 'disconnected', closed: 'disconnected', disconnected: 'disconnected', expired: 'expired' } as Record<string, string>)[instance.connectionStatus ?? instance.status] || 'unknown';

  const isExpired = currentStatus === 'expired';
  const isConnected = currentStatus === 'connected';
  const isConnecting = currentStatus === 'connecting';

  const statusDotColor = isConnected ? '#22c55e' : isConnecting ? '#f59e0b' : isExpired ? '#ef4444' : '#6b7280';
  const statusLabel = isConnected ? `🟢 ${t('card.connected')}` : isConnecting ? `🟡 ${t('card.connectingStatus')}` : isExpired ? `🔴 ${t('card.expired')}` : `⚫ ${t('card.disconnected')}`;

  const avatarColor = getAvatarColor(instance.name);
  const initials = instance.name
    .split(/[\s_-]/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Utiliser le statut brut pour le StatusBadge (open/close/connecting/expired)
  const rawStatus = (instance.status || 'unknown') as string;
  const displayStatus = (['open', 'close', 'connecting', 'expired', 'unknown'].includes(rawStatus)
    ? rawStatus
    : rawStatus === 'connected' ? 'open'
    : rawStatus === 'disconnected' ? 'close'
    : 'unknown') as Instance["status"];

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
            <h3 className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {instance.name}
            </h3>
            <StatusBadge status={displayStatus} size="sm" />
          </div>

          <p className="text-[11px] text-[#4a6a4a] mt-0.5 font-mono truncate">
            {instance.instanceName || instance.id}
          </p>
          {instance.evolutionInstanceId && (
            <p className="text-[10px] text-[#3a5a3a] mt-0.5 font-mono truncate">
              {instance.evolutionInstanceId}
            </p>
          )}

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
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
            style={{ color: 'var(--text-dim)' }}
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
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onQRCode(instance);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <QrCode size={13} /> {t('card.scanQR')}
                </button>
                <div className="my-1" style={{ borderTop: '1px solid var(--border-subtle)' }} />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(instance);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 transition-colors"
                >
                  <Trash2 size={13} /> {t('card.delete')}
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* ── Inline Status ────────────────────── */}
      <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-subtle)' }}>
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
            {formatNumber(instance.stats?.messagesLast30Days ?? 0)} {t('card.msgs30d')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#5a7a5a]">
          <Key size={11} className="shrink-0" />
          <span>{instance.stats?.totalApiKeys ?? 0} {t('card.apiKeys')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#5a7a5a]">
          <Clock size={11} className="shrink-0" />
          <span>{timeAgo(instance.createdAt)}</span>
        </div>
      </div>

      {/* ── Usage bars (daily / monthly) ────────── */}
      {msgUsage && (
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#5a7a5a]">{t('acct.dailyUsage')}</span>
              <span className="text-[10px] font-mono text-[#5a7a5a]">{msgUsage.daily} / {msgUsage.limits.daily}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((msgUsage.daily / msgUsage.limits.daily) * 100, 100)}%`,
                  background: msgUsage.daily >= msgUsage.limits.daily ? '#ef4444' : msgUsage.daily >= msgUsage.limits.daily * 0.8 ? '#f59e0b' : '#22c55e',
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#5a7a5a]">{t('acct.monthlyUsage')}</span>
              <span className="text-[10px] font-mono text-[#5a7a5a]">{msgUsage.monthly} / {msgUsage.limits.monthly}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((msgUsage.monthly / msgUsage.limits.monthly) * 100, 100)}%`,
                  background: msgUsage.monthly >= msgUsage.limits.monthly ? '#ef4444' : msgUsage.monthly >= msgUsage.limits.monthly * 0.8 ? '#f59e0b' : '#3b82f6',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Quota bar ───────────────────────────── */}
      {instance.quotas && instance.quotas.length > 0 && (() => {
        const q = instance.quotas[0];
        const pct = q.limit > 0 ? Math.round((q.used / q.limit) * 100) : 0;
        return (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#4a6a4a]">
                {t('card.msgQuota')}
              </span>
              <span className="text-[10px] text-[#5a7a5a]">
                {formatNumber(q.used)} / {formatNumber(q.limit)}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
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

      {/* ── Instance token display ────────────────────── */}
      <div className="mt-3">
        <InstanceTokenDisplay
          token={instance.instanceToken || ''}
          instanceName={instance.instanceName}
        />
      </div>

      {/* ── Expired banner ──────────────────────── */}
      {isExpired && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="payment-banner mt-3.5 px-3 py-2 flex items-center gap-2"
        >
          <AlertCircle size={12} className="text-red-400 shrink-0" />
          <p className="text-[11px] text-red-400 flex-1">
            <span className="font-semibold">{t('card.paymentRequired')}</span> {t('card.paymentDesc')}
          </p>
          <button className="btn-danger text-[10px] px-2 py-1 flex items-center gap-1">
            <CreditCard size={10} />
            {t('card.pay')}
          </button>
        </motion.div>
      )}

      {/* ── Action buttons ──────────────────────── */}
      <div className="flex items-center gap-2 mt-3.5 pt-3" style={{ borderTop: '1px solid var(--card-border)' }}>
        <button
          onClick={() => onQRCode(instance)}
          disabled={isExpired}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex-1 justify-center",
            isExpired
              ? "cursor-not-allowed"
              : ""
          )}
        >
          <QrCode size={12} />
          {isConnected ? t('card.qrCode') : isConnecting ? t('card.connecting') : t('card.scanQR')}
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
