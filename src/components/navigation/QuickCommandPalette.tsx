import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  BarChart3,
  Target,
  Brain,
  Newspaper,
  History,
  ShieldCheck,
  FileText,
  Waves,
  Eye,
  Sliders,
  Database,
  ArrowRight,
  X,
  Command,
  TrendingUp,
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';
import { findNearestRelevantMatch } from '../../utils/intelligentSearch';

interface QuickCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTicker: (ticker: string) => void;
  onNavigateTab: (tab: 'terminal' | 'intraday' | 'brain' | 'news' | 'journal' | 'terms') => void;
  onOpenVault: () => void;
  onOpenTearSheet: () => void;
  onSelectTerminalSubTab?: (subTab: string) => void;
}

interface CommandItem {
  id: string;
  category: 'NAVIGATION' | 'QUANT_TOOL' | 'TICKER' | 'ACTION';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
}

const POPULAR_TICKERS = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors' },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Consumer Electronics' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Software' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'EV & Autonomous' },
  { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'Enterprise AI' },
  { symbol: 'SHOP.TO', name: 'Shopify Inc. (TSX)', sector: 'E-Commerce' },
  { symbol: 'PSEC', name: 'Prospect Capital', sector: 'High Yield BDC' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'Index Fund' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'Tech Index' }
];

