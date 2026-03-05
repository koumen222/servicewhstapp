"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Video, MoreVertical, Send, Paperclip, Smile, Check, CheckCheck } from "lucide-react";
import { instanceApi } from "@/lib/api";
import type { Chat, ChatMessage, MessageStatus } from "@/lib/types";

interface ChatWindowProps {
  chat: Chat;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => Promise<void>;
  instanceName?: string;
  isConnected?: boolean;
}

interface MessageBubbleProps {
  message: ChatMessage;
}

const MESSAGE_STATUS_ICONS = {
  pending: null,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: X,
};

const MESSAGE_STATUS_COLORS = {
  pending: "#6b7280",
  sent: "#6b7280", 
  delivered: "#6b7280",
  read: "#22c55e",
  failed: "#ef4444",
};

function MessageBubble({ message }: MessageBubbleProps) {
  const StatusIcon = MESSAGE_STATUS_ICONS[message.status];
  const statusColor = MESSAGE_STATUS_COLORS[message.status];
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          message.isFromMe
            ? 'bg-[#0d2510] text-white'
            : 'bg-[#1a1a1a] text-white'
        }`}
        style={{
          borderBottomRightRadius: message.isFromMe ? '6px' : '16px',
          borderBottomLeftRadius: message.isFromMe ? '16px' : '6px',
        }}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-white/60">
            {formatTime(message.timestamp)}
          </span>
          
          {message.isFromMe && StatusIcon && (
            <StatusIcon 
              size={12} 
              style={{ color: statusColor }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ChatWindow({ chat, isOpen, onClose, onSendMessage, instanceName, isConnected = true }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages when chat changes
  useEffect(() => {
    if (!isOpen || !chat.id) return;

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        if (!instanceName) { 
          console.log('[ChatWindow] No instance name, using fallback messages');
          setMessages(chat.messages || []); 
          setIsLoading(false);
          return; 
        }
        
        console.log('[ChatWindow] Loading messages for:', { instanceName, contactId: chat.contactId });
        const response = await instanceApi.getChatMessages(instanceName, chat.contactId);
        
        if (response.data?.success) {
          const loadedMessages = response.data.data?.messages || [];
          console.log('[ChatWindow] Loaded messages:', loadedMessages.length);
          setMessages(loadedMessages);
        } else {
          console.warn('[ChatWindow] API returned unsuccessful response, using fallback');
          setMessages(chat.messages || []);
        }
      } catch (error: any) {
        console.error('[ChatWindow] Failed to load messages:', error?.response?.data || error?.message);
        // Use chat.messages as fallback
        setMessages(chat.messages || []);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [chat.id, isOpen, instanceName]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isSending) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    // Add optimistic message
    const optimisticMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      chatId: chat.id,
      instanceId: chat.instanceId,
      senderId: 'me',
      recipientId: chat.contactId,
      content: messageText,
      messageType: 'text',
      status: 'pending',
      isFromMe: true,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await onSendMessage(messageText);
      
      // Update the optimistic message to sent
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, status: 'sent' as MessageStatus }
          : msg
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Mark as failed
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, status: 'failed' as MessageStatus }
          : msg
      ));
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md h-[600px] rounded-2xl overflow-hidden flex flex-col"
          style={{ background: "#111", border: "1px solid #1e1e1e" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-[#1e1e1e]">
            <div className="w-10 h-10 rounded-full bg-[#0d2510] flex items-center justify-center text-[#22c55e] font-bold">
              {getInitials(chat.contactName)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {chat.contactName}
              </h3>
              <p className="text-[11px] text-white/60">
                {chat.contactId}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <Phone size={16} className="text-white/60" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <Video size={16} className="text-white/60" />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <MoreVertical size={16} className="text-white/60" />
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={16} className="text-white/60" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#22c55e] border-t-transparent" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <div className="w-16 h-16 rounded-full bg-[#0d2510] flex items-center justify-center mx-auto mb-3">
                    <div className="text-[#22c55e] font-bold text-xl">
                      {getInitials(chat.contactName)}
                    </div>
                  </div>
                  <p className="text-white/80 font-medium mb-1">{chat.contactName}</p>
                  <p className="text-[11px] text-white/50">Start a conversation</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Disconnected banner */}
          {!isConnected && (
            <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <p className="text-[11px] text-red-400">Instance not connected. Connect WhatsApp to send messages.</p>
            </div>
          )}

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-[#1e1e1e]">
            <div className="flex items-end gap-3">
              <button
                type="button"
                disabled={!isConnected}
                className="p-2 hover:bg-white/5 rounded-full transition-colors shrink-0 disabled:opacity-30"
              >
                <Paperclip size={18} className="text-white/60" />
              </button>

              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isConnected ? "Type a message..." : "Connect WhatsApp to send messages"}
                  disabled={isSending || !isConnected}
                  className="w-full px-4 py-3 pr-12 rounded-full text-sm resize-none bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-white/50 focus:border-[#22c55e] focus:ring-0 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled={!isConnected}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded-full transition-colors disabled:opacity-30"
                >
                  <Smile size={16} className="text-white/60" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending || !isConnected}
                className="p-3 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#22c55e]/30 disabled:cursor-not-allowed rounded-full transition-colors shrink-0"
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
