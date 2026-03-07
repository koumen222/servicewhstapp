"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { useAppStore } from "@/store/useStore";
import { instancesApi } from "@/lib/api";
import { InstanceCard } from "@/components/InstanceCard";
import { QRScannerModal } from "@/components/QRScannerModal";
import { CreateInstanceModal } from "@/components/CreateInstanceModal";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Instance, InstanceStatus } from "@/lib/types";

const MOCK_INSTANCES: Instance[] = [];

type FilterStatus = "all" | InstanceStatus;

export default function InstancesPage() {
  const { user, instances, setInstances, addInstance, removeInstance, instancesLoaded, setInstancesLoaded, isLoadingInstances } =
    useAppStore();
  const { t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [qrInstance, setQrInstance] = useState<Instance | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Instance | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  async function loadInstances(showSpinner = true) {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await instancesApi.getAll();
      const data = res.data?.data?.instances ?? [];
      setInstances(data);
      setInstancesLoaded(true);
    } catch (error) {
      console.error('Load instances error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // Ne recharger que si pas encore chargé (le layout charge en premier)
    if (!instancesLoaded && !isLoadingInstances) {
      loadInstances();
    }
  }, []);

  async function handleDelete(instance: Instance) {
    if (!deleteConfirm) {
      setDeleteConfirm(instance);
      return;
    }
    try {
      // Use instanceName for MongoDB API instead of id
      await instancesApi.delete(instance.instanceName);
      removeInstance(instance.id);
    } catch (err: any) {
      console.error('[DELETE] Failed to delete instance:', err?.response?.data || err?.message);
      // Reload from server to get the real state
      loadInstances(false);
    } finally {
      setDeleteConfirm(null);
    }
  }


  const filtered = instances.filter((i) => {
    const matchSearch =
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.instanceName.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" ||
      i.status === filterStatus ||
      i.connectionStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const canCreate = instances.length < (user?.maxInstances ?? 1);

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("inst.title")}
            <span className="ml-2 text-[12px] font-normal" style={{ color: "var(--text-muted)" }}>
              {instances.length}/{user?.maxInstances ?? 1}
            </span>
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {t("inst.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadInstances(false)}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {t("inst.refresh")}
          </button>

          <button
            onClick={() => setShowCreate(true)}
            disabled={!canCreate}
            title={!canCreate ? t("inst.maxPlan").replace("{max}", String(user?.maxInstances)) : undefined}
            className={cn(
              "btn-green flex items-center gap-1.5",
              !canCreate && "opacity-50 cursor-not-allowed hover:bg-[#22c55e] hover:shadow-none hover:transform-none"
            )}
          >
            <Plus size={14} />
            {t("inst.create")}
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5">
        {/* Row 1: Search + View mode */}
        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a4a]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("inst.search")}
              className="input-dark w-full pl-8 text-xs h-8"
            />
          </div>

          {/* View mode */}
          <div className="flex items-center gap-1 p-1 rounded-lg shrink-0" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid" ? "text-[#22c55e]" : "hover:text-white"
              )}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list" ? "text-[#22c55e]" : "hover:text-white"
              )}
            >
              <List size={13} />
            </button>
          </div>
        </div>

        {/* Status filter — scrollable on mobile */}
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 p-1 rounded-lg w-max" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            {(["all", "open", "close", "expired", "connecting"] as FilterStatus[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 whitespace-nowrap",
                    filterStatus === s
                      ? "text-[#22c55e]"
                      : "hover:text-white"
                  )}
                >
                  {s === "open" ? t("inst.filterConnected") : s === "close" ? t("inst.filterDisconnected") : s === "all" ? t("inst.filterAll") : s === "expired" ? t("inst.filterExpired") : t("inst.filterConnecting")}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-[#22c55e] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          {search || filterStatus !== "all" ? (
            <>
              <div
                className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: "var(--border-subtle)" }}
              >
                <Filter size={20} className="text-[#4a6a4a]" />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                {t("inst.noMatch")}
              </p>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                {t("inst.noMatch.desc")}
              </p>
              <button
                onClick={() => { setSearch(""); setFilterStatus("all"); }}
                className="mt-3 text-[11px] text-[#22c55e] hover:text-[#4ade80]"
              >
                {t("inst.clearFilters")}
              </button>
            </>
          ) : (
            <>
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "var(--green-bg-subtle)", border: "1px solid var(--green-border-subtle)" }}
              >
                <Plus size={24} className="text-[#22c55e]" />
              </div>
              <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {t("inst.empty")}
              </p>
              <p className="text-[13px] mb-5 max-w-xs" style={{ color: "var(--text-muted)" }}>
                {t("inst.empty.desc")}
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-green flex items-center gap-2"
              >
                <Plus size={14} />
                {t("inst.create")}
              </button>
            </>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                : "space-y-3"
            )}
          >
            {filtered.map((inst) => (
              <InstanceCard
                key={inst.id}
                instance={inst}
                onQRCode={setQrInstance}
                onDelete={() => handleDelete(inst)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Delete confirm dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ scale: 0.93, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 12 }}
              className="w-full max-w-sm rounded-2xl p-5"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
            >
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {t("inst.deleteTitle")}
              </h3>
              <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--text-primary)" }} className="font-medium">{deleteConfirm.name}</span>{" "}
                {t("inst.deleteDesc")}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-ghost flex-1"
                >
                  {t("inst.cancel")}
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/25 transition-colors"
                >
                  {t("inst.delete")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <QRScannerModal instance={qrInstance} onClose={() => setQrInstance(null)} />
      {showCreate && (
        <CreateInstanceModal
          onClose={() => {
            setShowCreate(false);
            loadInstances(false);
          }}
          onCreated={(inst) => {
            addInstance(inst);
          }}
        />
      )}
    </>
  );
}
