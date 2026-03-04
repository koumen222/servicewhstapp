"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { instanceApi } from "@/lib/api";
import type { Chat, ChatMessage } from "@/lib/types";

interface UseRealTimeChatsOptions {
  instanceId?: string;
  pollInterval?: number; // default 3000ms
  enabled?: boolean;
}

interface RealTimeChatsState {
  chats: Chat[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useRealTimeChats({
  instanceId,
  pollInterval = 3000,
  enabled = true,
}: UseRealTimeChatsOptions = {}) {
  const [state, setState] = useState<RealTimeChatsState>({
    chats: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const prevChatsRef = useRef<Chat[]>([]);

  const fetchChats = useCallback(async () => {
    if (!enabled || !mountedRef.current) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!instanceId) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      const response = await instanceApi.getChats(instanceId);
      if (!response.data?.success) {
        setState(prev => ({ ...prev, isLoading: false, error: response.data?.message || 'Failed to fetch chats' }));
        return;
      }
      const newChats: Chat[] = response.data?.data?.chats || [];
      
      if (!mountedRef.current) return;

      // Check for new messages by comparing with previous chats
      const hasNewMessages = newChats.some(chat => {
        const prevChat = prevChatsRef.current.find(p => p.id === chat.id);
        return !prevChat || 
               chat.lastMessage?.id !== prevChat.lastMessage?.id ||
               chat.unreadCount !== prevChat.unreadCount;
      });

      prevChatsRef.current = newChats;

      setState(prev => ({
        ...prev,
        chats: newChats,
        isLoading: false,
        lastUpdated: new Date(),
      }));

      // Optional: You could emit events here for new messages
      if (hasNewMessages) {
        // Could dispatch custom events or call callbacks
        console.log("New messages detected");
      }

    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error('Failed to fetch chats:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch chats',
      }));
    }
  }, [instanceId, enabled]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    // Fetch immediately
    fetchChats();
    
    // Then poll every interval
    intervalRef.current = setInterval(fetchChats, pollInterval);
  }, [fetchChats, pollInterval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchChats();
  }, [fetchChats]);

  // Add a new message optimistically
  const addMessageOptimistically = useCallback((chatId: string, message: Partial<ChatMessage>) => {
    setState(prev => ({
      ...prev,
      chats: prev.chats.map(chat => {
        if (chat.id === chatId) {
          const newMessage: ChatMessage = {
            id: `temp_${Date.now()}`,
            chatId,
            instanceId: chat.instanceId,
            senderId: 'me',
            recipientId: chat.contactId,
            content: message.content || '',
            messageType: message.messageType || 'text',
            status: 'pending',
            isFromMe: true,
            timestamp: new Date().toISOString(),
            ...message,
          };

          return {
            ...chat,
            lastMessage: newMessage,
            messages: chat.messages ? [...chat.messages, newMessage] : [newMessage],
          };
        }
        return chat;
      }),
    }));
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (chatId: string, messageIds: string[]) => {
    try {
      // Mark as read — no backend endpoint yet, update locally only
      
      // Update local state
      setState(prev => ({
        ...prev,
        chats: prev.chats.map(chat => 
          chat.id === chatId 
            ? { ...chat, unreadCount: 0 }
            : chat
        ),
      }));
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    startPolling();

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...state,
    refresh,
    startPolling,
    stopPolling,
    addMessageOptimistically,
    markAsRead,
  };
}
