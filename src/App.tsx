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
  ShieldCheck
} from 'lucide-react';
import { TradingTerminalView } from './components/terminal/TradingTerminalView';
import { TraderBrainView } from './components/terminal/TraderBrainView';
import { NewsCatalystView } from './components/terminal/NewsCatalystView';
import { TradeJournalView } from './components/terminal/TradeJournalView';
import { quantTraderBrain, TraderBrainState } from './services/QuantTraderBrain';
import { continuousLearningService } from './services/continuousLearningService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'brain' | 'news' | 'journal'>('terminal');
  const [selectedTicker, setSelectedTicker] = useState<string>('NVDA');
  const [brainState, setBrainState] = useState<TraderBrainState>(() => quantTraderBrain.getState());

  useEffect(() => {
    return quantTraderBrain.subscribe(setBrainState);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-emerald-500 selection:text-white flex flex-col justify-between">
      {/* 1. Global Navigation & Branding Header */}
      <header className="bg-zinc-900/90 border-b border-zinc-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
            
            {/* Brand Logo & Learning Badge */}
            <div className="flex items-center gap-3">
              <div 
                onClick={() => setActiveTab('terminal')}
                className="flex items-center gap-2 cursor-pointer select-none group"
              >
                <div className="bg-emerald-600 text-white font-black text-sm px-2.5 py-1 rounded-lg tracking-tighter shadow-md group-hover:bg-emerald-500 transition-colors flex items-center gap-1.5">
                  <Brain className="w-4 h-4" />
                  QUANTTRADE
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1">
                    LEARNING TRADER <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">PRO</span>
                  </span>
                </div>
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
            </div>

            {/* Streamlined Primary Navigation (4 Focused Tabs) */}
            <nav className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'terminal'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Terminal
              </button>

              <button
                onClick={() => setActiveTab('brain')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 relative ${
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
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
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
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'journal'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Trade Log
              </button>
            </nav>

            {/* Portfolio Balance Readout */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right font-mono">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Portfolio Capital</span>
                <span className="text-sm font-black text-white">${brainState.stats.capital.toLocaleString()}</span>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${brainState.stats.netPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {brainState.stats.netPnl >= 0 ? '+' : ''}${brainState.stats.netPnl.toLocaleString()}
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
            onSelectTicker={setSelectedTicker}
            onNavigateToBrain={() => setActiveTab('brain')}
          />
        )}

        {activeTab === 'brain' && (
          <TraderBrainView
            onNavigateToTerminal={() => setActiveTab('terminal')}
            onNavigateToNews={() => setActiveTab('news')}
          />
        )}

        {activeTab === 'news' && (
          <NewsCatalystView
            onSelectTicker={(ticker) => {
              setSelectedTicker(ticker);
              setActiveTab('terminal');
            }}
          />
        )}

        {activeTab === 'journal' && (
          <TradeJournalView
            onSelectTicker={(ticker) => {
              setSelectedTicker(ticker);
              setActiveTab('terminal');
            }}
          />
        )}
      </main>

      {/* 3. Streamlined Clean Institutional Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">QuantTrade Pro Intelligence Systems</span>
            <span className="text-zinc-700">·</span>
            <span>Self-calibrating technical analysis & quant reinforcement learning</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span>Kalman Drift</span>
            <span className="text-zinc-700">·</span>
            <span>GARCH Volatility</span>
            <span className="text-zinc-700">·</span>
            <span>Ornstein-Uhlenbeck Reversion</span>
            <span className="text-zinc-700">·</span>
            <span>Half-Kelly Sizing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
