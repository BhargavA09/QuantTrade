import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Newspaper,
  Radio,
  RotateCw,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Target,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  Eye,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  fetchSentimentHeatmapData,
  MarketSentimentHeatmapData,
  SentimentTimeframe,
  SentimentChannelRow,
  SentimentHeatmapCell,
  PeerSectorSentiment,
  RealtimeFeedItem,
  getSentimentColor
} from '../../services/api/sentimentHeatmapService';
import { quantTraderBrain } from '../../services/QuantTraderBrain';

interface MarketSentimentHeatmapProps {
  selectedTicker: string;
  currentPrice: number;
  onSelectTicker?: (ticker: string) => void;
  onTradeExecuted?: (message: string) => void;
}

export const MarketSentimentHeatmap: React.FC<MarketSentimentHeatmapProps> = ({
  selectedTicker,
  currentPrice,
  onSelectTicker,
  onTradeExecuted
}) => {
  const [data, setData] = useState<MarketSentimentHeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCell, setSelectedCell] = useState<{
    channel: SentimentChannelRow;
    cell: SentimentHeatmapCell;
  } | null>(null);
  const [channelFilter, setChannelFilter] = useState<'all' | 'social' | 'news'>('all');
  const [feedFilter, setFeedFilter] = useState<'all' | 'social' | 'news' | 'positive' | 'negative'>('all');
  const [feedSearch, setFeedSearch] = useState<string>('');
  const [isExecutingTrade, setIsExecutingTrade] = useState<boolean>(false);
  const [tradeSuccessMsg, setTradeSuccessMsg] = useState<string | null>(null);

  // Load and refresh sentiment heatmap telemetry
  const loadData = useCallback(async (isSilent: boolean = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await fetchSentimentHeatmapData(selectedTicker, currentPrice);
      setData(res);
      // Auto-select first cell if none selected
      if (!selectedCell && res.channels.length > 0) {
        const firstChan = res.channels[0];
        setSelectedCell({
          channel: firstChan,
          cell: firstChan.timeframeCells['24h'] || Object.values(firstChan.timeframeCells)[0]
        });
      }
    } catch (err) {
      console.warn('Error loading sentiment heatmap data:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [selectedTicker, currentPrice, selectedCell]);

  useEffect(() => {
    loadData();
    // Auto-refresh every 25 seconds for real-time pulse
    const interval = setInterval(() => {
      loadData(true);
    }, 25000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Filtered channels in 2D grid
  const filteredChannels = useMemo(() => {
    if (!data) return [];
    if (channelFilter === 'social') return data.channels.filter(c => c.channelType === 'social');
    if (channelFilter === 'news') return data.channels.filter(c => c.channelType === 'news');
    return data.channels;
  }, [data, channelFilter]);

  // Filtered live feed items
  const filteredFeedItems = useMemo(() => {
    if (!data) return [];
    return data.liveFeedStream.filter(item => {
      const matchesType = 
        feedFilter === 'all' ||
        (feedFilter === 'social' && item.channelType === 'social') ||
        (feedFilter === 'news' && item.channelType === 'news') ||
        (feedFilter === 'positive' && item.sentimentBadge === 'positive') ||
        (feedFilter === 'negative' && item.sentimentBadge === 'negative');
      
      const matchesSearch = 
        !feedSearch.trim() ||
        item.title.toLowerCase().includes(feedSearch.toLowerCase()) ||
        item.sourceName.toLowerCase().includes(feedSearch.toLowerCase()) ||
        item.author.toLowerCase().includes(feedSearch.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [data, feedFilter, feedSearch]);

  // Handle Deploy Sentiment Strategy Paper Trade
  const handleDeploySentimentTrade = () => {
    if (!data) return;
    setIsExecutingTrade(true);
    try {
      const setup = data.divergence.actionableSetup;
      const trade = quantTraderBrain.executeOrder(
        selectedTicker,
        setup.bias,
        currentPrice,
        `Sentiment Heatmap: ${data.divergence.divergencePattern}`
      );

      const msg = `Executed Sentiment Trade: ${setup.bias} ${trade.quantity} shs @ $${currentPrice.toFixed(2)} based on ${data.divergence.divergencePattern} setup. Target: $${setup.targetPrice}, Stop: $${setup.stopLoss}`;
      setTradeSuccessMsg(msg);
      if (onTradeExecuted) onTradeExecuted(msg);
      setTimeout(() => setTradeSuccessMsg(null), 6000);
    } catch (e: any) {
      setTradeSuccessMsg(`Execution note: ${e.message}`);
    } finally {
      setIsExecutingTrade(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-8 flex flex-col items-center justify-center min-h-[420px] space-y-4 shadow-xl">
        <RotateCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold text-white tracking-wide">
            Aggregating Real-Time Social & News Sentiment
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            Scanning X/Twitter cashtags, Reddit discussions, StockTwits ratio, and institutional press wires for {selectedTicker}...
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const scoreColors = getSentimentColor(data.compoundSentimentScore);

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-6 shadow-2xl">
      {/* 1. Header & Live Telemetry Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Real-Time Market Sentiment Heatmap
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Ticker: <strong className="text-white">{selectedTicker}</strong> (${currentPrice.toFixed(2)})
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              Sync: <span className="text-zinc-200">{data.lastUpdated}</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            Social & News Sentiment Convergence Engine
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            Multi-stream NLP analysis scanning retail velocity (Twitter/X, Reddit, StockTwits) vs institutional tone (Bloomberg, Reuters, SEC consensus) to calculate directional conviction and smart money divergence.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center">
          <button
            onClick={() => loadData(false)}
            className="px-3 py-2 rounded-xl text-xs font-bold font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 flex items-center gap-1.5 transition-all"
            title="Refresh sentiment telemetry"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Trade Success Toast */}
      {tradeSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{tradeSuccessMsg}</span>
          </div>
          <button
            onClick={() => setTradeSuccessMsg(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-emerald-800/40"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Compound Sentiment Score */}
        <div className={`p-4 rounded-xl border ${scoreColors.border} ${scoreColors.bg} space-y-2 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Compound Sentiment
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${scoreColors.bg} ${scoreColors.text} border ${scoreColors.border}`}>
              {data.polarityLabel.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono tracking-tight ${scoreColors.text}`}>
              {data.compoundSentimentScore}
            </span>
            <span className="text-xs font-mono text-zinc-400">/ 100</span>
          </div>
          {/* Ratio Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: `${data.bullishPct}%` }} title={`Bullish: ${data.bullishPct}%`} />
              <div className="bg-zinc-500 h-full" style={{ width: `${data.neutralPct}%` }} title={`Neutral: ${data.neutralPct}%`} />
              <div className="bg-rose-500 h-full" style={{ width: `${data.bearishPct}%` }} title={`Bearish: ${data.bearishPct}%`} />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-400">
              <span className="text-emerald-400">{data.bullishPct}% Bull</span>
              <span className="text-zinc-400">{data.neutralPct}% Neutral</span>
              <span className="text-rose-400">{data.bearishPct}% Bear</span>
            </div>
          </div>
        </div>

        {/* Social Mention Velocity */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              Social Velocity (X / Reddit)
            </span>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
              {data.socialVelocity.postsPerMinute} msgs/min
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">
              {data.socialVelocity.buzz24hChangePct >= 0 ? `+${data.socialVelocity.buzz24hChangePct}%` : `${data.socialVelocity.buzz24hChangePct}%`}
            </span>
            <span className="text-xs font-mono text-zinc-500">24h Buzz Volume</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/80">
            <span>Retail Frenzy Meter</span>
            <span className={`font-bold ${data.socialVelocity.retailFrenzyIndex > 65 ? 'text-amber-400' : 'text-zinc-300'}`}>
              {data.socialVelocity.retailFrenzyIndex}/100
            </span>
          </div>
        </div>

        {/* Institutional News Flow */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5 text-indigo-400" />
              Institutional News Tone
            </span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              {data.newsFlow.articlesScanned} Wires Scanned
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${data.newsFlow.institutionalToneScore >= 60 ? 'text-emerald-400' : data.newsFlow.institutionalToneScore <= 40 ? 'text-rose-400' : 'text-zinc-200'}`}>
              {data.newsFlow.institutionalToneScore}
            </span>
            <span className="text-xs font-mono text-zinc-500">Tone Index (0-100)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/80">
            <span>High-Impact Catalysts</span>
            <span className="font-bold text-white">{data.newsFlow.highImpactCatalystsCount} active</span>
          </div>
        </div>

        {/* Smart Money vs Retail Divergence */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Smart Money Divergence
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${data.divergence.isDivergent ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {data.divergence.isDivergent ? 'DIVERGENCE ALERT' : 'ALIGNED'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${Math.abs(data.divergence.divergenceDelta) > 15 ? 'text-amber-400' : 'text-white'}`}>
              {data.divergence.divergenceDelta > 0 ? `+${data.divergence.divergenceDelta}` : data.divergence.divergenceDelta} pts
            </span>
            <span className="text-xs font-mono text-zinc-500">Retail vs Institutional</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/80">
            <span>Tactical Play</span>
            <span className="font-bold text-purple-400">{data.divergence.recommendedPlay.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      {/* 3. Section: 2D Channel x Time Horizon Heatmap Matrix */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Multi-Channel Sentiment Heatmap Matrix (Channels × Time Horizons)
            </h3>
            <p className="text-xs text-zinc-400">
              Each cell displays normalized sentiment (0-100) and message volume. Click any cell to inspect raw post topics & catalyst drivers.
            </p>
          </div>

          {/* Channel Filters */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-center">
            <button
              onClick={() => setChannelFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${channelFilter === 'all' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              All Channels ({data.channels.length})
            </button>
            <button
              onClick={() => setChannelFilter('social')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${channelFilter === 'social' ? 'bg-sky-600/30 text-sky-300 border border-sky-500/30' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <MessageSquare className="w-3 h-3 text-sky-400" />
              Social Feeds
            </button>
            <button
              onClick={() => setChannelFilter('news')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${channelFilter === 'news' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Newspaper className="w-3 h-3 text-indigo-400" />
              News Wires
            </button>
          </div>
        </div>

        {/* Heatmap Grid Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/70">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[220px]">Channel Source</th>
                <th className="py-3 px-3 text-center min-w-[90px]">Type</th>
                {data.timeframes.map(tf => (
                  <th key={tf} className="py-3 px-3 text-center min-w-[95px]">
                    {tf} Window
                  </th>
                ))}
                <th className="py-3 px-4 text-right min-w-[110px]">24h Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-xs font-mono">
              {filteredChannels.map(channel => {
                const chanScoreColor = getSentimentColor(channel.currentScore);
                return (
                  <tr key={channel.channelId} className="hover:bg-zinc-800/30 transition-colors">
                    {/* Channel Name & Icon */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${channel.channelType === 'social' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                          {channel.channelType === 'social' ? (
                            <MessageSquare className="w-4 h-4" />
                          ) : (
                            <Newspaper className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {channel.channelName}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate max-w-[220px]">
                            {channel.dominantTheme}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Channel Type */}
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${channel.channelType === 'social' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                        {channel.channelType}
                      </span>
                    </td>

                    {/* Timeframe Heatmap Cells */}
                    {data.timeframes.map(tf => {
                      const cell = channel.timeframeCells[tf];
                      const isSelected = selectedCell?.channel.channelId === channel.channelId && selectedCell?.cell.timeframe === tf;
                      const cellColor = getSentimentColor(cell.score);

                      return (
                        <td key={tf} className="p-1.5">
                          <button
                            onClick={() => setSelectedCell({ channel, cell })}
                            className={`w-full py-2.5 px-2 rounded-lg border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${cellColor.bg} ${cellColor.border} ${isSelected ? 'ring-2 ring-emerald-400 shadow-md scale-102 font-bold' : 'hover:scale-102 hover:border-zinc-500'}`}
                          >
                            <span className={`text-xs font-black ${cellColor.text}`}>
                              {cell.score}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-normal">
                              {cell.volume.toLocaleString()} msgs
                            </span>
                          </button>
                        </td>
                      );
                    })}

                    {/* 24h Volume */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-zinc-200">
                        {channel.total24hVolume.toLocaleString()}
                      </div>
                      <div className={`text-[10px] font-bold ${channel.status === 'SURGING' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {channel.status}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Cell Detail Inspector Bar */}
        {selectedCell && (
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-800 text-zinc-200">
                  Inspecting: {selectedCell.channel.channelName} ({selectedCell.cell.timeframe} Window)
                </span>
                <span className={`text-xs font-mono font-black ${getSentimentColor(selectedCell.cell.score).text}`}>
                  Sentiment Score: {selectedCell.cell.score}/100
                </span>
              </div>
              <div className="text-xs font-mono text-zinc-400">
                Sample Volume: <strong className="text-white">{selectedCell.cell.volume.toLocaleString()}</strong> posts/articles
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">Sample Live Headline/Post</span>
                <p className="text-zinc-200 italic bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 font-sans">
                  "{selectedCell.cell.sampleHeadline}"
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">Sentiment Distribution</span>
                <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 space-y-2">
                  <div className="w-full h-2 rounded bg-zinc-800 flex overflow-hidden">
                    <div className="bg-emerald-500" style={{ width: `${selectedCell.cell.positivePct}%` }} />
                    <div className="bg-zinc-500" style={{ width: `${selectedCell.cell.neutralPct}%` }} />
                    <div className="bg-rose-500" style={{ width: `${selectedCell.cell.negativePct}%` }} />
                  </div>
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-emerald-400">+{selectedCell.cell.positivePct}% Pos</span>
                    <span className="text-zinc-400">{selectedCell.cell.neutralPct}% Neu</span>
                    <span className="text-rose-400">-{selectedCell.cell.negativePct}% Neg</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">Channel Channel Dynamics</span>
                <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 space-y-1 text-zinc-300 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Velocity Factor:</span>
                    <span className="text-emerald-400 font-bold">{selectedCell.cell.velocityMultiplier}x average</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Channel Dominance:</span>
                    <span className="text-white">{selectedCell.channel.dominantTheme.slice(0, 32)}...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Section: Cross-Asset Sector Peer Heatmap */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Cross-Asset & Sector Peer Sentiment Heatmap
            </h3>
            <p className="text-xs text-zinc-400">
              Compares {selectedTicker} against sector peers and benchmark assets. Click any tile to switch active ticker.
            </p>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 self-start sm:self-auto">
            Click tile to select asset
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {data.peerHeatmap.map(peer => {
            const isSelf = peer.ticker === selectedTicker;
            const peerColors = getSentimentColor(peer.sentimentScore);

            return (
              <button
                key={peer.ticker}
                onClick={() => {
                  if (onSelectTicker) onSelectTicker(peer.ticker);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[110px] ${peerColors.bg} ${peerColors.border} ${isSelf ? 'ring-2 ring-emerald-400 shadow-lg scale-102' : 'hover:scale-104 hover:border-zinc-500'}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono text-white flex items-center gap-1">
                      {peer.ticker}
                      {isSelf && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </span>
                    <span className={`text-[10px] font-mono font-bold flex items-center ${peer.scoreChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {peer.scoreChange24h >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(peer.scoreChange24h)}
                    </span>
                  </div>
                  <div className={`text-xl font-black font-mono mt-1 ${peerColors.text}`}>
                    {peer.sentimentScore}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[9px] font-mono">
                  <span className="text-zinc-400 truncate max-w-[55px]">{peer.tacticalSignal.replace(/_/g, ' ')}</span>
                  <span className="text-zinc-500">{peer.socialMentions} msgs</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Section: Smart Money vs Retail Sentiment Divergence Setup */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${data.divergence.isDivergent ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {data.divergence.divergencePattern.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-bold text-white">
                Contrarian Opportunity & Execution Play
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
              {data.divergence.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right font-mono text-xs">
              <div className="text-[10px] text-zinc-500">Retail Score vs Institutional Tone</div>
              <div className="text-sm font-bold text-white">
                <span className="text-sky-400">{data.divergence.retailScore}</span> / <span className="text-indigo-400">{data.divergence.institutionalScore}</span>
              </div>
            </div>

            <button
              onClick={handleDeploySentimentTrade}
              disabled={isExecutingTrade}
              className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 ${data.divergence.actionableSetup.bias === 'LONG' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'}`}
            >
              {data.divergence.actionableSetup.bias === 'LONG' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              Deploy {data.divergence.actionableSetup.bias} Setup
            </button>
          </div>
        </div>

        {/* Actionable Setup Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-zinc-500">ENTRY PRICE</div>
            <div className="font-bold text-white">${data.divergence.actionableSetup.entryPrice.toFixed(2)}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-emerald-400">PRICE TARGET</div>
            <div className="font-bold text-emerald-400">${data.divergence.actionableSetup.targetPrice.toFixed(2)}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-rose-400">INVALIDATION (STOP)</div>
            <div className="font-bold text-rose-400">${data.divergence.actionableSetup.stopLoss.toFixed(2)}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-purple-400">RISK / REWARD</div>
            <div className="font-bold text-purple-400">{data.divergence.actionableSetup.riskReward}:1</div>
          </div>
        </div>
      </div>

      {/* 6. Section: Real-Time Social & News Wire Stream */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              Live Ingested Feed Stream ({filteredFeedItems.length} items)
            </h3>
            <p className="text-xs text-zinc-400">
              High-speed stream of raw social messages (X, Reddit, StockTwits) and institutional headlines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search keywords..."
                value={feedSearch}
                onChange={e => setFeedSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-[160px]"
              />
            </div>

            {/* Feed Filter Badges */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs font-mono">
              <button
                onClick={() => setFeedFilter('all')}
                className={`px-2 py-0.5 rounded ${feedFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setFeedFilter('social')}
                className={`px-2 py-0.5 rounded ${feedFilter === 'social' ? 'bg-sky-600/30 text-sky-300' : 'text-zinc-400'}`}
              >
                Social
              </button>
              <button
                onClick={() => setFeedFilter('news')}
                className={`px-2 py-0.5 rounded ${feedFilter === 'news' ? 'bg-indigo-600/30 text-indigo-300' : 'text-zinc-400'}`}
              >
                News
              </button>
              <button
                onClick={() => setFeedFilter('positive')}
                className={`px-2 py-0.5 rounded ${feedFilter === 'positive' ? 'bg-emerald-600/30 text-emerald-300' : 'text-zinc-400'}`}
              >
                Bullish
              </button>
              <button
                onClick={() => setFeedFilter('negative')}
                className={`px-2 py-0.5 rounded ${feedFilter === 'negative' ? 'bg-rose-600/30 text-rose-300' : 'text-zinc-400'}`}
              >
                Bearish
              </button>
            </div>
          </div>
        </div>

        {/* Feed Cards Stream */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredFeedItems.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-zinc-500">
              No feed items match current filter criteria.
            </div>
          ) : (
            filteredFeedItems.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${item.channelType === 'social' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                      {item.sourceName}
                    </span>
                    <span className="text-zinc-400 font-bold">{item.author}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-500">{item.timeAgo}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${item.sentimentBadge === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : item.sentimentBadge === 'negative' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-zinc-800 text-zinc-400'}`}>
                    {item.sentimentBadge}
                  </span>
                </div>

                <p className="text-xs text-zinc-200 leading-snug font-sans">
                  {item.title}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                  <div className="flex items-center gap-2">
                    {item.keyKeywords.map((kw, i) => (
                      <span key={i} className="text-zinc-400">
                        #{kw}
                      </span>
                    ))}
                  </div>
                  <span>Engagement: {item.engagementScore.toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
