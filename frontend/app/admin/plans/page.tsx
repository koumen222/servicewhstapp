"use client";

import { motion } from "framer-motion";
import { CreditCard, Plus, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";

const PLANS = [
  {
    id: "1",
    name: "Basic",
    price: 3000,
    maxInstances: 1,
    maxMessages: 999999,
    features: ["1 instance", "Envois illimités", "Accès API REST", "Webhooks", "Support email"],
    color: "#22c55e",
    active: true,
    users: 0,
  },
  {
    id: "2",
    name: "Premium",
    price: 10000,
    maxInstances: 999,
    maxMessages: 999999,
    features: ["Instances illimitées", "Envois illimités", "Accès API REST", "Webhooks", "Support prioritaire"],
    color: "#3b82f6",
    active: true,
    users: 0,
  },
];

export default function AdminPlansPage() {
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <CreditCard size={15} className="text-[#22c55e]" />
            Plans Management
          </h2>
          <p className="text-[12px] text-[#5a7a5a] mt-0.5">
            Configure subscription plans and pricing.
          </p>
        </div>
        <button className="btn-green flex items-center gap-1.5">
          <Plus size={13} />
          New plan
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-5 relative"
            style={{
              background: "#111",
              border: `1px solid ${plan.color}30`,
            }}
          >
            {/* Active badge */}
            <div
              className="absolute top-3 right-3 w-2 h-2 rounded-full"
              style={{ background: plan.active ? "#22c55e" : "#ef4444" }}
              title={plan.active ? "Active" : "Inactive"}
            />

            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${plan.color}18` }}
            >
              <CreditCard size={16} style={{ color: plan.color }} />
            </div>

            <p className="text-[13px] font-bold text-white">{plan.name}</p>
            <div className="flex items-end gap-0.5 my-1.5">
              <span className="text-xl font-extrabold" style={{ color: plan.color }}>
                ${plan.price}
              </span>
              <span className="text-[10px] text-[#5a7a5a] mb-0.5">/mo</span>
            </div>

            <div className="space-y-0.5 mb-3">
              <p className="text-[11px] text-[#5a7a5a]">
                {plan.maxInstances} instances
              </p>
              <p className="text-[11px] text-[#5a7a5a]">
                {formatNumber(plan.maxMessages)} msgs/mo
              </p>
            </div>

            <ul className="space-y-1 mb-4">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-1.5 text-[10px] text-[#6a8a6a]"
                >
                  <CheckCircle2 size={10} style={{ color: plan.color }} />
                  {f}
                </li>
              ))}
            </ul>

            <div
              className="px-2.5 py-1.5 rounded-lg mb-3 flex items-center justify-between"
              style={{ background: "#0a0a0a" }}
            >
              <span className="text-[10px] text-[#5a7a5a]">Active users</span>
              <span className="text-[11px] font-bold" style={{ color: plan.color }}>
                {plan.users}
              </span>
            </div>

            <div className="flex gap-2">
              <button className="btn-ghost text-xs flex-1 flex items-center justify-center gap-1">
                <Edit2 size={11} /> Edit
              </button>
              <button className="flex items-center justify-center w-7 h-7 rounded-lg text-[#3a5a3a] hover:text-red-400 hover:bg-[#1a0a0a] transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
