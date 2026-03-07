"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, Clock, ArrowRight, Wifi, MessageCircle, Users } from "lucide-react";
import { useAppStore } from "@/store/useStore";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { ChatWindow } from "@/components/ChatWindow";
import { useRealTimeChats } from "@/hooks/useRealTimeChats";
import { instanceApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Chat, ConnectionStatus as ConnectionStatusType } from "@/lib/types";

export default function ChatsPage() {
  const { instances } = useAppStore();
  const { t } = useI18n();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [frozenInstanceName, setFrozenInstanceName] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get active (connected) instance first, then any instance
  const activeInstance = instances.find(i => {
    const s = (i.status || '') as string;
    const cs = (i.connectionStatus || '') as string;
    return s === "open" || cs === "connected" || cs === "open";
  }) || instances[0];
  
  // Statut de connexion basé sur les données synchronisées depuis Evolution (pas de polling)
  const rawStatus = (activeInstance?.status || 'unknown') as string;
  const rawConn = (activeInstance?.connectionStatus || '') as string;
  const isConnected = rawStatus === 'open' || rawConn === 'connected';
  const connectionStatus = isConnected ? 'connected' : rawStatus === 'connecting' ? 'connecting' : 'disconnected';

  console.log('[ChatsPage] instanceName:', activeInstance?.instanceName);
  console.log('[ChatsPage] status:', activeInstance?.status);
  console.log('[ChatsPage] connectionStatus:', activeInstance?.connectionStatus);
  console.log('[ChatsPage] isConnected:', isConnected);
  console.log('[ChatsPage] hookEnabled:', isConnected && !!activeInstance?.instanceName && !selectedChat);

  // Real-time chats hook — only fetch when connected
  const {
    chats: realTimeChats,
    isLoading: chatsLoading,
    addMessageOptimistically,
    markAsRead,
  } = useRealTimeChats({
    instanceId: activeInstance?.instanceName,
    enabled: isConnected && !!activeInstance?.instanceName && !selectedChat,
    pollInterval: 10000,
  });
  
  // Use only real-time chats from API
  const chats = realTimeChats;
  const hasInstances = instances.length > 0;
  const hasChats = chats.length > 0;

  const handleSendMessage = async (message: string) => {
    if (!selectedChat || !activeInstance) return;
    
    try {
      // Add optimistic message
      addMessageOptimistically(selectedChat.id, {
        content: message,
        messageType: "text",
      });
      
      // Verify connected before sending
      if (!isConnected) {
        throw new Error("Instance is not connected. Please connect WhatsApp first.");
      }

      // Send message via API using real instanceName (5-digit ID)
      const res = await instanceApi.sendMessage(
        activeInstance.instanceName,
        selectedChat.contactId,
        message
      );
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  };
  
  const handleChatClick = async (chat: Chat) => {
    // Freeze instanceName at click time — prevents ChatWindow from reloading
    // messages if activeInstance changes reference during conversation
    setFrozenInstanceName(activeInstance?.instanceName);
    setSelectedChat(chat);
    
    if (chat.unreadCount > 0) {
      await markAsRead(chat.id, []);
    }
  };
  
  const filteredChats = chats.filter(chat => 
    !searchQuery || 
    chat.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.contactId.includes(searchQuery)
  );
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `il y a ${diffInMinutes}m`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `il y a ${hours}h`;
    } else {
      return "hier";
    }
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  const totalUnreadMessages = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);

  return (
    <>
      <div className="max-w-4xl">
        {/* Header with stats */}
        <div className="flex items-start sm:items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h2 className="text-[15px] font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <MessageSquare size={16} />
              {t('chats.title')}
              {totalUnreadMessages > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#22c55e] text-black rounded-full">
                  {totalUnreadMessages}
                </span>
              )}
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {hasChats ? `${chats.length} ${t('chats.count')}` : t('chats.noChats')}
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="hidden sm:flex items-center gap-2 text-[11px]">
              <Users size={12} className="text-[#4a6a4a]" />
              <span className="text-[#5a7a5a]">{hasChats ? `${chats.length} ${t('chats.contacts')}` : `0 ${t('chats.contacts')}`}</span>
            </div>
            
            {activeInstance && (
              <div className="flex items-center gap-2 text-[11px]">
                <Wifi size={12} className="text-[#4a6a4a]" />
                <span className="text-[#5a7a5a] truncate max-w-[100px]">{activeInstance.name}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Connection Status */}
        {activeInstance && (
          <div className="mb-6">
            <ConnectionStatus
              status={connectionStatus as ConnectionStatusType}
              instanceName={activeInstance.instanceName}
              profileName={activeInstance.profileName || undefined}
              showInstanceName={true}
            />
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a4a]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('chats.search')}
            className="input-dark w-full pl-8 text-xs"
          />
        </div>

        {/* Chats list */}
        {chatsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#22c55e] border-t-transparent" />
          </div>
        ) : filteredChats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--green-bg-subtle)' }}>
              <MessageCircle size={24} className="text-[#22c55e]" />
            </div>
            <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('chats.noFound')}</p>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {searchQuery ? t('chats.noFound.search') : t('chats.noFound.empty')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
          >
            <AnimatePresence>
              {filteredChats.map((chat, i) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleChatClick(chat)}
                  className="flex items-center gap-3 px-4 py-4 last:border-0 cursor-pointer transition-all duration-200 group relative overflow-hidden"
                  style={{ borderBottom: '1px solid var(--table-border)' }}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-transform group-hover:scale-105"
                      style={{ background: "var(--green-bg-subtle)", color: "var(--brand-green)" }}
                    >
                      {getInitials(chat.contactName)}
                    </div>
                    
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--card-bg)' }}>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {chat.contactName}
                      </p>
                      <span className="text-[10px] text-[#4a6a4a] shrink-0 flex items-center gap-1">
                        <Clock size={9} />
                        {formatTime(chat.lastActivity)}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-[#6a6a6a] mb-1">{chat.contactId}</p>
                    
                    {chat.lastMessage && (
                      <p className="text-[11px] text-[#5a7a5a] truncate flex items-center gap-1">
                        {chat.lastMessage.isFromMe && (
                          <span className="text-[#22c55e]">→</span>
                        )}
                        {chat.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Badge & Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    {chat.unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: "#22c55e", color: "#000" }}
                      >
                        {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                      </motion.div>
                    )}
                    
                    <ArrowRight size={13} className="text-[#2a4a2a] group-hover:text-[#22c55e] transition-colors" />
                  </div>
                  
                  {/* Hover effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent to-[#22c55e]/5"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* No instances message */}
        {!hasInstances && (
          <div className="mt-6 p-6 rounded-xl text-center" style={{ background: "var(--bg-deeper)", border: "1px dashed var(--card-border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--border-subtle)' }}>
              <Wifi size={20} className="text-[#4a6a4a]" />
            </div>
            <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              {t('chats.noInstance')}
            </p>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {t('chats.noInstance.desc')}
            </p>
          </div>
        )}
      </div>
      
      {/* Chat Window Modal */}
      {selectedChat && (
        <ChatWindow
          chat={selectedChat}
          isOpen={!!selectedChat}
          onClose={() => setSelectedChat(null)}
          onSendMessage={handleSendMessage}
          instanceName={frozenInstanceName}
          isConnected={isConnected}
        />
      )}
    </>
  );
}
