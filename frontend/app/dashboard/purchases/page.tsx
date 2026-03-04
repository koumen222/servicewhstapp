"use client";

import { motion } from "framer-motion";
import { ShoppingBag, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

const MOCK_PURCHASES = [
  { id: "1", plan: "Starter", amount: 9, status: "paid", date: new Date(Date.now() - 30 * 86400000).toISOString(), invoice: "INV-001" },
  { id: "2", plan: "Starter", amount: 9, status: "paid", date: new Date(Date.now() - 60 * 86400000).toISOString(), invoice: "INV-002" },
  { id: "3", plan: "Free", amount: 0, status: "paid", date: new Date(Date.now() - 90 * 86400000).toISOString(), invoice: "INV-003" },
];

const STATUS = {
  paid: { label: "Paid", color: "#22c55e", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#f59e0b", icon: Clock },
  failed: { label: "Failed", color: "#ef4444", icon: XCircle },
};

export default function PurchasesPage() {
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
            Purchase History
          </h2>
        </div>

        {MOCK_PURCHASES.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-[#5a7a5a]">No purchases yet.</p>
          </div>
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Invoice</th>
                <th className="text-left">Plan</th>
                <th className="text-left">Amount</th>
                <th className="text-left">Date</th>
                <th className="text-left">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {MOCK_PURCHASES.map((p) => {
                const s = STATUS[p.status as keyof typeof STATUS] ?? STATUS.paid;
                const Icon = s.icon;
                return (
                  <tr key={p.id}>
                    <td className="font-mono text-[#5a7a5a] text-[11px]">
                      {p.invoice}
                    </td>
                    <td className="font-medium text-white capitalize">
                      {p.plan}
                    </td>
                    <td>
                      <span style={{ color: "#22c55e" }} className="font-medium">
                        ${p.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-[#5a7a5a]">
                      {formatDate(p.date)}
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
