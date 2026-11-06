import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  BarChart3, 
  Newspaper, 
  History, 
  Radio, 
  Sparkles, 
  Target, 
  Sliders, 
  RotateCw,
  Search,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Scale,
  FileText
} from 'lucide-react';
import { TradingTerminalView } from './components/terminal/TradingTerminalView';
import { IntradaySuggestiveTradeView } from './components/terminal/IntradaySuggestiveTradeView';
import { TraderBrainView } from './components/terminal/TraderBrainView';
import { NewsCatalystView } from './components/terminal/NewsCatalystView';
import { TradeJournalView } from './components/terminal/TradeJournalView';
import { InstitutionalRiskTearSheet } from './components/terminal/InstitutionalRiskTearSheet';
import { InstitutionalSecurityVaultModal } from './components/security/InstitutionalSecurityVaultModal';
import { TermsAndConditionsView } from './components/legal/TermsAndConditionsView';
import { QuickCommandPalette } from './components/navigation/QuickCommandPalette';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineConnectivityBanner } from './components/OfflineConnectivityBanner';
import { quantTraderBrain, TraderBrainState } from './services/QuantTraderBrain';
import { continuousLearningService } from './services/continuousLearningService';
import { securityVaultService, VaultState } from './services/securityVaultService';

const getInitialTicker = (): string => {
  try {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTicker = urlParams.get('ticker') || urlParams.get('symbol');
      if (urlTicker && urlTicker.trim()) {
        return urlTicker.trim().toUpperCase();
      }
      const saved = localStorage.getItem('quant_terminal_active_ticker');
      if (saved && saved.trim()) {
        return saved.trim().toUpperCase();
      }
    }
  } catch {
    // fallback
  }
  return 'NVDA';
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'intraday' | 'brain' | 'news' | 'journal' | 'terms'>('terminal');
  const [selectedTicker, setSelectedTicker] = useState<string>(getInitialTicker);
  const [brainState, setBrainState] = useState<TraderBrainState>(() => quantTraderBrain.getState());
  const [isGlobalTearSheetOpen, setIsGlobalTearSheetOpen] = useState<boolean>(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);
  const [vaultState, setVaultState] = useState<VaultState>(() => securityVaultService.getState());
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const handleSelectTicker = (ticker: string) => {
    const clean = ticker.trim().toUpperCase();
    if (!clean) return;
    setSelectedTicker(clean);
    try {
      localStorage.setItem('quant_terminal_active_ticker', clean);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('ticker', clean);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  };

  useEffect(() => {
    const unsubBrain = quantTraderBrain.subscribe(setBrainState);
    const unsubVault = securityVaultService.subscribe(setVaultState);
    
    // Global Cmd+K / Ctrl+K keyboard shortcut to open Quick Command Palette
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubBrain();
      unsubVault();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-emerald-500 selection:text-white flex flex-col justify-between">
      {/* Offline Market Vault & Minimal Connectivity Banner */}
      <OfflineConnectivityBanner />

      {/* 1. Global Navigation & Branding Header */}
      <header className="bg-zinc-900/90 border-b border-zinc-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-2.5 sm:py-3 gap-2.5 sm:gap-3">
            
            {/* Brand Logo & Learning Badge */}
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div 
                onClick={() => setActiveTab('terminal')}
                className="flex items-center gap-2 cursor-pointer select-none group"
              >
                <div className="bg-emerald-600 text-white font-black text-xs sm:text-sm px-2.5 py-1 rounded-lg tracking-tighter shadow-md group-hover:bg-emerald-500 transition-colors flex items-center gap-1.5">
                  <Brain className="w-4 h-4" />
                  QUANTTRADE
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1">
                    LEARNING TRADER <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">PRO</span>
                  </span>
                </div>
              </div>

              <div className="flex sm:hidden items-center gap-2">
                <PWAInstallButton />
              </div>

              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-zinc-800 text-xs">
                <span className="flex items-center gap-1.5 text-zinc-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Day {brainState.stats.learningDay} Epoch
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400 font-mono">
                  Win Rate: <span className="text-emerald-400 font-bold">{brainState.stats.winRate.toFixed(1)}%</span>
                </span>
              </div>

              {/* Educational & Research Mandate Header Tag */}
              <div 
                onClick={() => setActiveTab('terms')}
                className="cursor-pointer hidden lg:flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors select-none"
                title="Mandatory Notice: For Educational & Research Purposes Only"
              >
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span>Educational &amp; Research Use Only</span>
              </div>
            </div>

            {/* Streamlined Primary Navigation (Focused Tabs with Horizontal Scroll for Mobile) */}
            <nav className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold uppercase tracking-wider overflow-x-auto no-scrollbar scroll-smooth">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'terminal'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Terminal
              </button>

              <button
                onClick={() => setActiveTab('intraday')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 relative whitespace-nowrap shrink-0 ${
                  activeTab === 'intraday'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40 ring-1 ring-emerald-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Suggestive Intraday Trade Setups, Exact Buy Price, Out Price Cap & Everyday Research"
              >
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Intraday Picks</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              <button
                onClick={() => setActiveTab('brain')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 relative whitespace-nowrap shrink-0 ${
                  activeTab === 'brain'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                Trader Brain
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
              </button>

              <button
                onClick={() => setActiveTab('news')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'news'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                News Catalysts
              </button>

              <button
                onClick={() => setActiveTab('journal')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'journal'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Trade Log
              </button>

              <button
                onClick={() => setActiveTab('terms')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'terms'
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-950/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Terms of Use, Regulatory Disclaimers & Educational Purpose Mandate"
              >
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Terms &amp; Research
              </button>
            </nav>

            {/* Global Actions & Portfolio Balance Readout */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              {/* Quick Search & Command Palette Trigger (Cmd+K) */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-all font-mono shadow-inner group"
                title="Search any stock, ticker, model, or tool (⌘K / Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                <span className="hidden md:inline text-zinc-400">Search</span>
                <kbd className="hidden sm:inline text-[9px] bg-zinc-800 text-zinc-400 group-hover:text-zinc-200 px-1.5 py-0.5 rounded border border-zinc-700 font-sans font-bold">⌘K</kbd>
              </button>

              <div className="hidden sm:block">
                <PWAInstallButton />
              </div>

              <button
                onClick={() => setIsVaultModalOpen(true)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl border font-mono text-xs flex items-center gap-1.5 transition-all shadow-sm font-bold ${
                  vaultState.isUnlocked
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 shadow-emerald-950/40'
                    : vaultState.isConfigured
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800'
                }`}
                title="Institutional Security Enclave: AES-256-GCM Zero-Knowledge Key Vault & Threat Audit"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${vaultState.isUnlocked ? 'text-emerald-400' : 'text-cyan-400'}`} />
                <span className="hidden sm:inline">Security Vault</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-bold bg-zinc-800/80">
                  {vaultState.isUnlocked ? 'Unlocked' : vaultState.isConfigured ? 'AES-256' : 'Setup'}
                </span>
              </button>

              <button
                onClick={() => setIsGlobalTearSheetOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 font-mono text-xs flex items-center gap-1.5 transition-colors shadow-sm font-bold"
                title="Open Executive Risk Tear Sheet & Report Generator"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span className="inline">Risk Tear Sheet</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-sans font-bold hidden sm:inline">PDF/CSV</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-zinc-800">
                <div className="text-right font-mono">
                  <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-bold block">Portfolio</span>
                  <span className="text-xs sm:text-sm font-black text-white">${brainState.stats.capital.toLocaleString()}</span>
                </div>
                <div className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[11px] sm:text-xs font-mono font-bold ${brainState.stats.netPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {brainState.stats.netPnl >= 0 ? '+' : ''}${brainState.stats.netPnl.toLocaleString()}
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* 2. Main Body Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {activeTab === 'terminal' && (
          <TradingTerminalView
            selectedTicker={selectedTicker}
            onSelectTicker={handleSelectTicker}
            onNavigateToBrain={() => setActiveTab('brain')}
          />
        )}

        {activeTab === 'intraday' && (
          <IntradaySuggestiveTradeView
            onNavigateToTerminal={(ticker) => {
              handleSelectTicker(ticker);
              setActiveTab('terminal');
            }}
            onTradeExecuted={(msg) => {
              console.log('[QuantTrade Intraday Execution]', msg);
            }}
          />
        )}

        {activeTab === 'brain' && (
          <TraderBrainView
            selectedTicker={selectedTicker}
            onSelectTicker={handleSelectTicker}
            onNavigateToTerminal={() => setActiveTab('terminal')}
            onNavigateToNews={() => setActiveTab('news')}
          />
        )}

        {activeTab === 'news' && (
          <NewsCatalystView
            onSelectTicker={(ticker) => {
              handleSelectTicker(ticker);
              setActiveTab('terminal');
            }}
          />
        )}

        {activeTab === 'journal' && (
          <TradeJournalView
            onSelectTicker={(ticker) => {
              handleSelectTicker(ticker);
              setActiveTab('terminal');
            }}
          />
        )}

        {activeTab === 'terms' && (
          <TermsAndConditionsView
            onNavigateToTerminal={() => setActiveTab('terminal')}
          />
        )}
      </main>

      {/* 3. Streamlined Clean Institutional Footer with Educational & Legal Disclaimers */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white">QuantTrade Pro Intelligence Systems</span>
              <span className="text-zinc-700">·</span>
              <span>Open-source market data &amp; ML models powered by <a href="https://londonstrategicedge.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline font-mono">londonstrategicedge.com</a></span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <button
                onClick={() => setIsVaultModalOpen(true)}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Security Vault &amp; Audit</span>
              </button>
              <button
                onClick={() => setActiveTab('terms')}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Terms &amp; Disclaimers</span>
              </button>
              <button
                onClick={() => setIsGlobalTearSheetOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Risk Tear Sheet</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500 font-sans">
            <p className="text-center sm:text-left leading-relaxed">
              <strong>Mandatory Notice:</strong> QuantTrade Pro and all associated algorithmic models, Fourier filters, and price trajectories are strictly for <strong>educational, academic, and research purposes only</strong>. Not registered investment, financial, or legal advice. No fiduciary relationship is formed. Past simulated performance does not guarantee future results.
            </p>
            <span className="shrink-0 text-zinc-600 font-mono text-[10px]">
              &copy; 2026 QuantTrade Pro · Academic Research License
            </span>
          </div>
        </div>
      </footer>

      {/* Institutional Risk Tear Sheet Modal */}
      <InstitutionalRiskTearSheet
        isOpen={isGlobalTearSheetOpen}
        onClose={() => setIsGlobalTearSheetOpen(false)}
        selectedTicker={selectedTicker}
      />

      {/* Institutional Cryptographic Security Vault & Threat Audit Modal */}
      <InstitutionalSecurityVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />

      {/* Universal Quick Command Palette (Cmd+K / Ctrl+K) */}
      <QuickCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTicker={handleSelectTicker}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenVault={() => setIsVaultModalOpen(true)}
        onOpenTearSheet={() => setIsGlobalTearSheetOpen(true)}
      />
    </div>
  );
}
