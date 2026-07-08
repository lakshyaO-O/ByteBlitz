'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type JudgeStatusType = 'ONLINE' | 'MAINTENANCE' | 'OFFLINE' | 'LOADING';

export interface JudgeStatusInfo {
  status: JudgeStatusType;
  judge0Configured: boolean;
  pistonConfigured: boolean;
  judge0Reachable: boolean;
  pistonReachable: boolean;
  reason?: string;
  timestamp?: string;
}

const POLL_INTERVAL = 30000;

export function useJudgeStatus() {
  const [info, setInfo] = useState<JudgeStatusInfo>({
    status: 'LOADING',
    judge0Configured: false,
    pistonConfigured: false,
    judge0Reachable: false,
    pistonReachable: false,
    reason: 'Checking...',
  });

  const mountedRef = useRef(true);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/judge/health');
      const data = await res.json();

      const judge0Configured = data.judge0?.configured ?? false;
      const pistonConfigured = data.piston?.configured ?? false;
      const judge0Reachable = data.judge0?.reachable ?? false;
      const pistonReachable = data.piston?.reachable ?? false;

      const anyConfigured = judge0Configured || pistonConfigured;
      const anyReachable = judge0Reachable || pistonReachable;

      let status: JudgeStatusType;
      let reason: string | undefined;

      if (anyReachable) {
        status = 'ONLINE';
      } else if (!anyConfigured) {
        status = 'MAINTENANCE';
        reason = 'Execution server not configured';
      } else {
        status = 'OFFLINE';
        reason = 'Execution backend unreachable';
      }

      if (mountedRef.current) {
        setInfo({
          status,
          judge0Configured,
          pistonConfigured,
          judge0Reachable,
          pistonReachable,
          reason,
          timestamp: data.timestamp,
        });
      }
    } catch {
      if (mountedRef.current) {
        setInfo(prev => ({
          ...prev,
          status: 'MAINTENANCE',
          reason: 'Execution server not configured',
        }));
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    checkHealth();
    const interval = setInterval(checkHealth, POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [checkHealth]);

  return info;
}
