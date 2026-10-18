import React, { useState, useMemo } from 'react';
import {
  Grid,
  Maximize2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Plus,
  Trash2
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { FINVIZ_STOCKS } from '../../data/finvizData';
import { cn } from '../../utils/cn';
import { soundEngine } from '../../utils/audioAlerts';

interface FinvizMultiChartGridProps {
  allData?: Record<string, any>;
  onSelectTicker?: (ticker: string) => void;
  onSendToQuantLab?: (ticker: string) => void;
}

const PRESET_BASKETS: Record<string, { name: string; tickers: string[] }> = {
  mega_tech: {
    name: 'Mega-Cap Hyperscalers',
    tickers: ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']
  },
  semis: {
    name: 'Semiconductor Foundry & AI',
    tickers: ['NVDA', 'AMD', 'TSM', 'AVGO', 'QCOM', 'INTC']
  },
  broad_market: {
    name: 'Broad Market Indices & Leaders',
    tickers: ['AAPL', 'MSFT', 'NVDA', 'TSLA']
  },
  high_volatility: {
    name: 'High Beta / Breakout Runners',
    tickers: ['TSLA', 'NVDA', 'AMD', 'META', 'PLTR', 'COIN', 'ARM', 'SMCI', 'MSTR']
  }
};

function getTileChartData(ticker: string, stock: any, allData?: Record<string, any>) {
  if (allData && allData[ticker] && allData[ticker].candles && allData[ticker].candles.length > 0) {
    const raw = allData[ticker].candles.slice(-24);
    let sma20Acc = 0;
    return raw.map((c: any, i: number) => {
      sma20Acc += c.close;
      const sma = i >= 4 ? sma20Acc / (i + 1) : c.close;
      return {
        date: c.date ? c.date.slice(-5) : `${i}`,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume || Math.round(1000000 + Math.random() * 500000),
        sma,
        isUp: c.close >= c.open
      };
    });
  }

  const basePrice = stock?.price || 150;
  const change = stock?.changePercent || 1.2;
  const trend = change >= 0 ? 0.002 : -0.002;
  const data = [];
  let cur = basePrice * (1 - (change / 100));

  for (let i = 0; i < 24; i++) {
    const shock = (Math.random() - 0.48) * (basePrice * 0.015) + (cur * trend);
    const open = cur;
    cur = Math.max(1, cur + shock);
    const close = cur;
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.006);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.006);
    const volume = Math.round(500000 + Math.random() * 1500000);

    data.push({
      date: `T-${24 - i}`,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
      sma: Number((cur * 0.995).toFixed(2)),
      isUp: close >= open
    });
  }
  return data;
}

