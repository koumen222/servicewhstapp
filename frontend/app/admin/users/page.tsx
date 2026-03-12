"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search, Shield, UserX, RefreshCw, Loader2 } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";
import type { User } from "@/lib/types";

const MOCK_USERS: (User & { instanceCount: number; lastLogin: string })[] = [
  {
    id: "1",
    name: "Alice Martin",
    email: "alice@example.com",
    role: "user",
    plan: "premium",
    maxInstances: 999,
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    instanceCount: 4,
    lastLogin: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "2",
    name: "Bob Chen",
    email: "bob@example.com",
    role: "user",
    plan: "basic",
    maxInstances: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    instanceCount: 1,
    lastLogin: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "3",
    name: "Carol Davis",
    email: "carol@example.com",
    role: "user",
    plan: "basic",
    maxInstances: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    instanceCount: 1,
    lastLogin: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
  {
    id: "4",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    plan: "premium",
    maxInstances: 999,
    isActive: true,
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
    instanceCount: 0,
    lastLogin: new Date(Date.now() - 1800000).toISOString(),
  },
];

const PLAN_COLOR: Record<string, string> = {
  basic: "#22c55e",
  premium: "#3b82f6",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start sm:items-center justify-between gap-3 flex-wrap"
      >
        <div>
          <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
            <Users size={15} className="text-[#22c55e]" />
            Users
            <span className="text-[12px] text-[#4a6a4a] font-normal">
              ({users.length} total)
            </span>
          </h2>
          <p className="text-[12px] text-[#5a7a5a] mt-0.5">
            Manage registered users and their subscription plans.
          </p>
        </div>
        <button
          onClick={() => setLoading(true)}
          disabled={loading}
          className="btn-ghost flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a4a]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher des utilisateurs…"
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
        <div className="overflow-x-auto">
        <table className="w-full data-table min-w-[580px]">
          <thead>
            <tr>
              <th className="text-left">User</th>
              <th className="text-left">Role</th>
              <th className="text-left">Plan</th>
              <th className="text-left">Instances</th>
              <th className="text-left">Joined</th>
              <th className="text-left">Last Login</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{
                        background: u.role === "admin" ? "#1a0505" : "#0d2510",
                        color: u.role === "admin" ? "#ef4444" : "#22c55e",
                      }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-white">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-[#5a7a5a]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  {u.role === "admin" ? (
                    <span className="flex items-center gap-1 text-[11px] text-red-400">
                      <Shield size={10} /> Admin
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#5a7a5a]">User</span>
                  )}
                </td>
                <td>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize"
                    style={{
                      background: `${PLAN_COLOR[u.plan ?? "basic"]}18`,
                      color: PLAN_COLOR[u.plan ?? "basic"],
                    }}
                  >
                    {u.plan}
                  </span>
                </td>
                <td className="text-[#5a7a5a]">
                  {u.instanceCount} / {u.maxInstances}
                </td>
                <td className="text-[#5a7a5a] text-[11px]">
                  {formatDate(u.createdAt ?? "")}
                </td>
                <td className="text-[#5a7a5a] text-[11px]">
                  {formatDate(u.lastLogin)}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button className="text-[11px] text-[#22c55e] hover:text-[#4ade80] transition-colors">
                      Edit
                    </button>
                    {u.role !== "admin" && (
                      <button className="text-[#3a5a3a] hover:text-red-400 transition-colors">
                        <UserX size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        </div>
        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-[#5a7a5a]">No users match your search.</p>
          </div>
        )}
      </motion.div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: users.length, color: "#22c55e" },
          { label: "Premium Plan", value: users.filter(u => u.plan === "premium").length, color: "#3b82f6" },
          { label: "Basic Plan", value: users.filter(u => u.plan === "basic").length, color: "#22c55e" },
          { label: "Admins", value: users.filter(u => u.role === "admin").length, color: "#ef4444" },
        ].map(({ label, value, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-3.5"
            style={{ background: "#111", border: "1px solid #1e1e1e" }}
          >
            <p className="text-xl font-bold" style={{ color }}>
              {value}
            </p>
            <p className="text-[11px] text-[#5a7a5a] mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
