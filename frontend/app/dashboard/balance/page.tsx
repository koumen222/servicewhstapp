"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Zap, Star, Building2, ArrowRight, Loader2 } from "lucide-react";
import { subscriptionsApi } from "@/lib/api";
import { PLAN_CATALOG } from "@/lib/types";
import type { PlanType, SubscriptionInfo } from "@/lib/types";
import { useAppStore } from "@/store/useStore";
import { useI18n } from "@/lib/i18n";

const PLAN_META: Record<PlanType, { color: string; icon: typeof Zap; popular: boolean }> = {
  free:       { color: "#5a7a5a", icon: Zap,       popular: false },
  starter:    { color: "#22c55e", icon: Star,       popular: true  },
  pro:        { color: "#3b82f6", icon: CreditCard, popular: false },
  enterprise: { color: "#8b5cf6", icon: Building2, popular: false },
};

export default function BalancePage() {
  const { user } = useAppStore();
  const { t } = useI18n();

  const PLAN_FEATURES: Record<PlanType, string[]> = {
    free:       [t("bal.feat.free.1"), t("bal.feat.free.2"), t("bal.feat.free.3"), t("bal.feat.free.4")],
    starter:    [t("bal.feat.starter.1"), t("bal.feat.starter.2"), t("bal.feat.starter.3"), t("bal.feat.starter.4")],
    pro:        [t("bal.feat.pro.1"), t("bal.feat.pro.2"), t("bal.feat.pro.3"), t("bal.feat.pro.4")],
    enterprise: [t("bal.feat.enterprise.1"), t("bal.feat.enterprise.2"), t("bal.feat.enterprise.3"), t("bal.feat.enterprise.4")],
  };
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [paying, setPaying] = useState<PlanType | null>(null);

  useEffect(() => {
    subscriptionsApi.getMySubscription()
      .then((r) => setInfo(r.data))
      .catch(() => {});
  }, []);

  function handleUpgrade(plan: PlanType) {
    if (plan === "free") return;
    
    const planDetails = PLAN_CATALOG[plan];
    const phoneNumber = "237676778377";
    
    // Créer le message WhatsApp pré-rempli
    const message = `Bonjour, je souhaite souscrire au plan ${planDetails.name} à ${planDetails.price.toLocaleString("fr-FR")} XAF/mois pour mon compte ZeChat.site.`;
    
    // Encoder le message pour l'URL
    const encodedMessage = encodeURIComponent(message);
    
    // Redirection vers WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  }

  const currentPlan = (info?.plan ?? user?.plan ?? "free") as PlanType;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-[15px] font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{t('bal.title')}</h2>
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {t('bal.desc')}
        </p>
      </motion.div>

      {info && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex items-start sm:items-center gap-3"
          style={{ background: "#0d2010", border: "1px solid #22c55e30" }}
        >
          <CheckCircle2 size={18} className="text-[#22c55e] shrink-0 mt-0.5 sm:mt-0" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('bal.currentPlan')} : <span className="text-[#22c55e] capitalize">{info.plan}</span>
            </p>
            <p className="text-[11px] text-[#5a7a5a] mt-0.5 break-words">
              {info.usage.activeInstances} instance(s) · {info.usage.messages30d} msgs (30j) · {info.usage.totalMessages} total
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {(Object.entries(PLAN_CATALOG) as [PlanType, typeof PLAN_CATALOG[PlanType]][]).map(([key, plan], i) => {
          const meta = PLAN_META[key];
          const Icon = meta.icon;
          const isCurrent = key === currentPlan;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5 relative"
              style={{
                background: meta.popular ? "linear-gradient(135deg, #0d2010, #071408)" : "#111",
                border: `1px solid ${isCurrent ? meta.color + "80" : meta.popular ? meta.color + "50" : "#1e1e1e"}`,
              }}
            >
              {meta.popular && !isCurrent && (
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: meta.color, color: "#000" }}
                >
                  {t('bal.popular')}
                </div>
              )}
              {isCurrent && (
                <div
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                  style={{ background: meta.color, color: "#000" }}
                >
                  {t('bal.current')}
                </div>
              )}

              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${meta.color}18` }}
              >
                <Icon size={16} style={{ color: meta.color }} />
              </div>

              <p className="text-[13px] font-bold text-white">{plan.name}</p>
              <div className="my-1.5">
                {plan.originalPrice && plan.price > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] text-[#5a7a5a] line-through">
                        {plan.originalPrice.toLocaleString("fr-FR")} XAF
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                        -50%
                      </span>
                    </div>
                    <div className="flex items-end gap-0.5">
                      <span className="text-xl font-extrabold" style={{ color: meta.color }}>
                        {plan.price.toLocaleString("fr-FR")} XAF
                      </span>
                      <span className="text-[10px] text-[#5a7a5a] mb-0.5">/mois</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-end gap-0.5">
                    <span className="text-xl font-extrabold" style={{ color: meta.color }}>
                      {plan.price === 0 ? t('bal.free') : `${plan.price.toLocaleString("fr-FR")} XAF`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-[10px] text-[#5a7a5a] mb-0.5">/mois</span>
                    )}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-[#5a7a5a] mb-3">
                {t('bal.upTo')} {plan.maxInstances} {plan.maxInstances === 1 ? t('bal.instance') : t('bal.instances')}
              </p>

              <ul className="space-y-1.5 mb-4">
                {PLAN_FEATURES[key].map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[10px] text-[#6a8a6a]">
                    <CheckCircle2 size={10} className="mt-0.5 shrink-0" style={{ color: meta.color }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(key)}
                disabled={isCurrent || paying !== null}
                className="w-full py-2 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{
                  background: isCurrent || meta.popular ? meta.color : "transparent",
                  color: isCurrent || meta.popular ? "#000" : meta.color,
                  border: isCurrent || meta.popular ? "none" : `1px solid ${meta.color}40`,
                }}
              >
                {paying === key ? (
                  <><Loader2 size={11} className="animate-spin" /> {t('bal.redirecting')}</>
                ) : isCurrent ? (
                  t('bal.currentPlan')
                ) : (
                  <>{key === "free" ? t('bal.downgrade') : t('bal.choosePlan')} <ArrowRight size={11} /></>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {info && info.payments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "#111", border: "1px solid #1e1e1e" }}
        >
          <div className="px-5 py-3.5 border-b border-[#1a1a1a]">
            <h3 className="text-[13px] font-semibold text-white flex items-center gap-2">
              <CreditCard size={13} className="text-[#22c55e]" />
              {t('bal.paymentHistory')}
            </h3>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full data-table min-w-[360px]">
            <thead>
              <tr>
                <th className="text-left">{t('bal.col.plan')}</th>
                <th className="text-left">{t('bal.col.amount')}</th>
                <th className="text-left">{t('bal.col.status')}</th>
                <th className="text-left">{t('bal.col.date')}</th>
              </tr>
            </thead>
            <tbody>
              {info.payments.map((p) => (
                <tr key={p.id}>
                  <td className="capitalize text-white">{p.plan}</td>
                  <td style={{ color: "#22c55e" }}>{p.amount.toLocaleString("fr-FR")} {p.currency}</td>
                  <td>
                    <span className={`text-[10px] font-medium ${p.status === "success" ? "text-[#22c55e]" : p.status === "pending" ? "text-yellow-400" : "text-red-400"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="text-[#5a7a5a] text-[11px]">
                    {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
