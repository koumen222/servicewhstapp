"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, CreditCard, MessageSquare, Wifi, CheckCircle2, XCircle, Send, Shield, Key, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useStore";
import { subscriptionsApi, usageApi } from "@/lib/api";
import { PLAN_CATALOG } from "@/lib/types";
import type { SubscriptionInfo, PlanType } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export default function AccountPage() {
  const { user, instances } = useAppStore();
  const { t } = useI18n();
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgUsage, setMsgUsage] = useState<{ daily: number; monthly: number; total: number; limits: { daily: number; monthly: number } } | null>(null);

  useEffect(() => {
    subscriptionsApi.getMySubscription()
      .then((r) => setSub(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    usageApi.getGlobal()
      .then((r) => setMsgUsage(r.data?.data ?? null))
      .catch(() => {});
  }, []);

  const plan = (sub?.plan ?? user?.plan ?? "basic") as PlanType;
  const planData = PLAN_CATALOG[plan];
  const usage = sub?.usage;
  const maxInst = sub?.maxInstances ?? user?.maxInstances ?? 1;
  const instPct = Math.min(((usage?.activeInstances ?? instances.length) / maxInst) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={20} className="animate-spin text-[#22c55e]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
      >
        <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
          {t('acct.profile')}
        </h2>
        <div className="flex items-start sm:items-center gap-4 flex-wrap">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: "var(--green-bg-subtle)", color: "var(--brand-green)" }}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name ?? "User"}</p>
            <p className="text-[12px] text-[#5a7a5a] flex items-center gap-1.5 mt-0.5 truncate">
              <Mail size={11} className="shrink-0" />{user?.email ?? "—"}
            </p>
          </div>
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize shrink-0"
            style={{ background: "var(--tag-bg)", color: "var(--tag-text)" }}
          >
            {plan}
          </span>
        </div>
      </motion.div>

      {/* Usage Metrics — live from /api/subscriptions/my-subscription */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl p-5"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
      >
        <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
          {t('acct.usage')}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          {[
            { label: t('acct.msgs30d'), value: usage?.messages30d ?? 0,       icon: Send,          color: "#22c55e" },
            { label: t('acct.totalMsgs'),          value: usage?.totalMessages ?? 0,     icon: MessageSquare, color: "#3b82f6" },
            { label: t('acct.delivered'),         value: usage?.deliveredMessages ?? 0, icon: CheckCircle2,  color: "#22c55e" },
            { label: t('acct.failed'),           value: usage?.failedMessages ?? 0,   icon: XCircle,       color: "#ef4444" },
            { label: t('acct.activeInstances'),        value: usage?.activeInstances ?? instances.length, icon: Wifi, color: "#8b5cf6" },
            { label: t('acct.apiKeysCount'),                 value: instances.reduce((s, i) => s + (i.apiKeys?.length ?? 0), 0), icon: Key, color: "#f59e0b" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-3.5"
              style={{ background: "var(--input-bg)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon size={12} style={{ color }} />
                </div>
                <p className="text-[10px] text-[#5a7a5a]">{label}</p>
              </div>
              <p className="text-xl font-bold" style={{ color }}>{formatNumber(value)}</p>
            </div>
          ))}
        </div>

        {/* Instance quota bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] text-[#8a9a8a]">{t('acct.instancesUsed')}</span>
            <span className="text-[11px] text-[#5a7a5a] font-mono">
              {usage?.activeInstances ?? instances.length} / {maxInst}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${instPct}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: instPct > 80 ? "#ef4444" : "#3b82f6" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Message Consumption */}
      {msgUsage && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl p-5"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
            {t('acct.consumption') || 'Consommation messages'}
          </h2>

          <div className="space-y-4">
            {/* Daily usage */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  {t('acct.dailyUsage') || "Aujourd'hui"}
                </span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {msgUsage.daily} / {msgUsage.limits.daily}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((msgUsage.daily / msgUsage.limits.daily) * 100, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: msgUsage.daily >= msgUsage.limits.daily ? '#ef4444' : msgUsage.daily >= msgUsage.limits.daily * 0.8 ? '#f59e0b' : '#22c55e' }}
                />
              </div>
              {msgUsage.daily >= msgUsage.limits.daily && (
                <p className="text-[10px] text-red-400 mt-1">Limite quotidienne atteinte</p>
              )}
            </div>

            {/* Monthly usage */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                  {t('acct.monthlyUsage') || 'Ce mois'}
                </span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {msgUsage.monthly} / {msgUsage.limits.monthly}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((msgUsage.monthly / msgUsage.limits.monthly) * 100, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="h-full rounded-full"
                  style={{ background: msgUsage.monthly >= msgUsage.limits.monthly ? '#ef4444' : msgUsage.monthly >= msgUsage.limits.monthly * 0.8 ? '#f59e0b' : '#3b82f6' }}
                />
              </div>
              {msgUsage.monthly >= msgUsage.limits.monthly && (
                <p className="text-[10px] text-red-400 mt-1">Limite mensuelle atteinte</p>
              )}
            </div>

            {/* Total all-time */}
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                {t('acct.totalSent') || 'Total envoy\u00e9s'}
              </span>
              <span className="text-[14px] font-bold" style={{ color: 'var(--brand-green)' }}>
                {formatNumber(msgUsage.total)}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Plan */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-5"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
      >
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            {t('acct.subscription')}
          </h2>
          <a href="/dashboard/balance" className="btn-green text-xs px-3 py-1.5">{t('acct.upgrade')}</a>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--green-bg-subtle)" }}>
            <CreditCard size={18} className="text-[#22c55e]" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{plan} Plan</p>
            <p className="text-[12px] text-[#5a7a5a] mt-0.5 break-words">
              {planData.maxInstances} instance{planData.maxInstances !== 1 ? "s" : ""} ·{" "}
              {planData.price.toLocaleString("fr-FR")} XAF{t('bal.month')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl p-5"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
      >
        <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
          {t('acct.security')}
        </h2>
        <div className="space-y-2">
          {[
            { label: t('acct.changePassword'), desc: t('acct.changePasswordDesc') },
            { label: t('acct.2fa'),     desc: t('acct.2faDesc') },
          ].map(({ label, desc }) => (
            <div
              key={label}
              className="flex items-start sm:items-center justify-between p-3 rounded-xl gap-3"
              style={{ background: "var(--input-bg)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-3">
                <Shield size={14} className="text-[#4a6a4a]" />
                <div>
                  <p className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-[10px] text-[#4a6a4a]">{desc}</p>
                </div>
              </div>
              <button className="btn-ghost text-xs shrink-0">{t('acct.configure')}</button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
