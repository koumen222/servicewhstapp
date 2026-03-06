"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, CheckCircle2, Smartphone, Loader2, AlertCircle, QrCode } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Instance } from "@/lib/types";

interface QRScannerModalProps {
  instance: Instance | null;
  onClose: () => void;
}

export function QRScannerModal({ instance, onClose }: QRScannerModalProps) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const fetchIdRef = useRef(0);
  const statusPollRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const connectedRef = useRef(false);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  function stopStatusPolling() {
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }
  }

  async function checkConnectionStatus(instanceName: string) {
    if (!mountedRef.current || connectedRef.current) return;

    try {
      const res = await api.post(`/api/check-connection/${encodeURIComponent(instanceName)}`);
      const isConnected = Boolean(res.data?.connected) || res.data?.status === "open";

      if (isConnected) {
        if (!mountedRef.current) return;
        setConnected(true);
        setError(null);
        stopStatusPolling();
      }
    } catch {
      // Silent: keep polling while user is on modal
    }
  }

  function startStatusPolling(instanceName: string) {
    stopStatusPolling();
    void checkConnectionStatus(instanceName);
    statusPollRef.current = setInterval(() => {
      void checkConnectionStatus(instanceName);
    }, 5000);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopStatusPolling();
    };
  }, []);

  useEffect(() => {
    if (!instance) return;
    setQrSrc(null);
    setError(null);
    setLoading(false);
    setConnected(false);
    connectedRef.current = false;
    stopStatusPolling();
  }, [instance?.id]);

  if (!instance) return null;

  async function handleFetchQR() {
    if (!instance?.instanceName) return;

    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    setConnected(false);
    connectedRef.current = false;

    try {
      const res = await api.get(`/api/instances/${encodeURIComponent(instance.instanceName)}/qr-code`, { timeout: 20000 });
      if (id !== fetchIdRef.current) return; // stale

      const qr = res.data?.data?.qrCode;
      if (qr) {
        setQrSrc(qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`);
        startStatusPolling(instance.instanceName);
      } else {
        setError("QR code non disponible. L'instance est peut-être déjà connectée.");
      }
    } catch (err: any) {
      if (id !== fetchIdRef.current) return; // stale
      const msg = err?.response?.data?.message || err?.message || "Erreur lors du chargement du QR code";
      setError(msg);
    } finally {
      if (id === fetchIdRef.current) setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ background: "#111", border: "1px solid #1e1e1e", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
            <div>
              <h2 className="text-[14px] font-semibold text-white">Scan QR Code</h2>
              <p className="text-[11px] text-[#5a7a5a] mt-0.5">{instance.name}</p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-[#5a7a5a] hover:text-white hover:bg-[#1a1a1a] transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            {/* Instructions */}
            <div className="flex items-start gap-3 mb-4 p-3 rounded-lg bg-[#0d1f0d] border border-[#1a2e1a]">
              <Smartphone size={14} className="text-[#22c55e] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[#6a9a6a] leading-relaxed">
                Open WhatsApp → Linked Devices → Link a Device, then scan the QR code below.
              </p>
            </div>

            {/* QR area */}
            <div
              className="relative flex items-center justify-center rounded-xl overflow-hidden"
              style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", minHeight: 240 }}
            >
              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={28} className="text-[#22c55e] animate-spin" />
                  <p className="text-xs text-[#5a7a5a]">Génération du QR…</p>
                </div>
              )}

              {/* Connected */}
              {!loading && connected && (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <CheckCircle2 size={40} className="text-[#22c55e]" />
                  <p className="text-sm font-semibold text-[#22c55e]">Connexion réussie</p>
                  <p className="text-xs text-[#5a7a5a]">WhatsApp est connecté. Vous pouvez fermer cette fenêtre.</p>
                </div>
              )}

              {/* Error */}
              {!loading && !connected && error && (
                <div className="flex flex-col items-center gap-2 px-6 text-center">
                  <AlertCircle size={24} className="text-red-400" />
                  <p className="text-xs text-red-400">{error}</p>
                  <button
                    onClick={handleFetchQR}
                    className="mt-1 text-[11px] text-[#22c55e] hover:text-[#4ade80] flex items-center gap-1"
                  >
                    <RefreshCw size={10} /> Réessayer
                  </button>
                </div>
              )}

              {/* Initial state — no QR yet */}
              {!loading && !connected && !error && !qrSrc && (
                <div className="flex flex-col items-center gap-3 px-6 text-center py-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#0d1f0d", border: "1px solid #1a2e1a" }}>
                    <QrCode size={32} className="text-[#22c55e]" />
                  </div>
                  <p className="text-sm font-medium text-white">Prêt à scanner</p>
                  <button
                    onClick={handleFetchQR}
                    className="btn-green mt-2 flex items-center gap-2"
                  >
                    <QrCode size={14} />
                    Générer QR Code
                  </button>
                </div>
              )}

              {/* QR code displayed */}
              {!loading && !connected && !error && qrSrc && (
                <img
                  src={qrSrc}
                  alt="QR Code"
                  className="w-52 h-52 object-contain p-2"
                  style={{ imageRendering: "pixelated" }}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-4 flex gap-2">
            {qrSrc && !loading && !connected && (
              <button
                onClick={handleFetchQR}
                className="btn-ghost flex-1 flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={13} />
                Refresh QR
              </button>
            )}
            <button onClick={onClose} className={cn("btn-green", connected || !qrSrc || loading ? "w-full" : "flex-1")}>
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