export const QuickCommandPalette: React.FC<QuickCommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTicker,
  onNavigateTab,
  onOpenVault,
  onOpenTearSheet,
  onSelectTerminalSubTab
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Keyboard listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Static commands list
  const baseCommands: CommandItem[] = useMemo(() => [
    {
      id: 'nav-terminal',
      category: 'NAVIGATION',
      title: 'Trading Terminal',
      subtitle: 'Live interactive chart, execution DOM & order book',
      icon: <BarChart3 className="w-4 h-4 text-emerald-400" />,
      action: () => { onNavigateTab('terminal'); onClose(); }
    },
    {
      id: 'nav-intraday',
      category: 'NAVIGATION',
      title: 'Intraday Picks & Setups',
      subtitle: 'Suggestive buy zones, out price caps & time windows',
      icon: <Target className="w-4 h-4 text-emerald-400" />,
      action: () => { onNavigateTab('intraday'); onClose(); }
    },
    {
      id: 'nav-brain',
      category: 'NAVIGATION',
      title: 'Trader Brain & Continuous Learning',
      subtitle: 'Autonomous reinforcement learning & trade decisions',
      icon: <Brain className="w-4 h-4 text-indigo-400" />,
      action: () => { onNavigateTab('brain'); onClose(); }
    },
    {
      id: 'nav-news',
      category: 'NAVIGATION',
      title: 'News Catalysts & SEC Insiders',
      subtitle: 'Official SEC Form 4 insider flow & market events',
      icon: <Newspaper className="w-4 h-4 text-indigo-400" />,
      action: () => { onNavigateTab('news'); onClose(); }
    },
    {
      id: 'nav-journal',
      category: 'NAVIGATION',
      title: 'Trade Log & Journal',
      subtitle: 'Historical positions, trade journal & win rate telemetry',
      icon: <History className="w-4 h-4 text-zinc-400" />,
      action: () => { onNavigateTab('journal'); onClose(); }
    },
    {
      id: 'tool-fourier',
      category: 'QUANT_TOOL',
      title: 'Fourier Spectral Signal Filter',
      subtitle: 'Discrete low-pass frequency filtering & volatility bands',
      icon: <Waves className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onNavigateTab('terminal');
        onSelectTerminalSubTab?.('fourier');
        onClose();
      }
    },
    {
      id: 'tool-volumelens',
      category: 'QUANT_TOOL',
      title: 'VolumeLens & Institutional Flow',
      subtitle: 'Footprint delta clusters, CVD divergence & futures suite',
      icon: <Eye className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onNavigateTab('terminal');
        onSelectTerminalSubTab?.('volumelens');
        onClose();
      }
    },
    {
      id: 'tool-lse',
      category: 'QUANT_TOOL',
      title: 'London Strategic Edge Open ML',
      subtitle: 'Multi-asset forecasts powered by londonstrategicedge.com',
      icon: <Database className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onNavigateTab('terminal');
        onSelectTerminalSubTab?.('lse_edge');
        onClose();
      }
    },
    {
      id: 'tool-backtest',
      category: 'QUANT_TOOL',
      title: 'Quantitative Strategy Backtester',
      subtitle: 'Event-driven backtesting with Half-Kelly money management',
      icon: <Sliders className="w-4 h-4 text-purple-400" />,
      action: () => {
        onNavigateTab('terminal');
        onSelectTerminalSubTab?.('backtest');
        onClose();
      }
    },
    {
      id: 'action-vault',
      category: 'ACTION',
      title: 'Security Vault & Key Enclave',
      subtitle: 'Manage encrypted AES-256 API keys & view cybersecurity audit',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      action: () => { onOpenVault(); onClose(); }
    },
    {
      id: 'action-tearsheet',
      category: 'ACTION',
      title: 'Institutional Risk Tear Sheet',
      subtitle: 'Generate executive PDF/CSV risk & attribution tear sheet',
      icon: <FileText className="w-4 h-4 text-emerald-400" />,
      action: () => { onOpenTearSheet(); onClose(); }
    }
  ], [onNavigateTab, onOpenVault, onOpenTearSheet, onSelectTerminalSubTab, onClose]);

  // Filtered commands and stock matches
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return baseCommands;
    }

    const matchedCommands = baseCommands.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.subtitle.toLowerCase().includes(q)
    );

    // Intelligent stock search
    const fuzzy = findNearestRelevantMatch(query.trim(), 5);
    const tickerMatches: CommandItem[] = [];

    // Add best exact/fuzzy match first
    if (fuzzy && fuzzy.resolvedTicker) {
      const matchName = fuzzy.exactMatch?.name || fuzzy.didYouMean?.name || fuzzy.nearestMatches[0]?.item.name || fuzzy.resolvedTicker;
      const simScore = fuzzy.nearestMatches[0]?.similarityScore != null ? Math.round(fuzzy.nearestMatches[0].similarityScore * 100) : 100;
      tickerMatches.push({
        id: `ticker-${fuzzy.resolvedTicker}`,
        category: 'TICKER',
        title: `${fuzzy.resolvedTicker} · ${matchName}`,
        subtitle: `Switch active chart & analysis to ${fuzzy.resolvedTicker} (${simScore}% match)`,
        icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onSelectTicker(fuzzy.resolvedTicker);
          onNavigateTab('terminal');
          onClose();
        }
      });
    }

    // Add popular tickers matching query
    POPULAR_TICKERS.forEach(t => {
      if (
        (t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) &&
        (!fuzzy || fuzzy.resolvedTicker !== t.symbol)
      ) {
        tickerMatches.push({
          id: `ticker-${t.symbol}`,
          category: 'TICKER',
          title: `${t.symbol} · ${t.name}`,
          subtitle: `${t.sector} · Open live chart and quantitative models`,
          icon: <TrendingUp className="w-4 h-4 text-cyan-400" />,
          action: () => {
            onSelectTicker(t.symbol);
            onNavigateTab('terminal');
            onClose();
          }
        });
      }
    });

    return [...tickerMatches, ...matchedCommands];
  }, [query, baseCommands, onSelectTicker, onNavigateTab, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-800/80 flex items-center gap-3 bg-zinc-900/60">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a stock ticker (e.g. NVDA, SHOP.TO) or tool name..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none font-mono"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">ESC</span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-zinc-500">
              No matching stocks or navigation commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isSelected ? 'bg-zinc-900 text-white' : 'text-zinc-300 hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isSelected ? 'bg-zinc-800 text-emerald-400' : 'bg-zinc-900/80 text-zinc-400'
                    }`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-normal ${
                          item.category === 'TICKER' ? 'bg-emerald-500/20 text-emerald-300' :
                          item.category === 'QUANT_TOOL' ? 'bg-cyan-500/20 text-cyan-300' :
                          item.category === 'NAVIGATION' ? 'bg-zinc-800 text-zinc-400' :
                          'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate font-mono">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-xs font-mono text-zinc-500">
                    {isSelected && (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <span>Jump</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-zinc-900/90 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span><kbd className="text-zinc-300 font-bold">↑↓</kbd> navigate</span>
            <span><kbd className="text-zinc-300 font-bold">↵</kbd> select</span>
            <span><kbd className="text-zinc-300 font-bold">esc</kbd> close</span>
          </div>
          <span>QuantTrade Command Palette</span>
        </div>
      </div>
    </div>
  );
};
