"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Plus,
  Loader2,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  QrCode,
  Smartphone,
  RefreshCw,
  Phone,
  AlertCircle,
} from "lucide-react";
import { instancesApi, instanceApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { Instance } from "@/lib/types";

const schema = z.object({
  customName: z
    .string()
    .min(3, "Minimum 3 characters")
    .max(30, "Maximum 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, underscores and hyphens"),
  integration: z.enum(["WHATSAPP-BAILEYS", "WHATSAPP-BUSINESS"]).optional(),
});

type FormData = z.infer<typeof schema>;
type Step = "form" | "choose" | "qr" | "phone" | "connected";

interface CreateInstanceModalProps {
  onClose: () => void;
  onCreated: (instance: Instance) => void;
}

export function CreateInstanceModal({ onClose, onCreated }: CreateInstanceModalProps) {
  const { user } = useAppStore();
  const [step, setStep] = useState<Step>("form");
  const [instance, setInstance] = useState<Instance | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  // QR state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  // Phone state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  // Status polling
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { integration: "WHATSAPP-BAILEYS" },
  });

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Poll connection status every 5s when in QR or phone step
  const startStatusPolling = useCallback((instanceName: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await instanceApi.getStatus(instanceName);
        if (!res.data?.success) return;
        const status = res.data.data?.status;
        if (!mountedRef.current) return;
        if (status === "connected") {
          setConnectionStatus("connected");
          setStep("connected");
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (status === "connecting") {
          setConnectionStatus("connecting");
        } else {
          setConnectionStatus("disconnected");
        }
      } catch {
        // silent — keep polling
      }
    };

    poll(); // immediate
    pollingRef.current = setInterval(poll, 5000);
  }, []);

  async function onSubmit(data: FormData) {
    try {
      const res = await instancesApi.create(data.customName, data.integration);
      const result = res.data;

      if (!result?.success) {
        setError("customName", { message: result?.message || "Failed to create instance" });
        return;
      }

      const d = result.data;
      const newInstance: Instance = {
        id: d.instance.id,
        name: d.instance.name,
        instanceName: d.instance.instanceName,
        status: "close",
        connectionStatus: "close",
        createdAt: d.instance.createdAt,
        apiKeys: [],
        quotas: [],
        stats: { messagesLast30Days: 0, totalApiKeys: 1 },
      };

      setInstance(newInstance);
      setApiKey(d.apiKey?.key ?? "");
      setStep("choose");
      onCreated(newInstance);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to create instance";
      console.error("Frontend error:", err);
      setError("customName", { message: msg });
    }
  }

  async function handleChooseQR() {
    if (!instance) return;
    setStep("qr");
    setQrLoading(true);
    setQrError(null);
    try {
      const res = await instanceApi.getQRCode(instance.name);
      if (!res.data?.success) {
        setQrError(res.data?.message || "Failed to get QR code");
        return;
      }
      const qr = res.data.data?.qrCode;
      if (qr) {
        setQrCode(qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`);
        startStatusPolling(instance.name);
      } else {
        setQrError("QR code not available. Instance may already be connected.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to load QR code";
      console.error("Frontend error:", err);
      setQrError(msg);
    } finally {
      setQrLoading(false);
    }
  }

  async function refreshQR() {
    if (!instance) return;
    setQrLoading(true);
    setQrError(null);
    try {
      const res = await instanceApi.getQRCode(instance.name);
      if (!res.data?.success) { setQrError(res.data?.message || "Failed"); return; }
      const qr = res.data.data?.qrCode;
      if (qr) setQrCode(qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`);
    } catch (err: any) {
      setQrError(err?.response?.data?.message || "Failed to refresh QR code");
    } finally {
      setQrLoading(false);
    }
  }

  async function handleConnectPhone() {
    if (!instance || !phoneNumber.trim()) return;
    setPhoneLoading(true);
    setPhoneError(null);
    try {
      const res = await instanceApi.connectPhone(instance.name, phoneNumber.trim());
      if (!res.data?.success) {
        setPhoneError(res.data?.message || "Failed to generate pairing code");
        return;
      }
      setPairingCode(res.data.data?.pairingCode);
      startStatusPolling(instance.name);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to generate pairing code";
      console.error("Frontend error:", err);
      setPhoneError(msg);
    } finally {
      setPhoneLoading(false);
    }
  }

  function copyKey() {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    }
  }

  const stepTitles: Record<Step, string> = {
    form: "Create an instance",
    choose: "Instance created!",
    qr: "Scan QR Code",
    phone: "Connect with Phone",
    connected: "WhatsApp Connected!",
  };

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
          className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: "#111", border: "1px solid #1e1e1e", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
            <div>
              <h2 className="text-[14px] font-semibold text-white">{stepTitles[step]}</h2>
              <p className="text-[11px] text-[#5a7a5a] mt-0.5">
                {step === "form"
                  ? `Plan: ${user?.plan?.toUpperCase() ?? "FREE"} · ${user?.maxInstances ?? 1} max`
                  : instance?.name ?? ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-[#5a7a5a] hover:text-white hover:bg-[#1a1a1a] transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* ── STEP: form ── */}
          {step === "form" && (
            <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#8a9a8a] mb-1.5">
                    Instance Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register("customName")}
                    placeholder="my-bot"
                    autoFocus
                    className={cn("input-dark w-full", errors.customName && "border-red-500/50")}
                  />
                  {errors.customName && (
                    <p className="mt-1 text-[11px] text-red-400">{errors.customName.message}</p>
                  )}
                  <p className="mt-1 text-[10px] text-[#4a6a4a]">3–30 chars. Letters, numbers, hyphens, underscores only.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8a9a8a] mb-1.5">Integration</label>
                  <select {...register("integration")} className="input-dark w-full" style={{ appearance: "none" }}>
                    <option value="WHATSAPP-BAILEYS">WhatsApp Baileys (recommended)</option>
                    <option value="WHATSAPP-BUSINESS">WhatsApp Business API</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-green flex-1 flex items-center justify-center gap-2">
                  {isSubmitting ? <><Loader2 size={13} className="animate-spin" />Creating…</> : <><Plus size={13} />Create instance</>}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP: choose connection method ── */}
          {step === "choose" && instance && (
            <div className="px-5 py-5 space-y-4">
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#0d2510" }}>
                  <CheckCircle2 size={24} className="text-[#22c55e]" />
                </div>
                <p className="text-sm font-semibold text-white">Instance created successfully</p>
                <p className="text-[11px] text-[#5a7a5a]">Choose how you want to connect WhatsApp</p>
              </div>

              {/* API Key */}
              {apiKey && (
                <div>
                  <p className="text-[11px] font-medium text-[#8a9a8a] mb-1.5">
                    API Key <span className="text-yellow-500">(shown once — save it!)</span>
                  </p>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e]">
                    <code className="flex-1 text-[11px] font-mono text-[#22c55e] truncate">
                      {showKey ? apiKey : "•".repeat(Math.min(apiKey.length, 32))}
                    </code>
                    <button onClick={() => setShowKey(!showKey)} className="text-[#4a6a4a] hover:text-white transition-colors shrink-0">
                      {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button onClick={copyKey} className="text-[#4a6a4a] hover:text-[#22c55e] transition-colors shrink-0">
                      {keyCopied ? <CheckCircle2 size={13} className="text-[#22c55e]" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="text-[11px] font-medium text-[#8a9a8a] text-center">Connect WhatsApp</div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleChooseQR}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[#1e1e1e] hover:border-[#22c55e]/40 hover:bg-[#0d2510]/40 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0d2510] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <QrCode size={18} className="text-[#22c55e]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] font-semibold text-white">Scan QR Code</p>
                    <p className="text-[10px] text-[#5a7a5a] mt-0.5">Use WhatsApp camera</p>
                  </div>
                </button>

                <button
                  onClick={() => setStep("phone")}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[#1e1e1e] hover:border-[#22c55e]/40 hover:bg-[#0d2510]/40 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0d2510] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone size={18} className="text-[#22c55e]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] font-semibold text-white">Phone Number</p>
                    <p className="text-[10px] text-[#5a7a5a] mt-0.5">Get pairing code</p>
                  </div>
                </button>
              </div>

              <button onClick={onClose} className="btn-ghost w-full text-[12px]">Skip for now</button>
            </div>
          )}

          {/* ── STEP: QR code ── */}
          {step === "qr" && (
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0d1f0d] border border-[#1a2e1a]">
                <Smartphone size={14} className="text-[#22c55e] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[#6a9a6a] leading-relaxed">
                  Open WhatsApp → Linked Devices → Link a Device, then scan below.
                </p>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", {
                  "bg-[#22c55e] animate-pulse": connectionStatus === "connecting",
                  "bg-[#6b7280]": connectionStatus === "disconnected",
                })} />
                <span className="text-[11px] text-[#5a7a5a]">
                  {connectionStatus === "connecting" ? "Waiting for scan…" : "Scan the QR code to connect"}
                </span>
              </div>

              <div className="relative flex items-center justify-center rounded-xl overflow-hidden" style={{ background: "#0a0a0a", border: "1px solid #1e1e1e", minHeight: 240 }}>
                {qrLoading && (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={28} className="text-[#22c55e] animate-spin" />
                    <p className="text-xs text-[#5a7a5a]">Loading QR…</p>
                  </div>
                )}
                {!qrLoading && qrError && (
                  <div className="flex flex-col items-center gap-2 px-6 text-center">
                    <AlertCircle size={24} className="text-red-400" />
                    <p className="text-xs text-red-400">{qrError}</p>
                    <button onClick={refreshQR} className="text-[11px] text-[#22c55e] flex items-center gap-1 mt-1">
                      <RefreshCw size={10} /> Try again
                    </button>
                  </div>
                )}
                {!qrLoading && !qrError && qrCode && (
                  <img src={qrCode} alt="QR Code" className="w-52 h-52 object-contain p-2" style={{ imageRendering: "pixelated" }} />
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={refreshQR} disabled={qrLoading} className="btn-ghost flex-1 flex items-center justify-center gap-1.5">
                  <RefreshCw size={13} className={qrLoading ? "animate-spin" : ""} /> Refresh
                </button>
                <button onClick={onClose} className="btn-green flex-1">Done</button>
              </div>
              <p className="text-center text-[10px] text-[#3a5a3a]">Status auto-checks every 5 seconds</p>
            </div>
          )}

          {/* ── STEP: phone number ── */}
          {step === "phone" && (
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0d1f0d] border border-[#1a2e1a]">
                <Phone size={14} className="text-[#22c55e] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[#6a9a6a] leading-relaxed">
                  Enter your phone number with country code. You'll get a pairing code to enter in WhatsApp → Linked Devices.
                </p>
              </div>

              {!pairingCode ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#8a9a8a] mb-1.5">Phone Number</label>
                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+237XXXXXXXXX"
                      className="input-dark w-full"
                      autoFocus
                    />
                    {phoneError && (
                      <p className="mt-1 text-[11px] text-red-400 flex items-center gap-1">
                        <AlertCircle size={11} />{phoneError}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-[#4a6a4a]">Include country code, e.g. +237XXXXXXXXX</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setStep("choose")} className="btn-ghost flex-1">Back</button>
                    <button
                      onClick={handleConnectPhone}
                      disabled={phoneLoading || !phoneNumber.trim()}
                      className="btn-green flex-1 flex items-center justify-center gap-2"
                    >
                      {phoneLoading ? <><Loader2 size={13} className="animate-spin" />Generating…</> : <>Get Pairing Code</>}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-[11px] text-[#8a9a8a] mb-2">Enter this code in WhatsApp → Linked Devices</p>
                    <div className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#0d2510] border border-[#22c55e]/30">
                      <span className="text-2xl font-bold text-[#22c55e] tracking-[0.3em] font-mono">
                        {pairingCode}
                      </span>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center justify-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", {
                      "bg-[#22c55e] animate-pulse": connectionStatus === "connecting",
                      "bg-[#6b7280]": connectionStatus === "disconnected",
                    })} />
                    <span className="text-[11px] text-[#5a7a5a]">
                      {connectionStatus === "connecting" ? "Waiting for confirmation…" : "Enter the code in WhatsApp"}
                    </span>
                  </div>

                  <button onClick={onClose} className="btn-ghost w-full">Done</button>
                  <p className="text-center text-[10px] text-[#3a5a3a]">Status auto-checks every 5 seconds</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: connected ── */}
          {step === "connected" && (
            <div className="px-5 py-5 space-y-4">
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "#0d2510" }}
                >
                  <CheckCircle2 size={32} className="text-[#22c55e]" />
                </motion.div>
                <div>
                  <p className="text-[15px] font-bold text-[#22c55e]">Connected!</p>
                  <p className="text-[12px] text-white mt-1">{instance?.name}</p>
                  <p className="text-[11px] text-[#5a7a5a] mt-1">WhatsApp is now active and ready to use</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0d2510] border border-[#22c55e]/20">
                <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                <span className="text-[11px] text-[#6a9a6a]">
                  🟢 Connected — You can now send and receive messages
                </span>
              </div>

              <button onClick={onClose} className="btn-green w-full">Go to Dashboard</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
