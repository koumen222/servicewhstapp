"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { instanceApi } from "@/lib/api";
import type { ConnectionStatus, InstanceConnectionInfo } from "@/lib/types";

// Backend now receives webhooks from Evolution API, so polling is just a fallback
const CONNECTED_POLL_INTERVAL = 120_000; // 2 minutes when connected
const DEFAULT_POLL_INTERVAL = 60_000;    // 1 minute default (was 8s)

interface UseInstanceStatusOptions {
  instanceName: string;
  pollInterval?: number; // in milliseconds, default 60000 (1 min)
  enabled?: boolean;
}

interface InstanceStatusState {
  status: ConnectionStatus;
  connectionInfo?: InstanceConnectionInfo;
  isLoading: boolean; // Only true on the very first fetch
  error: string | null;
  lastUpdated: Date | null;
}

export function useInstanceStatus({
  instanceName,
  pollInterval = DEFAULT_POLL_INTERVAL, // 60s - backend receives webhooks, polling is fallback only
  enabled = true,
}: UseInstanceStatusOptions) {
  const [state, setState] = useState<InstanceStatusState>({
    status: 'unknown',
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const isFirstFetchRef = useRef(true);
  const currentStatusRef = useRef<ConnectionStatus>('unknown');

  const fetchStatus = useCallback(async (isBackground = false) => {
    if (!enabled || !mountedRef.current || !instanceName) return;

    // Only show loading spinner on the initial fetch, not background polls
    if (!isBackground) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      const response = await instanceApi.getStatus(instanceName);

      if (!mountedRef.current) return;

      if (!response.data?.success) {
        // Background polls: don't overwrite status on non-critical errors
        if (!isBackground) {
          setState(prev => ({ ...prev, isLoading: false, error: response.data?.message || 'Failed to fetch status' }));
        }
        return;
      }

      const data = response.data.data;
      const newStatus = (data.status as ConnectionStatus) || 'unknown';
      currentStatusRef.current = newStatus;

      setState(prev => ({
        ...prev,
        status: newStatus,
        connectionInfo: {
          instanceId: instanceName,
          instanceName,
          status: newStatus,
          profileName: data.profileName || undefined,
          profilePicture: data.profilePicture || undefined,
        },
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      }));

      // If connected, reschedule with a longer interval to reduce load
      if (newStatus === 'connected' && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => fetchStatus(true), CONNECTED_POLL_INTERVAL);
      } else if (newStatus !== 'connected' && intervalRef.current) {
        // Ensure we're using the normal poll interval when not connected
        // (handled by restart logic below)
      }

    } catch (error: any) {
      if (!mountedRef.current) return;

      // Background polls: silent failure — keep last known status
      if (!isBackground) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.response?.data?.message || 'Failed to fetch status',
          status: 'unknown',
        }));
      }
    }
  }, [instanceName, enabled]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();

    // First fetch — show loading
    if (isFirstFetchRef.current) {
      isFirstFetchRef.current = false;
      fetchStatus(false);
    } else {
      fetchStatus(true);
    }

    const interval = currentStatusRef.current === 'connected' ? CONNECTED_POLL_INTERVAL : pollInterval;
    intervalRef.current = setInterval(() => fetchStatus(true), interval);
  }, [fetchStatus, pollInterval, stopPolling]);

  const refresh = useCallback(() => {
    fetchStatus(false); // Manual refresh shows loading spinner
  }, [fetchStatus]);

  useEffect(() => {
    if (!instanceName || !enabled) {
      stopPolling();
      return;
    }

    isFirstFetchRef.current = true;
    startPolling();

    return () => {
      stopPolling();
    };
  }, [instanceName, enabled, pollInterval]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, []);

  return {
    ...state,
    refresh,
    startPolling,
    stopPolling,
  };
}
