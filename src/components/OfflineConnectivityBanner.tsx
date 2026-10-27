import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Database, CheckCircle, ShieldAlert } from 'lucide-react';
import { offlineMarketVaultService, NetworkHealthState } from '../services/offlineMarketVaultService';

export const OfflineConnectivityBanner: React.FC = () => {
  const [health, setHealth] = useState<NetworkHealthState>(() => offlineMarketVaultService.getNetworkHealth());
  const [isSyncing, setIsSyncing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    return offlineMarketVaultService.subscribe((newHealth) => {
      setHealth(newHealth);
      // Auto un-dismiss if transitioned to offline
      if (!newHealth.isOnline) {
        setDismissed(false);
      }
    });
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      // Test ping
      const res = await fetch('/api/health').catch(() => null);
      if (res && res.ok) {
        window.location.reload();
      }
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  if (dismissed) return null;

  // If online and good connection, do not render intrusive banner (just let the terminal indicator handle it)
  if (health.isOnline && !health.isMinimalInternet) {
    return null;
  }

  const isCompleteOffline = !health.isOnline;

  return (
    <div className={`w-full px-3 py-2 border-b text-xs transition-colors duration-300 ${
      isCompleteOffline 
        ? 'bg-amber-950/70 border-amber-800/60 text-amber-200' 
        : 'bg-blue-950/70 border-blue-800/60 text-blue-200'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isCompleteOffline ? (
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          ) : (
            <Wifi className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-white">
              {isCompleteOffline ? 'Offline Mode Active' : 'Low-Bandwidth Mobile Connection'}
            </span>
            <span className="text-zinc-300 hidden sm:inline">•</span>
            <span className="text-zinc-300">
              Serving verified institutional prices & historical candles from local market vault.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800/80 hover:bg-zinc-700/80 text-white border border-zinc-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Testing...' : 'Sync Now'}</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="px-1.5 py-0.5 rounded text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