export const FinvizMultiChartGrid: React.FC<FinvizMultiChartGridProps> = ({
  allData = {},
  onSelectTicker,
  onSendToQuantLab
}) => {
  const [gridSize, setGridSize] = useState<4 | 6 | 9>(6);
  const [activeBasketKey, setActiveBasketKey] = useState<string>('semis');
  const [customTickers, setCustomTickers] = useState<string[]>(PRESET_BASKETS['semis'].tickers);
  const [searchAdd, setSearchAdd] = useState<string>('');

  const displayedTickers = useMemo(() => {
    return customTickers.slice(0, gridSize);
  }, [customTickers, gridSize]);

  const handleSelectBasket = (key: string) => {
    setActiveBasketKey(key);
    setCustomTickers(PRESET_BASKETS[key].tickers);
    soundEngine.playNotificationTap();
  };

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = searchAdd.trim().toUpperCase();
    if (sym && !customTickers.includes(sym)) {
      setCustomTickers(prev => [sym, ...prev]);
      setSearchAdd('');
      soundEngine.playNotificationTap();
    }
  };

  const handleRemoveTicker = (sym: string) => {
    setCustomTickers(prev => prev.filter(t => t !== sym));
  };

  const gridClass = useMemo(() => {
    if (gridSize === 4) return 'grid-cols-1 md:grid-cols-2';
    if (gridSize === 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3';
  }, [gridSize]);

  return (
    <div className="space-y-4 text-zinc-100">
      {/* Top Controls Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Grid size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Multi-Chart Grid Matrix (Tile Mode)
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                Live Synchronized
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Simultaneously stream 4, 6, or 9 correlated assets with synchronized volume and moving averages
            </p>
          </div>
        </div>

        {/* Matrix Dimension & Basket Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grid Size Selector */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-1 text-xs">
            <span className="text-zinc-500 px-2 font-medium">Matrix:</span>
            {[4, 6, 9].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setGridSize(size as any);
                  soundEngine.playNotificationTap();
                }}
                className={cn(
                  "px-2.5 py-1 rounded font-bold transition-all",
                  gridSize === size
                    ? "bg-emerald-500 text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {size} Tiles
              </button>
            ))}
          </div>

          {/* Preset Sector Baskets */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1 text-xs">
            {Object.entries(PRESET_BASKETS).map(([key, basket]) => (
              <button
                key={key}
                onClick={() => handleSelectBasket(key)}
                className={cn(
                  "px-2 py-1 rounded text-[11px] font-medium transition-all",
                  activeBasketKey === key
                    ? "bg-zinc-800 text-emerald-400 font-bold border border-emerald-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {basket.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Quick Add Ticker Input */}
          <form onSubmit={handleAddTicker} className="flex items-center gap-1">
            <input
              type="text"
              placeholder="+ Ticker..."
              value={searchAdd}
              onChange={e => setSearchAdd(e.target.value)}
              className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 uppercase font-mono"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
              title="Add Ticker"
            >
              <Plus size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Grid of Miniature Charts */}
      <div className={cn("grid gap-4", gridClass)}>
        {displayedTickers.map((ticker) => {
          const stock = FINVIZ_STOCKS.find(s => s.ticker === ticker) || {
            ticker,
            name: ticker,
            price: 150.0,
            change: 1.25,
            volume: 15400000,
            marketCap: 450000000000,
            pe: 28.4
          };
          const changeVal = (stock as any).change ?? (stock as any).changePercent ?? 0;
          const isUp = changeVal >= 0;
          const chartData = getTileChartData(ticker, stock, allData);

          return (
            <div
              key={ticker}
              className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-lg group relative"
            >
              {/* Tile Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-white group-hover:text-emerald-400 transition-colors">
                      {stock.ticker}
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate max-w-[110px]">
                      {stock.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-bold font-mono text-white">
                      ${stock.price?.toFixed(2) || '150.00'}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-mono font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded",
                        isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      )}
                    >
                      {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {isUp ? '+' : ''}{changeVal.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Quick Tile Actions */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onSelectTicker?.(stock.ticker)}
                    className="p-1 rounded bg-zinc-800 hover:bg-emerald-500 hover:text-black text-zinc-300 text-xs transition-colors"
                    title="Open Full Candlestick Chart"
                  >
                    <Maximize2 size={12} />
                  </button>
                  <button
                    onClick={() => {
                      onSendToQuantLab?.(stock.ticker);
                      soundEngine.playBullishBreakout();
                    }}
                    className="p-1 rounded bg-zinc-800 hover:bg-purple-500 hover:text-white text-purple-400 text-xs transition-colors"
                    title="Send to QuantLab Monte Carlo"
                  >
                    <Sparkles size={12} />
                  </button>
                  {customTickers.length > 2 && (
                    <button
                      onClick={() => handleRemoveTicker(stock.ticker)}
                      className="p-1 rounded bg-zinc-800 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 text-xs transition-colors"
                      title="Remove from Matrix"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Miniature Chart (Recharts) */}
              <div className="h-36 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                    <XAxis dataKey="date" hide />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: '#71717a', fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-zinc-950/95 border border-zinc-800 p-1.5 rounded text-[10px] font-mono shadow-xl">
                            <div className="text-zinc-400">{d.date}</div>
                            <div className="text-white font-bold">Close: ${d.close}</div>
                            <div className="text-zinc-500">Vol: {(d.volume / 1000).toFixed(0)}k</div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="volume"
                      yAxisId={0}
                      fill={isUp ? '#10b981' : '#f43f5e'}
                      opacity={0.25}
                      barSize={4}
                    />
                    <Line
                      type="monotone"
                      dataKey="close"
                      stroke={isUp ? '#10b981' : '#f43f5e'}
                      strokeWidth={1.8}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="sma"
                      stroke="#06b6d4"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Quick Bar */}
              <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <span>SMA20 <span className="text-cyan-400">---</span></span>
                  <span>Vol: {stock.volume}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">P/E {stock.pe || 24}</span>
                  <button
                    onClick={() => onSelectTicker?.(stock.ticker)}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    Chart &gt;
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
