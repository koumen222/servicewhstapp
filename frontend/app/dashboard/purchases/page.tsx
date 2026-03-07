"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { subscriptionsApi } from "@/lib/api";
import type { Payment } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export default function PurchasesPage() {
  const { t } = useI18n();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const STATUS = {
    completed: { label: t('purch.paid'), color: "#22c55e", icon: CheckCircle2 },
    pending: { label: t('purch.pending'), color: "#f59e0b", icon: Clock },
    failed: { label: t('purch.failed'), color: "#ef4444", icon: XCircle },
  };

  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await subscriptionsApi.getMySubscription();
        if (res.data?.payments) {
          setPayments(res.data.payments);
        }
      } catch (error) {
        console.error("Failed to load payments:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  return (
    <div className="max-w-3xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
      >
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <ShoppingBag size={16} className="text-[#22c55e]" />
          <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('purch.title')}
          </h2>
        </div>

        {loading ? (
          <div className="px-5 py-10 flex items-center justify-center">
            <Loader2 size={20} className="text-[#22c55e] animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-[#5a7a5a]">{t('purch.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full data-table min-w-[480px]">
            <thead>
              <tr>
                <th className="text-left">{t('purch.col.invoice')}</th>
                <th className="text-left">{t('purch.col.plan')}</th>
                <th className="text-left">{t('purch.col.amount')}</th>
                <th className="text-left">{t('purch.col.date')}</th>
                <th className="text-left">{t('purch.col.status')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const s = STATUS[p.status as keyof typeof STATUS] ?? STATUS.completed;
                const Icon = s.icon;
                return (
                  <tr key={p.id}>
                    <td className="font-mono text-[#5a7a5a] text-[11px]">
                      {p.externalRef || p.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                      {p.plan}
                    </td>
                    <td>
                      <span style={{ color: "#22c55e" }} className="font-medium">
                        {p.amount.toLocaleString("fr-FR")} {p.currency}
                      </span>
                    </td>
                    <td className="text-[#5a7a5a]">
                      {formatDate(p.createdAt)}
                    </td>
                    <td>
                      <span
                        className="flex items-center gap-1 text-[11px] font-medium"
                        style={{ color: s.color }}
                      >
                        <Icon size={11} />
                        {s.label}
                      </span>
                    </td>
                    <td>
                      <button className="text-[11px] text-[#22c55e] hover:text-[#4ade80] transition-colors">
                        {t('purch.download')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
