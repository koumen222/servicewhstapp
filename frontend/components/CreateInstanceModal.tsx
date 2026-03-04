"use client";

import { useState } from "react";
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
} from "lucide-react";
import { instancesApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { Instance } from "@/lib/types";

const schema = z.object({
  customName: z
    .string()
    .min(3, "Minimum 3 characters")
    .max(30, "Maximum 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Only letters, numbers, underscores and hyphens"
    ),
  integration: z.enum(["WHATSAPP-BAILEYS", "WHATSAPP-BUSINESS"]).optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateInstanceModalProps {
  onClose: () => void;
  onCreated: (instance: Instance) => void;
}

export function CreateInstanceModal({
  onClose,
  onCreated,
}: CreateInstanceModalProps) {
  const { user } = useAppStore();
  const [step, setStep] = useState<"form" | "created">("form");
  const [createdData, setCreatedData] = useState<{
    instance: Instance;
    apiKey: string;
    qrCode?: string;
  } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { integration: "WHATSAPP-BAILEYS" },
  });

  async function onSubmit(data: FormData) {
    try {
      const res = await instancesApi.create(data.customName, data.integration);
      const result = res.data?.data;

      const newInstance: Instance = {
        id: result.instance.id,
        name: result.instance.name,
        instanceName: result.instance.instanceName,
        status: result.instance.status as Instance["status"],
        connectionStatus: "connecting",
        createdAt: result.instance.createdAt,
        apiKeys: [],
        quotas: [],
        stats: { messagesLast30Days: 0, totalApiKeys: 1 },
      };

      setCreatedData({
        instance: newInstance,
        apiKey: result.apiKey?.key ?? "",
        qrCode: result.qrCode?.base64
          ? `data:image/png;base64,${result.qrCode.base64}`
          : undefined,
      });
      setStep("created");
      onCreated(newInstance);
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.error ?? "Failed to create instance";
      setError("customName", { message: msg });
    }
  }

  function copyKey() {
    if (createdData?.apiKey) {
      navigator.clipboard.writeText(createdData.apiKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
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
          className="w-full max-w-md rounded-2xl overflow-hidden"
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
                {step === "form" ? "Create an instance" : "Instance created!"}
              </h2>
              <p className="text-[11px] text-[#5a7a5a] mt-0.5">
                {step === "form"
                  ? `Plan: ${user?.plan?.toUpperCase() ?? "FREE"} · ${
                      user?.maxInstances ?? 1
                    } max instances`
                  : "Your instance is ready to use"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-[#5a7a5a] hover:text-white hover:bg-[#1a1a1a] transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body: Form */}
          {step === "form" && (
            <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5">
              <div className="space-y-4">
                {/* Instance name */}
                <div>
                  <label className="block text-xs font-medium text-[#8a9a8a] mb-1.5">
                    Instance Name
                    <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    {...register("customName")}
                    placeholder="my-bot"
                    autoFocus
                    className={cn(
                      "input-dark w-full",
                      errors.customName && "border-red-500/50 focus:border-red-500/80"
                    )}
                  />
                  {errors.customName && (
                    <p className="mt-1 text-[11px] text-red-400">
                      {errors.customName.message}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-[#4a6a4a]">
                    3–30 chars. Letters, numbers, hyphens, underscores only.
                  </p>
                </div>

                {/* Integration type */}
                <div>
                  <label className="block text-xs font-medium text-[#8a9a8a] mb-1.5">
                    Integration
                  </label>
                  <select
                    {...register("integration")}
                    className="input-dark w-full"
                    style={{ appearance: "none" }}
                  >
                    <option value="WHATSAPP-BAILEYS">
                      WhatsApp Baileys (recommended)
                    </option>
                    <option value="WHATSAPP-BUSINESS">
                      WhatsApp Business API
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-green flex-1 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Plus size={13} />
                      Create instance
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Body: Created */}
          {step === "created" && createdData && (
            <div className="px-5 py-5 space-y-4">
              <div className="flex flex-col items-center gap-2 py-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "#0d2510" }}
                >
                  <CheckCircle2 size={24} className="text-[#22c55e]" />
                </div>
                <p className="text-sm font-semibold text-white">
                  {createdData.instance.name}
                </p>
                <p className="text-[11px] text-[#5a7a5a] font-mono text-center break-all">
                  {createdData.instance.instanceName}
                </p>
              </div>

              {/* API Key */}
              {createdData.apiKey && (
                <div>
                  <p className="text-[11px] font-medium text-[#8a9a8a] mb-1.5">
                    API Key{" "}
                    <span className="text-yellow-500">
                      (shown once — save it!)
                    </span>
                  </p>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e]">
                    <code className="flex-1 text-[11px] font-mono text-[#22c55e] truncate">
                      {showKey
                        ? createdData.apiKey
                        : "•".repeat(Math.min(createdData.apiKey.length, 32))}
                    </code>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="text-[#4a6a4a] hover:text-white transition-colors shrink-0"
                    >
                      {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      onClick={copyKey}
                      className="text-[#4a6a4a] hover:text-[#22c55e] transition-colors shrink-0"
                    >
                      {keyCopied ? (
                        <CheckCircle2 size={13} className="text-[#22c55e]" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* QR preview */}
              {createdData.qrCode && (
                <div>
                  <p className="text-[11px] font-medium text-[#8a9a8a] mb-1.5">
                    QR Code — Scan with WhatsApp
                  </p>
                  <div className="flex items-center justify-center p-3 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e]">
                    <img
                      src={createdData.qrCode}
                      alt="QR Code"
                      className="w-40 h-40 object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                </div>
              )}

              <button onClick={onClose} className="btn-green w-full">
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
