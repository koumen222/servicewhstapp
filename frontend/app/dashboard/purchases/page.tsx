"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { subscriptionsApi } from "@/lib/api";
import type { Payment } from "@/lib/types";

const STATUS = {
  completed: { label: "Payé", color: "#22c55e", icon: CheckCircle2 },
  pending: { label: "En attente", color: "#f59e0b", icon: Clock },
  failed: { label: "Échoué", color: "#ef4444", icon: XCircle },
};

export default function PurchasesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

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
        style={{ background: "#111", border: "1px solid #1e1e1e" }}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a1a1a]">
          <ShoppingBag size={16} className="text-[#22c55e]" />
          <h2 className="text-[13px] font-semibold text-white">
            Historique des achats
          </h2>
        </div>

        {loading ? (
          <div className="px-5 py-10 flex items-center justify-center">
            <Loader2 size={20} className="text-[#22c55e] animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-[#5a7a5a]">Aucun achat pour le moment.</p>
          </div>
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">INVOICE</th>
                <th className="text-left">PLAN</th>
                <th className="text-left">AMOUNT</th>
                <th className="text-left">DATE</th>
                <th className="text-left">STATUS</th>
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
                    <td className="font-medium text-white capitalize">
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
                        Download
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
