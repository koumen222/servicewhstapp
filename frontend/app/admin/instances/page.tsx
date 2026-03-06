"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wifi, Search, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, timeAgo } from "@/lib/utils";
import type { Instance } from "@/lib/types";

const MOCK_ALL_INSTANCES: (Instance & { ownerEmail: string })[] = [
  {
    id: "i1",
    name: "Production Bot",
    instanceName: "alice_Production-Bot_001",
    status: "open",
    connectionStatus: "open",
    profileName: "Acme Support",
    ownerEmail: "alice@example.com",
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    apiKeys: [],
    quotas: [],
    stats: { messagesLast30Days: 1250, totalApiKeys: 2 },
  },
  {
    id: "i2",
    name: "Support Chat",
    instanceName: "bob_Support-Chat_002",
    status: "expired",
    connectionStatus: "expired",
    profileName: null,
    ownerEmail: "bob@example.com",
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    apiKeys: [],
    quotas: [],
    stats: { messagesLast30Days: 0, totalApiKeys: 1 },
  },
  {
    id: "i3",
    name: "Marketing Bot",
    instanceName: "carol_Marketing-Bot_003",
    status: "close",
    connectionStatus: "close",
    profileName: null,
    ownerEmail: "carol@example.com",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    apiKeys: [],
    quotas: [],
    stats: { messagesLast30Days: 0, totalApiKeys: 1 },
  },
];

export default function AdminInstancesPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_ALL_INSTANCES.filter(
    (i) =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.ownerEmail.toLowerCase().includes(search.toLowerCase()) ||
      i.instanceName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <Wifi size={15} className="text-[#22c55e]" />
            All Instances
            <span className="text-[12px] text-[#4a6a4a] font-normal">
              ({MOCK_ALL_INSTANCES.length} total)
            </span>
          </h2>
          <p className="text-[12px] text-[#5a7a5a] mt-0.5">
            Monitor all WhatsApp instances across all users.
          </p>
        </div>
        <button className="btn-ghost flex items-center gap-1.5">
          <RefreshCw size={13} />
          Refresh
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: MOCK_ALL_INSTANCES.length, color: "#22c55e" },
          { label: "Connected", value: MOCK_ALL_INSTANCES.filter(i => i.connectionStatus === "open").length, color: "#22c55e" },
          { label: "Expired", value: MOCK_ALL_INSTANCES.filter(i => i.connectionStatus === "expired").length, color: "#ef4444" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-3.5"
            style={{ background: "#111", border: "1px solid #1e1e1e" }}
          >
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
            <p className="text-[11px] text-[#5a7a5a] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a4a]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher des instances…"
          className="input-dark w-full pl-8 text-xs h-8"
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111", border: "1px solid #1e1e1e" }}
      >
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="text-left">Instance</th>
              <th className="text-left">Owner</th>
              <th className="text-left">Status</th>
              <th className="text-left">Messages (30d)</th>
              <th className="text-left">Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((inst) => (
              <tr key={inst.id}>
                <td>
                  <div>
                    <p className="text-[12px] font-medium text-white">
                      {inst.name}
                    </p>
                    <p className="text-[10px] text-[#4a6a4a] font-mono truncate max-w-[200px]">
                      {inst.instanceName}
                    </p>
                  </div>
                </td>
                <td className="text-[11px] text-[#5a7a5a]">
                  {inst.ownerEmail}
                </td>
                <td>
                  <StatusBadge status={(inst.connectionStatus ?? inst.status) as Instance["status"]} size="sm" />
                </td>
                <td className="text-[#5a7a5a]">
                  {inst.stats?.messagesLast30Days ?? 0}
                </td>
                <td className="text-[#5a7a5a] text-[11px]">
                  {timeAgo(inst.createdAt)}
                </td>
                <td>
                  <button className="text-[11px] text-red-400 hover:text-red-300 transition-colors">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
