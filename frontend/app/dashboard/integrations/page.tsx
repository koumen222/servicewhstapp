"use client";

import { motion } from "framer-motion";
import { Puzzle, Webhook, Code2, ArrowRight, CheckCircle2, MessageSquare } from "lucide-react";
import { useState } from "react";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
import { useI18n } from "@/lib/i18n";

const INTEGRATIONS = [
  {
    name: "WhatsApp Instance",
    desc: "Connect your existing WhatsApp instance via API key.",
    icon: MessageSquare,
    color: "#25D366",
    status: "available",
    component: "whatsapp",
  },
  {
    name: "Webhook",
    desc: "Receive real-time events to your server when messages arrive.",
    icon: Webhook,
    color: "#3b82f6",
    status: "available",
  },
  {
    name: "Zapier",
    desc: "Connect WhatsApp with 5,000+ apps via Zapier automation.",
    icon: Puzzle,
    color: "#f59e0b",
    status: "coming_soon",
  },
  {
    name: "REST API",
    desc: "Full programmatic access via the REST API with your API keys.",
    icon: Code2,
    color: "#22c55e",
    status: "available",
  },
];

export default function IntegrationsPage() {
  const { t } = useI18n();
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);

  if (activeIntegration === "whatsapp") {
    return (
      <div className="max-w-3xl space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => setActiveIntegration(null)}
            className="text-[12px] text-[#5a7a5a] hover:text-white mb-4 flex items-center gap-1"
          >
            {t('intg.back')}
          </button>
          <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {t('intg.whatsapp.title')}
          </h2>
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {t('intg.whatsapp.desc')}
          </p>
        </motion.div>

        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
          <WhatsAppIntegration />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {t('intg.title')}
        </h2>
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {t('intg.desc')}
        </p>
      </motion.div>

      <div className="space-y-3">
        {INTEGRATIONS.map((intg, i) => {
          const Icon = intg.icon;
          return (
            <motion.div
              key={intg.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: "#111", border: "1px solid #1e1e1e" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${intg.color}18` }}
              >
                <Icon size={18} style={{ color: intg.color }} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-white">
                  {intg.name}
                </p>
                <p className="text-[11px] text-[#5a7a5a] mt-0.5">{intg.desc}</p>
              </div>
              {intg.status === "available" ? (
                <button 
                  onClick={() => intg.component && setActiveIntegration(intg.component)}
                  className="flex items-center gap-1.5 text-[11px] text-[#22c55e] hover:text-[#4ade80] transition-colors shrink-0"
                >
                  {t('intg.configure')} <ArrowRight size={11} />
                </button>
              ) : (
                <span className="text-[10px] text-[#4a6a4a] bg-[#1a1a1a] px-2 py-1 rounded-full shrink-0">
                  {t('intg.comingSoon')}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
