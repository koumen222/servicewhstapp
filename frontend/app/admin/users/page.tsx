"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Users, Search, Shield, UserX, UserCheck, RefreshCw, Loader2,
  ChevronDown, X, Check, AlertTriangle, Eye
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AdminUser {
  _id: string;
  email: string;
  name: string;
  plan: string;
  maxInstances: number;
  isActive: boolean;
  hasPaid: boolean;
  isPaidAccount: boolean;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  trialEndsAt?: string;
}

const PLAN_CONFIG: Record<string, { color: string; maxInstances: number }> = {
  basic: { color: "#22c55e", maxInstances: 1 },
  premium: { color: "#3b82f6", maxInstances: 999 },
};

const FILTER_OPTIONS = ["all", "active", "inactive", "basic", "premium"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTER_OPTIONS)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editMaxInstances, setEditMaxInstances] = useState(1);
  const [detailUser, setDetailUser] = useState<{ user: AdminUser; instances: any[]; stats: any } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const getToken = () => localStorage.getItem("adminToken");

  const fetchUsers = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        params: { page, limit: 50 },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setUsers(res.data.data.users || []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
        setTotal(res.data.data.pagination?.total || 0);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleToggleStatus(userId: string) {
    const token = getToken();
    if (!token) return;
    setActionLoading(userId);
    try {
      const res = await axios.put(
        `${API_URL}/api/admin/users/${userId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, isActive: res.data.data.isActive } : u
          )
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors du changement de statut");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUpdatePlan() {
    if (!editingUser) return;
    const token = getToken();
    if (!token) return;
    setActionLoading(editingUser._id);
    try {
      const res = await axios.put(
        `${API_URL}/api/admin/users/${editingUser._id}/plan`,
        { plan: editPlan, maxInstances: editMaxInstances },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === editingUser._id
              ? { ...u, plan: editPlan, maxInstances: editMaxInstances }
              : u
          )
        );
        setEditingUser(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de la mise à jour du plan");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleViewDetails(userId: string) {
    const token = getToken();
    if (!token) return;
    setDetailLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setDetailUser(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors du chargement des détails");
    } finally {
      setDetailLoading(false);
    }
  }

  function openEditModal(user: AdminUser) {
    setEditingUser(user);
    setEditPlan(user.plan);
    setEditMaxInstances(user.maxInstances);
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && u.isActive) ||
      (filter === "inactive" && !u.isActive) ||
      (filter === "basic" && u.plan === "basic") ||
      (filter === "premium" && u.plan === "premium");
    return matchesSearch && matchesFilter;
  });

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
            Utilisateurs
            <span className="text-[12px] text-[#4a6a4a] font-normal">
              ({total} total)
            </span>
          </h2>
          <p className="text-[12px] text-[#5a7a5a] mt-0.5">
            Gérez les utilisateurs, leurs plans et statuts depuis la base de données.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="btn-ghost flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Rafraîchir
        </button>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-2.5 text-[12px] text-red-400 flex items-center gap-2" style={{ background: "#1a0505", border: "1px solid #3b1111" }}>
          <AlertTriangle size={13} />
          {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={12} /></button>
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a4a]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="input-dark w-full pl-8 text-xs h-8"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-colors"
              style={{
                background: filter === f ? "#22c55e18" : "#111",
                color: filter === f ? "#22c55e" : "#5a7a5a",
                border: `1px solid ${filter === f ? "#22c55e30" : "#1e1e1e"}`,
              }}
            >
              {f === "all" ? "Tous" : f === "active" ? "Actifs" : f === "inactive" ? "Inactifs" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111", border: "1px solid #1e1e1e" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-[#22c55e]" />
            <span className="ml-2 text-[13px] text-[#5a7a5a]">Chargement des utilisateurs…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table min-w-[700px]">
              <thead>
                <tr>
                  <th className="text-left">Utilisateur</th>
                  <th className="text-left">Plan</th>
                  <th className="text-left">Max Instances</th>
                  <th className="text-left">Statut</th>
                  <th className="text-left">Paiement</th>
                  <th className="text-left">Inscrit le</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{
                            background: u.isActive ? "#0d2510" : "#1a0505",
                            color: u.isActive ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-white">{u.name}</p>
                          <p className="text-[10px] text-[#5a7a5a]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize"
                        style={{
                          background: `${PLAN_CONFIG[u.plan]?.color || "#666"}18`,
                          color: PLAN_CONFIG[u.plan]?.color || "#666",
                        }}
                      >
                        {u.plan}
                      </span>
                    </td>
                    <td className="text-[12px] text-[#5a7a5a]">{u.maxInstances}</td>
                    <td>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          background: u.isActive ? "#22c55e18" : "#ef444418",
                          color: u.isActive ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {u.isActive ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          background: u.hasPaid ? "#22c55e18" : "#f59e0b18",
                          color: u.hasPaid ? "#22c55e" : "#f59e0b",
                        }}
                      >
                        {u.hasPaid ? "Payé" : "Non payé"}
                      </span>
                    </td>
                    <td className="text-[#5a7a5a] text-[11px]">
                      {formatDate(u.createdAt)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleViewDetails(u._id)}
                          className="p-1 rounded hover:bg-[#1e1e1e] text-[#5a7a5a] hover:text-white transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-[11px] text-[#22c55e] hover:text-[#4ade80] transition-colors px-1.5 py-0.5 rounded hover:bg-[#22c55e10]"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u._id)}
                          disabled={actionLoading === u._id}
                          className="p-1 rounded transition-colors"
                          style={{
                            color: u.isActive ? "#ef4444" : "#22c55e",
                          }}
                          title={u.isActive ? "Désactiver" : "Activer"}
                        >
                          {actionLoading === u._id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : u.isActive ? (
                            <UserX size={13} />
                          ) : (
                            <UserCheck size={13} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-[#5a7a5a]">Aucun utilisateur trouvé.</p>
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded-lg text-[11px] font-medium transition-colors"
            style={{ background: "#111", color: page === 1 ? "#333" : "#5a7a5a", border: "1px solid #1e1e1e" }}
          >
            Précédent
          </button>
          <span className="text-[11px] text-[#5a7a5a]">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded-lg text-[11px] font-medium transition-colors"
            style={{ background: "#111", color: page === totalPages ? "#333" : "#5a7a5a", border: "1px solid #1e1e1e" }}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: total, color: "#22c55e" },
          { label: "Actifs", value: users.filter((u) => u.isActive).length, color: "#22c55e" },
          { label: "Premium", value: users.filter((u) => u.plan === "premium").length, color: "#3b82f6" },
          { label: "Inactifs", value: users.filter((u) => !u.isActive).length, color: "#ef4444" },
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

      {/* Edit Plan Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl p-6 w-full max-w-md space-y-5"
              style={{ background: "#111", border: "1px solid #1e1e1e" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-white">Modifier l&apos;utilisateur</h3>
                <button onClick={() => setEditingUser(null)} className="text-[#5a7a5a] hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-[12px] text-white font-medium">{editingUser.name}</p>
                <p className="text-[11px] text-[#5a7a5a]">{editingUser.email}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#5a7a5a] block mb-1">Plan</label>
                  <div className="flex gap-2">
                    {(["basic", "premium"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setEditPlan(p);
                          setEditMaxInstances(PLAN_CONFIG[p].maxInstances);
                        }}
                        className="flex-1 px-3 py-2 rounded-lg text-[12px] font-medium capitalize transition-all"
                        style={{
                          background: editPlan === p ? `${PLAN_CONFIG[p].color}20` : "#0a0a0a",
                          color: editPlan === p ? PLAN_CONFIG[p].color : "#5a7a5a",
                          border: `1px solid ${editPlan === p ? `${PLAN_CONFIG[p].color}40` : "#1e1e1e"}`,
                        }}
                      >
                        {editPlan === p && <Check size={11} className="inline mr-1" />}
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#5a7a5a] block mb-1">Max Instances</label>
                  <input
                    type="number"
                    min={1}
                    value={editMaxInstances}
                    onChange={(e) => setEditMaxInstances(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input-dark w-full text-xs h-8"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-3 py-2 rounded-lg text-[12px] font-medium text-[#5a7a5a] transition-colors hover:bg-[#1e1e1e]"
                  style={{ border: "1px solid #1e1e1e" }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdatePlan}
                  disabled={actionLoading === editingUser._id}
                  className="flex-1 px-3 py-2 rounded-lg text-[12px] font-semibold text-white transition-colors"
                  style={{ background: "#22c55e", opacity: actionLoading === editingUser._id ? 0.5 : 1 }}
                >
                  {actionLoading === editingUser._id ? (
                    <Loader2 size={13} className="animate-spin inline mr-1" />
                  ) : null}
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Detail Modal */}
      <AnimatePresence>
        {detailUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setDetailUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto"
              style={{ background: "#111", border: "1px solid #1e1e1e" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-white">Détails de l&apos;utilisateur</h3>
                <button onClick={() => setDetailUser(null)} className="text-[#5a7a5a] hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Nom", value: detailUser.user.name },
                  { label: "Email", value: detailUser.user.email },
                  { label: "Plan", value: detailUser.user.plan },
                  { label: "Max Instances", value: detailUser.user.maxInstances },
                  { label: "Statut", value: detailUser.user.isActive ? "Actif" : "Inactif" },
                  { label: "Paiement", value: detailUser.user.hasPaid ? "Payé" : "Non payé" },
                  { label: "Inscrit le", value: formatDate(detailUser.user.createdAt) },
                  { label: "Mis à jour", value: formatDate(detailUser.user.updatedAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg p-2.5" style={{ background: "#0a0a0a", border: "1px solid #1e1e1e" }}>
                    <p className="text-[10px] text-[#5a7a5a]">{label}</p>
                    <p className="text-[12px] text-white font-medium mt-0.5">{String(value)}</p>
                  </div>
                ))}
              </div>

              {/* Instance stats */}
              <div className="rounded-xl p-3" style={{ background: "#0a0a0a", border: "1px solid #1e1e1e" }}>
                <p className="text-[11px] text-[#5a7a5a] mb-2 font-medium">Instances WhatsApp</p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-lg font-bold text-[#22c55e]">{detailUser.stats?.totalInstances || 0}</p>
                    <p className="text-[10px] text-[#5a7a5a]">Total</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#3b82f6]">{detailUser.stats?.activeInstances || 0}</p>
                    <p className="text-[10px] text-[#5a7a5a]">Actives</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#f59e0b]">{detailUser.stats?.connectedInstances || 0}</p>
                    <p className="text-[10px] text-[#5a7a5a]">Connectées</p>
                  </div>
                </div>
              </div>

              {/* Instance list */}
              {detailUser.instances && detailUser.instances.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-[#5a7a5a] font-medium">Liste des instances</p>
                  {detailUser.instances.map((inst: any) => (
                    <div
                      key={inst._id}
                      className="rounded-lg p-2.5 flex items-center justify-between"
                      style={{ background: "#0a0a0a", border: "1px solid #1e1e1e" }}
                    >
                      <div>
                        <p className="text-[12px] text-white font-medium">{inst.instanceName}</p>
                        <p className="text-[10px] text-[#5a7a5a]">
                          Créée le {formatDate(inst.createdAt)}
                        </p>
                      </div>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          background: inst.status === "open" ? "#22c55e18" : "#ef444418",
                          color: inst.status === "open" ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {inst.status || "unknown"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail loading overlay */}
      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Loader2 size={24} className="animate-spin text-[#22c55e]" />
        </div>
      )}
    </div>
  );
}
