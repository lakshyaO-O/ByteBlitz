'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineQueue } from '@/hooks/use-offline-queue';

export function OfflineStatusBar() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { queueLength, syncing } = useOfflineQueue();

  return (
    <AnimatePresence>
      {(!isOnline || wasOffline || queueLength > 0) && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-50 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2',
            isOnline ? 'bg-emerald-600 text-white' : 'bg-destructive text-destructive-foreground'
          )}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-3 h-3" />
              You are offline. Changes will sync when connection restores.
            </>
          ) : wasOffline ? (
            <>
              <Wifi className="w-3 h-3" />
              Back online!
              {syncing ? (
                <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Syncing...</span>
              ) : queueLength > 0 ? (
                <span>{queueLength} pending {queueLength === 1 ? 'action' : 'actions'}</span>
              ) : (
                <span>All synced</span>
              )}
            </>
          ) : queueLength > 0 ? (
            <>
              <RefreshCw className={cn('w-3 h-3', syncing && 'animate-spin')} />
              {syncing ? 'Syncing...' : `${queueLength} pending updates`}
            </>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
