import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Target,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  BarChart3,
  Search,
  Sliders,
  RotateCw,
  ExternalLink,
  ShieldAlert,
  Flame,
  Radio,
  Layers,
  Compass,
  ArrowRight,
  BookOpen,
  DollarSign
} from 'lucide-react';
import {
  intradayStrategyEngine,
  IntradayStockRecommendation,
  EverydayMarketDigest
} from '../../services/intradayStrategyEngine';
import { quantTraderBrain } from '../../services/QuantTraderBrain';
import { findNearestRelevantMatch } from '../../utils/intelligentSearch';

interface IntradaySuggestiveTradeViewProps {
  onNavigateToTerminal?: (ticker: string) => void;
  onTradeExecuted?: (message: string) => void;
}

export const IntradaySuggestiveTradeView: React.FC<IntradaySuggestiveTradeViewProps> = ({
  onNavigateToTerminal,
  onTradeExecuted
}) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'PENNY' | 'LARGE_CAP' | 'CANADIAN_TSX' | 'GLOBAL'>('ALL');
  const [recommendations, setRecommendations] = useState<IntradayStockRecommendation[]>(() => 
    intradayStrategyEngine.getEverydayBuyRecommendations()
  );
  const [digest, setDigest] = useState<EverydayMarketDigest>(() => 
    intradayStrategyEngine.getEverydayMarketResearchDigest()
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedResearchTicker, setExpandedResearchTicker] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedTicker, setCopiedTicker] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>(() => 
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const refreshData = () => {
    setRecommendations(intradayStrategyEngine.getEverydayBuyRecommendations());
    setDigest(intradayStrategyEngine.getEverydayMarketResearchDigest());
    setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    showToast('✓ Live Intraday Buy Recommendations & Out Price Caps Recalibrated');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleCopyPlan = (rec: IntradayStockRecommendation) => {
    const symCurr = rec.ticker.endsWith('.TO') ? 'C$' : (rec.ticker.endsWith('.L') ? '£' : '$');
    const dec = rec.currentPrice < 1 ? 4 : 2;

    const planText = [
      `🎯 INTRADAY SUGGESTED TRADE PLAN · ${rec.ticker} (${rec.name})`,
      `Directive: ${rec.recommendation.replace(/_/g, ' ')} (${rec.actionTag}) · Score: ${rec.recommendationScore}%`,
      `Current Price: ${symCurr}${rec.currentPrice.toFixed(dec)}`,
      `Suggested Buy Entry: ${symCurr}${rec.suggestedBuyEntry.toFixed(dec)}`,
      `Suggested Buy Zone: ${symCurr}${rec.suggestedBuyZone.min.toFixed(dec)} - ${symCurr}${rec.suggestedBuyZone.max.toFixed(dec)}`,
      `Out Price Cap (Max Target): ${symCurr}${rec.outPriceCap.toFixed(dec)} (+${rec.outPriceCapGainPct.toFixed(1)}%)`,
      `Scalp Trim Cap (50% out): ${symCurr}${rec.scalpTrimCap.toFixed(dec)}`,
      `Hard Stop-Loss: ${symCurr}${rec.hardStopLoss.toFixed(dec)}`,
      `Risk/Reward Ratio: ${rec.riskRewardRatio}`,
      `Execution Time Window: ${rec.suggestiveTimeWindow}`,
      `Mandatory Cap Out Time: ${rec.capOutTimeLimit}`,
      `Optimal Holding Period: ${rec.everydayResearch.optimalHoldingMinutes}`,
      `Why Buy Today: ${rec.everydayResearch.whyBuyReason}`,
      `Educational Mandate: Strictly for research and simulation purposes.`
    ].join('\n');

    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(planText);
      }
    } catch {}

    setCopiedTicker(rec.ticker);
    showToast(`✓ Copied full trade plan for ${rec.ticker} to clipboard!`);
    setTimeout(() => setCopiedTicker(null), 3000);
  };

  const handleExecuteBuyOrder = (rec: IntradayStockRecommendation) => {
    try {
      const trade = quantTraderBrain.executeOrder(
        rec.ticker,
        'LONG',
        rec.suggestedBuyEntry,
        `Intraday Suggestion: ${rec.recommendation}`
      );

      const msg = `🚀 Executed BUY order on ${rec.ticker} @ $${rec.suggestedBuyEntry.toFixed(rec.currentPrice < 1 ? 4 : 2)}! Out Price Cap set at $${rec.outPriceCap.toFixed(2)}`;
      showToast(msg);
      if (onTradeExecuted) onTradeExecuted(msg);
    } catch (err: any) {
      showToast(`Trade initiated on ${rec.ticker} with Out Price Cap $${rec.outPriceCap}`);
    }
  };

  const filteredRecommendations = useMemo(() => {
    let list = recommendations;
    if (activeCategory !== 'ALL') {
      list = list.filter(r => r.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      const fuzzy = findNearestRelevantMatch(q, 6);
      const topSymbols = new Set(fuzzy.nearestMatches.map(m => m.item.ticker));
      topSymbols.add(fuzzy.resolvedTicker);

      list = list.filter(r => 
        r.ticker.includes(q) || 
        r.name.toUpperCase().includes(q) || 
        topSymbols.has(r.ticker)
      );
    }
    return list;
  }, [recommendations, activeCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center justify-between shadow-2xl animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-zinc-500 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* 1. Header Banner & Everyday Research Digest */}
      <div className="rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-emerald-950/40 border border-zinc-800 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                <Target className="w-3 h-3 text-emerald-400" />
                SUGGESTIVE INTRADAY TRADE HUB
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                DAILY BUY WINDOWS &amp; CAPS
              </span>
              <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Calibrated {lastRefreshed}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Intraday Stock Picks, Buy Zones &amp; Research</span>
            </h1>

            <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
              Everyday curated trading opportunities calculated using VWAP reversion, order book liquidity sweeps, and SEC Form 4 insider flow. View the exact <strong>Buy Price Zone</strong>, the definitive <strong>Out Price Cap</strong>, optimal <strong>Time Window</strong>, and <strong>Why Buy Today</strong> research thesis before placing trades.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refreshData}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              <RotateCw className="w-4 h-4" />
              <span>Refresh Daily Setups</span>
            </button>
          </div>
        </div>

        {/* Everyday Research Digest Strip */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Today's Macro Regime</span>
            <div className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {digest.macroRegime}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">Bias: {digest.regimeBias}</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Focus Sectors</span>
            <div className="text-xs font-bold text-zinc-200 font-mono truncate">
              {digest.dailyFocusSector}
            </div>
            <div className="text-[10px] text-cyan-400 font-mono">Penny Squeeze Index: {digest.pennyStockSqueezeIndex}/100</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Out Price Cap Mandate</span>
            <div className="text-xs font-bold text-amber-300 font-mono">
              Exit Before 15:45 PM EST
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">Zero Overnight Risk Rule</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Model Breadth Score</span>
            <div className="text-xs font-bold text-emerald-400 font-mono">
              {digest.breadthScore}% Positive
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">{filteredRecommendations.length} Stocks Ready in Zone</div>
          </div>
        </div>
      </div>

      {/* 2. Controls, Category Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'ALL', label: 'All Picks', icon: '🌐' },
            { id: 'PENNY', label: 'Penny Stocks (< $5)', icon: '🪙' },
            { id: 'LARGE_CAP', label: 'Mega-Cap Tech', icon: '🇺🇸' },
            { id: 'CANADIAN_TSX', label: 'Canadian TSX', icon: '🇨🇦' },
            { id: 'GLOBAL', label: 'Global & LSE', icon: '🇬🇧' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeCategory === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Quick Ticker Search Filter */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suggested stocks..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. Cards Grid: Suggestive Intraday Trade Setups */}
      {filteredRecommendations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 font-mono">
          <Target className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="text-sm font-bold text-zinc-300">No stocks match your active filter</div>
          <p className="text-xs text-zinc-500">Try selecting "All Picks" or clearing your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRecommendations.map((rec) => {
            const symCurr = rec.ticker.endsWith('.TO') ? 'C$' : (rec.ticker.endsWith('.L') ? '£' : '$');
            const dec = rec.currentPrice < 1 ? 4 : 2;
            const isResearchExpanded = expandedResearchTicker === rec.ticker;

            return (
              <div
                key={rec.ticker}
                className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-4 shadow-xl hover:border-zinc-700/80 transition-all flex flex-col justify-between group"
              >
                {/* Header: Ticker, Name, Category & Conviction Directive */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-white group-hover:text-emerald-400 transition-colors">
                          {rec.ticker}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                          {rec.exchange}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {rec.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-xs text-zinc-300 font-medium truncate max-w-[220px] sm:max-w-xs">
                        {rec.name}
                      </h4>
                    </div>

                    {/* Recommendation Level Badge */}
                    <div className="text-right shrink-0">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono tracking-wider flex items-center gap-1 shadow-sm ${
                        rec.recommendation === 'STRONG_BUY'
                          ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                          : (rec.recommendation === 'BUY_ON_PULLBACK'
                            ? 'bg-cyan-600 text-white shadow-cyan-950/40'
                            : 'bg-amber-600 text-white shadow-amber-950/40')
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        <span>{rec.recommendation.replace(/_/g, ' ')}</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                        Confidence: <strong className="text-emerald-400">{rec.recommendationScore}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* 2-Column Core Price Grid: Buy Entry vs Out Price Cap */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono">
                    {/* Suggested Buy Entry & Buy Zone */}
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                        <Target className="w-3 h-3 text-emerald-400" />
                        <span>Suggested Buy Entry</span>
                      </div>
                      <div className="text-xl font-black text-white">
                        {symCurr}{rec.suggestedBuyEntry.toFixed(dec)}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Buy Zone: <strong className="text-emerald-300">{symCurr}{rec.suggestedBuyZone.min.toFixed(dec)} - {symCurr}{rec.suggestedBuyZone.max.toFixed(dec)}</strong>
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Spot: {symCurr}{rec.currentPrice.toFixed(dec)} ({rec.changePercent >= 0 ? '+' : ''}{rec.changePercent.toFixed(2)}%)
                      </div>
                    </div>

                    {/* Out Price Cap (Max Target) & First Scalp Trim */}
                    <div className="space-y-1 text-right border-l border-zinc-800/80 pl-3">
                      <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-end gap-1">
                        <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                        <span>Out Price Cap</span>
                      </div>
                      <div className="text-xl font-black text-cyan-400">
                        {symCurr}{rec.outPriceCap.toFixed(dec)}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold">
                        Target Return: +{rec.outPriceCapGainPct.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Scalp Trim 50%: {symCurr}{rec.scalpTrimCap.toFixed(dec)}
                      </div>
                    </div>
                  </div>

                  {/* Risk & Timing Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase">Hard Stop-Loss</span>
                      <span className="text-rose-400 font-bold">{symCurr}{rec.hardStopLoss.toFixed(dec)}</span>
                      <span className="text-[9px] text-zinc-500 block">R:R {rec.riskRewardRatio}</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase">Execution Window</span>
                      <span className="text-amber-300 font-bold truncate block">{rec.suggestiveTimeWindow.split('(')[0]}</span>
                      <span className="text-[9px] text-zinc-500 block">Holding: {rec.everydayResearch.optimalHoldingMinutes}</span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-zinc-800/80 pt-1.5 sm:pt-0 sm:pl-2">
                      <span className="text-[9px] text-zinc-500 block uppercase">Mandatory Exit Limit</span>
                      <span className="text-indigo-300 font-bold block">{rec.capOutTimeLimit}</span>
                      <span className="text-[9px] text-emerald-400 block">100% Flat Exit</span>
                    </div>
                  </div>

                  {/* Everyday Research Card / Accordion ("Why Buy This Stock Today") */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedResearchTicker(isResearchExpanded ? null : rec.ticker)}
                      className="w-full flex items-center justify-between text-xs font-mono font-bold text-zinc-300 hover:text-white py-1 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Why Buy Today: Everyday Market Research</span>
                      </span>
                      <span className="text-[10px] text-indigo-400">
                        {isResearchExpanded ? 'Hide Analysis ▲' : 'View Deep Thesis ▼'}
                      </span>
                    </button>

                    {isResearchExpanded && (
                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs font-mono text-zinc-300 animate-fade-in">
                        <div>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase block">Core Buy Catalyst</span>
                          <p className="text-[11px] leading-relaxed text-zinc-300">{rec.everydayResearch.whyBuyReason}</p>
                        </div>

                        <div className="pt-2 border-t border-zinc-800/80">
                          <span className="text-[10px] text-cyan-400 font-bold uppercase block">Out Price Cap Rationale</span>
                          <p className="text-[11px] leading-relaxed text-zinc-400">{rec.everydayResearch.whyOutPriceCapReason}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[10px]">
                          <div>
                            <span className="text-zinc-500">Institutional Flow Score:</span>{' '}
                            <strong className="text-emerald-400">{rec.everydayResearch.institutionalFlowScore}/100</strong>
                          </div>
                          <div>
                            <span className="text-zinc-500">Volume Profile:</span>{' '}
                            <strong className="text-zinc-200">{rec.everydayResearch.volumeProfileStatus}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Action Buttons: 1-Tap Execute Buy, Load into Terminal, Copy Plan */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyPlan(rec)}
                      className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 border border-zinc-700/60"
                      title="Copy complete trade parameters to clipboard"
                    >
                      {copiedTicker === rec.ticker ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTicker === rec.ticker ? 'Copied' : 'Plan'}</span>
                    </button>

                    {onNavigateToTerminal && (
                      <button
                        onClick={() => onNavigateToTerminal(rec.ticker)}
                        className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 border border-zinc-700/60"
                        title="Load into Live Technical Chart"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Chart</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleExecuteBuyOrder(rec)}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/50 active:scale-95"
                    title="1-Tap Buy Order: Prepares trade ticket at suggested buy entry"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Buy Stock Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Bottom Mandate Disclaimer */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 font-mono flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Educational &amp; Model Research Notice:</strong> All suggestive prices, buy zones, and out price caps are algorithmic outputs derived from quantitative backtesting and market microstructure research. Not financial advice.
          </span>
        </div>
        <span className="text-zinc-500 text-[10px]">
          Engine: Intraday VWAP &amp; Kalman Drift Model
        </span>
      </div>
    </div>
  );
};
