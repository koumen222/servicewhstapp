"use client";

import { motion } from "framer-motion";
import { MessageSquare, Search, Clock, ArrowRight } from "lucide-react";
import { useAppStore } from "@/store/useStore";
import { StatusBadge } from "@/components/StatusBadge";

const MOCK_CHATS = [
  { id: "1", name: "+1 234 567 8900", lastMsg: "Hello! How can I help?", time: "2m ago", instance: "Production Bot", unread: 3 },
  { id: "2", name: "+44 20 7946 0958", lastMsg: "Thanks for your response.", time: "15m ago", instance: "Production Bot", unread: 0 },
  { id: "3", name: "+33 1 23 45 67 89", lastMsg: "When is my order arriving?", time: "1h ago", instance: "Support Chat", unread: 1 },
  { id: "4", name: "+49 30 12345678", lastMsg: "Please send me the catalog.", time: "3h ago", instance: "Marketing Bot", unread: 0 },
  { id: "5", name: "+55 11 9 8765 4321", lastMsg: "Obrigado!", time: "yesterday", instance: "Support Chat", unread: 0 },
];

export default function ChatsPage() {
  const { instances } = useAppStore();
  const hasInstances = instances.length > 0;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Chats</h2>
          <p className="text-[12px] text-[#5a7a5a] mt-0.5">
            Recent conversations across your instances
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a4a]" />
        <input
          placeholder="Search conversations…"
          className="input-dark w-full pl-8 text-xs"
        />
      </div>

      {/* Chats list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111", border: "1px solid #1e1e1e" }}
      >
        {MOCK_CHATS.map((chat, i) => (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 px-4 py-3.5 border-b border-[#141414] last:border-0 hover:bg-[#131313] cursor-pointer transition-colors group"
          >
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: "#0d2510", color: "#22c55e" }}
            >
              {chat.name.slice(-4, -3)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[13px] font-medium text-white truncate">
                  {chat.name}
                </p>
                <span className="text-[10px] text-[#4a6a4a] shrink-0 flex items-center gap-1">
                  <Clock size={9} />
                  {chat.time}
                </span>
              </div>
              <p className="text-[11px] text-[#5a7a5a] truncate">{chat.lastMsg}</p>
              <p className="text-[10px] text-[#3a5a3a] mt-0.5">
                via {chat.instance}
              </p>
            </div>

            {/* Badge */}
            {chat.unread > 0 && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: "#22c55e", color: "#000" }}
              >
                {chat.unread}
              </div>
            )}

            <ArrowRight size={13} className="text-[#2a4a2a] group-hover:text-[#22c55e] transition-colors shrink-0" />
          </motion.div>
        ))}
      </motion.div>

      {!hasInstances && (
        <div className="mt-4 p-4 rounded-xl text-center" style={{ background: "#0d0d0d", border: "1px dashed #1e1e1e" }}>
          <p className="text-[12px] text-[#4a6a4a]">
            Connect a WhatsApp instance to see real conversations here.
          </p>
        </div>
      )}
    </div>
  );
}
