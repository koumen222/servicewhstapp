"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, CheckCircle2, Smartphone, Loader2 } from "lucide-react";
import { instancesApi } from "@/lib/api";
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

  const fetchQR = useCallback(async () => {
    if (!instance) return;
    setLoading(true);
    setError(null);
    try {
      const res = await instancesApi.getQRCode(instance.id);
      const data = res.data?.data;
      if (data?.qrCode) {
        setQrData(
          data.qrCode.startsWith("data:")
            ? data.qrCode
            : `data:image/png;base64,${data.qrCode}`
        );
      } else {
        setError("QR code not available. Instance may already be connected.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error && (err as any)?.response?.data?.message
          ? (err as any).response.data.message
          : "Failed to load QR code. Is the instance running?";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [instance]);

  useEffect(() => {
    if (instance) {
      setQrData(null);
      setError(null);
      setConnected(false);
      fetchQR();
    }
  }, [instance, fetchQR]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!instance || connected) return;
    const t = setInterval(fetchQR, 30_000);
    return () => clearInterval(t);
  }, [instance, connected, fetchQR]);

  if (!instance) return null;

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
          style={{
            background: "#111",
            border: "1px solid #1e1e1e",
            boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
            <div>
              <h2 className="text-[14px] font-semibold text-white">
                Scan QR Code
              </h2>
              <p className="text-[11px] text-[#5a7a5a] mt-0.5">
                {instance.name}
              </p>
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
                Open WhatsApp → Linked Devices → Link a Device, then scan the QR
                code below.
              </p>
            </div>

            {/* QR area */}
            <div
              className="relative flex items-center justify-center rounded-xl overflow-hidden"
              style={{
                background: "#0a0a0a",
                border: "1px solid #1e1e1e",
                minHeight: 240,
              }}
            >
              {loading && (
                <div className="flex flex-col items-center gap-2">
                  <Loader2
                    size={28}
                    className="text-[#22c55e] animate-spin"
                  />
                  <p className="text-xs text-[#5a7a5a]">Loading QR…</p>
                </div>
              )}

              {!loading && error && (
                <div className="flex flex-col items-center gap-2 px-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-1">
                    <X size={18} className="text-red-400" />
                  </div>
                  <p className="text-xs text-red-400">{error}</p>
                  <button
                    onClick={fetchQR}
                    className="mt-1 text-[11px] text-[#22c55e] hover:text-[#4ade80] flex items-center gap-1"
                  >
                    <RefreshCw size={10} /> Try again
                  </button>
                </div>
              )}

              {!loading && !error && connected && (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 size={40} className="text-[#22c55e]" />
                  <p className="text-sm font-semibold text-[#22c55e]">
                    Connected!
                  </p>
                  <p className="text-xs text-[#5a7a5a]">
                    WhatsApp linked successfully.
                  </p>
                </div>
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

            {/* Auto-refresh note */}
            {!connected && (
              <p className="mt-2 text-center text-[10px] text-[#3a5a3a]">
                QR code refreshes every 30 seconds
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-4 flex gap-2">
            <button
              onClick={fetchQR}
              disabled={loading}
              className="btn-ghost flex-1 flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button onClick={onClose} className="btn-green flex-1">
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
