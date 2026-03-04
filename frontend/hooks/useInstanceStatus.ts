"use client";

import { useState, useEffect, useRef } from "react";
import { connectionApi } from "@/lib/api";
import type { ConnectionStatus, InstanceConnectionInfo } from "@/lib/types";

interface UseInstanceStatusOptions {
  instanceName: string;
  pollInterval?: number; // in milliseconds, default 5000
  enabled?: boolean;
}

interface InstanceStatusState {
  status: ConnectionStatus;
  connectionInfo?: InstanceConnectionInfo;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useInstanceStatus({
  instanceName,
  pollInterval = 5000,
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

  const fetchStatus = async () => {
    if (!enabled || !mountedRef.current) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await connectionApi.getStatus(instanceName);
      const data = response.data;
      
      if (!mountedRef.current) return;

      setState(prev => ({
        ...prev,
        status: data.status || 'unknown',
        connectionInfo: data,
        isLoading: false,
        lastUpdated: new Date(),
      }));
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error('Failed to fetch instance status:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch status',
        status: 'unknown',
      }));
    }
  };

  const startPolling = () => {
    if (intervalRef.current) return;
    
    // Fetch immediately
    fetchStatus();
    
    // Then poll every interval
    intervalRef.current = setInterval(fetchStatus, pollInterval);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const refresh = () => {
    fetchStatus();
  };

  useEffect(() => {
    if (!instanceName || !enabled) {
      stopPolling();
      return;
    }

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
