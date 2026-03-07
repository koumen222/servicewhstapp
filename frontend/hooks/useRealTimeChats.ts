"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { instanceApi } from "@/lib/api";
import type { Chat, ChatMessage } from "@/lib/types";

interface UseRealTimeChatsOptions {
  instanceId?: string;
  pollInterval?: number; // default 60000ms — webhooks are primary, polling is fallback
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
  pollInterval = 60_000,
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
  const isFirstFetchRef = useRef(true);

  const fetchChats = useCallback(async (isBackground = false) => {
    if (!enabled || !mountedRef.current) return;

    if (!isBackground) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      if (!instanceId) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      const response = await instanceApi.getChats(instanceId);
      
      if (!mountedRef.current) return;

      if (!response.data?.success) {
        if (!isBackground) {
          setState(prev => ({ ...prev, isLoading: false, error: response.data?.message || 'Failed to fetch chats' }));
        }
        return;
      }
      const newChats: Chat[] = response.data?.data?.chats || [];

      prevChatsRef.current = newChats;

      setState(prev => ({
        ...prev,
        chats: newChats,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      }));

    } catch (error: any) {
      if (!mountedRef.current) return;
      if (!isBackground) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.response?.data?.message || 'Failed to fetch chats',
        }));
      }
    }
  }, [instanceId, enabled]);

  // Use a ref to always hold the latest fetchChats — prevents stale closure in interval
  // AND removes fetchChats from the polling useEffect deps (breaking the re-run loop)
  const fetchChatsRef = useRef(fetchChats);
  useEffect(() => {
    fetchChatsRef.current = fetchChats;
  }, [fetchChats]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchChatsRef.current(false);
  }, []);

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

  // Polling effect — fetchChats intentionally excluded from deps (we use fetchChatsRef instead)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!enabled || !instanceId) {
      stopPolling();
      return;
    }

    // Initial fetch
    if (isFirstFetchRef.current) {
      isFirstFetchRef.current = false;
      fetchChatsRef.current(false);
    } else {
      fetchChatsRef.current(true);
    }

    // Start interval — always reads latest fetchChats via ref
    intervalRef.current = setInterval(() => fetchChatsRef.current(true), pollInterval);

    return () => {
      stopPolling();
    };
  }, [enabled, instanceId, pollInterval]); // fetchChats excluded on purpose

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, []);

  return {
    ...state,
    refresh,
    stopPolling,
    addMessageOptimistically,
    markAsRead,
  };
}
