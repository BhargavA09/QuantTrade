import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, do not show install button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-sm border border-emerald-500/40 transition active:scale-95 cursor-pointer ${className}`}
        title="Install QuantTrade on your phone or computer for fast offline access"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 transition active:scale-95 cursor-pointer ${className}`}
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl text-zinc-100">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-semibold tracking-wide">Install QuantTrade on iOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs text-zinc-300">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-zinc-800 border border-zinc-700 text-emerald-400 shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <p className="leading-relaxed">
                    1. Tap the <strong className="text-white">Share</strong> icon at the bottom of the Safari toolbar.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-zinc-800 border border-zinc-700 text-emerald-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <p className="leading-relaxed">
                    2. Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                  </p>
                </div>

                <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 leading-normal">
                  Enjoy accurate instant stock pricing, offline market vault access, and full-screen terminal experience on your phone.
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
