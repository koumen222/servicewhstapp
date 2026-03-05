"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, CheckCircle2, Smartphone, Loader2, AlertCircle } from "lucide-react";
import { instanceApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Instance } from "@/lib/types";

interface QRScannerModalProps {
  instance: Instance | null;
  onClose: () => void;
}

export function QRScannerModal({ instance, onClose }: QRScannerModalProps) {
  const [qrData, setQrData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected">("disconnected");

  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);
  const qrRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (statusPollingRef.current) clearInterval(statusPollingRef.current);
      if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
    };
  }, []);

  const fetchQR = useCallback(async () => {
    if (!instance) return;
    setLoading(true);
    setError(null);
    try {
      const res = await instanceApi.getQRCode(instance.instanceName);
      if (!mountedRef.current) return;

      if (!res.data?.success) {
        setError(res.data?.message || "Failed to get QR code");
        return;
      }
      const qr = res.data.data?.qrCode;
      if (qr) {
        setQrData(qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`);
      } else {
        setError("QR code not available. Instance may already be connected.");
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      const msg = err?.response?.data?.message || "Failed to load QR code. Is the instance running?";
      console.error("Frontend error:", err);
      setError(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [instance]);

  // Poll status every 5 seconds — only check state=open
  const startStatusPolling = useCallback(() => {
    if (!instance || statusPollingRef.current) return;

    const pollStatus = async () => {
      if (!mountedRef.current || connected) return;
      try {
        const res = await instanceApi.getStatus(instance.instanceName);
        if (!mountedRef.current) return;

        if (!res.data?.success) return;
        const status = res.data.data?.status;

        if (status === "connected") {
          setConnectionState("connected");
          setConnected(true);
          if (statusPollingRef.current) clearInterval(statusPollingRef.current);
          if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
        } else if (status === "connecting") {
          setConnectionState("connecting");
        } else {
          setConnectionState("disconnected");
        }
      } catch {
        // Silent — keep polling
      }
    };

    statusPollingRef.current = setInterval(pollStatus, 5000);
  }, [instance, connected]);

  useEffect(() => {
    if (!instance) return;

    setQrData(null);
    setError(null);
    setConnected(false);
    setConnectionState("disconnected");

    fetchQR();
    startStatusPolling();

    // Also refresh QR every 30s while waiting
    qrRefreshRef.current = setInterval(() => {
      if (!connected && mountedRef.current) fetchQR();
    }, 30_000);

    return () => {
      if (statusPollingRef.current) { clearInterval(statusPollingRef.current); statusPollingRef.current = null; }
      if (qrRefreshRef.current) { clearInterval(qrRefreshRef.current); qrRefreshRef.current = null; }
    };
  }, [instance?.id]);

  if (!instance) return null;

  const statusDot = {
    connected: "bg-[#22c55e]",
    connecting: "bg-[#f59e0b] animate-pulse",
    disconnected: "bg-[#6b7280]",
  }[connectionState];

  const statusText = {
    connected: "🟢 Connected!",
    connecting: "🟡 Waiting for scan…",
    disconnected: "Scan the QR code to connect",
  }[connectionState];

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

            {/* Status pill */}
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("w-2 h-2 rounded-full shrink-0", statusDot)} />
              <span className="text-[11px] text-[#5a7a5a]">{statusText}</span>
            </div>

            {/* QR area */}
            <div
              className="relative flex items-center justify-center rounded-xl overflow-hidden"
              style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", minHeight: 240 }}
            >
              {loading && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={28} className="text-[#22c55e] animate-spin" />
                  <p className="text-xs text-[#5a7a5a]">Loading QR…</p>
                </div>
              )}

              {!loading && error && !connected && (
                <div className="flex flex-col items-center gap-2 px-6 text-center">
                  <AlertCircle size={24} className="text-red-400" />
                  <p className="text-xs text-red-400">{error}</p>
                  <button
                    onClick={fetchQR}
                    className="mt-1 text-[11px] text-[#22c55e] hover:text-[#4ade80] flex items-center gap-1"
                  >
                    <RefreshCw size={10} /> Try again
                  </button>
                </div>
              )}

              {!loading && connected && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <CheckCircle2 size={48} className="text-[#22c55e]" />
                  <p className="text-sm font-bold text-[#22c55e]">Connected!</p>
                  <p className="text-xs text-[#5a7a5a]">WhatsApp linked successfully.</p>
                </motion.div>
              )}

              {!loading && !error && !connected && qrData && (
                <img
                  src={qrData}
                  alt="QR Code"
                  className="w-52 h-52 object-contain p-2"
                  style={{ imageRendering: "pixelated" }}
                />
              )}
            </div>

            <p className="mt-2 text-center text-[10px] text-[#3a5a3a]">
              {connected ? "Connected! You can close this window." : "Status checks every 5s · QR refreshes every 30s"}
            </p>
          </div>

          {/* Footer */}
          <div className="px-5 pb-4 flex gap-2">
            {!connected && (
              <button
                onClick={fetchQR}
                disabled={loading}
                className="btn-ghost flex-1 flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                Refresh QR
              </button>
            )}
            <button onClick={onClose} className={cn("btn-green", connected ? "w-full" : "flex-1")}>
              {connected ? "Done ✓" : "Done"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
