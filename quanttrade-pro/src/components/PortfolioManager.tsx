import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Briefcase,
  Search,
  X,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Circle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceDot 
} from 'recharts';
import { Trade, StockData } from '../types';
import { cn } from '../utils/cn';
import StatCard from './StatCard';

interface PortfolioManagerProps {
  portfolioTrades: Trade[];
  onAddTrade: (trade: Omit<Trade, 'id'>) => void;
  onRemoveTrade: (id: string) => void;
  allData: Record<string, StockData>;
}

const PortfolioManager: React.FC<PortfolioManagerProps> = ({ 
  portfolioTrades, 
  onAddTrade, 
  onRemoveTrade,
  allData
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTrade, setNewTrade] = useState<Omit<Trade, 'id' | 'timestamp'>>({
    ticker: '',
    quantity: 0,
    price: 0,
    side: 'buy',
  });
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);

  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const portfolioStats = useMemo(() => {
    const holdings: Record<string, { quantity: number; costBasis: number }> = {};
    
    portfolioTrades.forEach(trade => {
      if (!holdings[trade.ticker]) {
        holdings[trade.ticker] = { quantity: 0, costBasis: 0 };
      }
      
      if (trade.side === 'buy') {
        const totalCost = holdings[trade.ticker].quantity * holdings[trade.ticker].costBasis + trade.quantity * trade.price;
        holdings[trade.ticker].quantity += trade.quantity;
        holdings[trade.ticker].costBasis = totalCost / holdings[trade.ticker].quantity;
      } else {
        holdings[trade.ticker].quantity -= trade.quantity;
        // Cost basis remains the same for sells in this simple model
      }
    });

    let totalValue = 0;
    let totalCost = 0;
    const assetPerformance: { ticker: string; value: number; cost: number; pl: number; plPercent: number; quantity: number; costBasis: number }[] = [];

    Object.entries(holdings).forEach(([ticker, data]) => {
      if (data.quantity <= 0) return;

      const currentPrice = allData[ticker]?.currentPrice || data.costBasis; // Fallback to cost basis if no data
      const value = data.quantity * currentPrice;
      const cost = data.quantity * data.costBasis;
      const pl = value - cost;
      const plPercent = (pl / cost) * 100;

      totalValue += value;
      totalCost += cost;

      assetPerformance.push({
        ticker,
        value,
        cost,
        pl,
        plPercent,
        quantity: data.quantity,
        costBasis: data.costBasis
      });
    });

    const totalPL = totalValue - totalCost;
    const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalPL,
      totalPLPercent,
      assets: assetPerformance.sort((a, b) => b.value - a.value)
    };
  }, [portfolioTrades, allData]);

  const selectedAsset = useMemo(() => {
    return portfolioStats.assets.find(a => a.ticker === selectedTicker);
  }, [portfolioStats.assets, selectedTicker]);

  const selectedStockData = selectedTicker ? allData[selectedTicker] : null;
  const assetTrades = useMemo(() => {
    return portfolioTrades.filter(t => t.ticker === selectedTicker);
  }, [portfolioTrades, selectedTicker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrade.ticker || newTrade.quantity <= 0 || newTrade.price <= 0) return;
    
    onAddTrade({
      ...newTrade,
      ticker: newTrade.ticker.toUpperCase(),
      timestamp: new Date(tradeDate)
    });
    
    setNewTrade({ ticker: '', quantity: 0, price: 0, side: 'buy' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Header Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          label="Total Value" 
          value={`$${portfolioStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <StatCard 
          label="Total P/L" 
          value={`$${portfolioStats.totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subValue={`${portfolioStats.totalPLPercent.toFixed(2)}%`}
          trend={portfolioStats.totalPL >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Asset List */}
      <div className="glass-card p-6 border-zinc-800/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <PieChartIcon size={20} className="text-emerald-400" />
            Holdings
          </h3>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <Plus size={14} />
            Add Trade
          </button>
        </div>

        <div className="space-y-3">
          {portfolioStats.assets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="text-zinc-600" size={24} />
              </div>
              <p className="text-sm text-zinc-500 font-medium">No holdings yet. Add your first trade to start tracking.</p>
            </div>
          ) : (
            portfolioStats.assets.map((asset) => (
              <motion.div 
                key={asset.ticker} 
                layoutId={asset.ticker}
                onClick={() => setSelectedTicker(asset.ticker)}
                className={cn(
                  "p-4 rounded-2xl bg-zinc-950/50 border flex items-center justify-between group cursor-pointer transition-all",
                  selectedTicker === asset.ticker ? "border-emerald-500 shadow-lg shadow-emerald-500/10" : "border-zinc-800 hover:border-zinc-700"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-200">
                    {asset.ticker.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{asset.ticker}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{asset.quantity} Shares</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-100">${asset.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <div className={cn(
                    "flex items-center justify-end gap-1 text-[10px] font-bold",
                    asset.pl >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {asset.pl >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    ${Math.abs(asset.pl).toLocaleString(undefined, { maximumFractionDigits: 2 })} ({Math.abs(asset.plPercent).toFixed(2)}%)
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Asset Detail View */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-bold text-emerald-400">
                    {selectedAsset.ticker.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-100">{selectedAsset.ticker}</h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Detailed Performance Analysis</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTicker(null)}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={20} className="text-zinc-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Average Cost</p>
                  <p className="text-lg font-bold text-zinc-100">${selectedAsset.costBasis.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Current Value</p>
                  <p className="text-lg font-bold text-zinc-100">${selectedAsset.value.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Total P/L</p>
                  <p className={cn("text-lg font-bold", selectedAsset.pl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    ${selectedAsset.pl.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Return</p>
                  <p className={cn("text-lg font-bold", selectedAsset.plPercent >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {selectedAsset.plPercent.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Trade History Chart */}
              {selectedStockData?.history && (
                <div className="mb-8">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <TrendingUp size={14} className="text-emerald-400" />
                    Price Performance & Trade Points
                  </h4>
                  <div className="h-[250px] w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedStockData.history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 9, fill: '#71717a' }}
                          tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          minTickGap={30}
                        />
                        <YAxis 
                          domain={['auto', 'auto']}
                          tick={{ fontSize: 9, fill: '#71717a' }}
                          tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
                          itemStyle={{ color: '#e4e4e7' }}
                          labelStyle={{ color: '#71717a', marginBottom: '4px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          dot={false}
                          activeDot={{ r: 4, fill: '#10b981' }}
                        />
                        {assetTrades.map((trade) => {
                          const tradeDate = new Date(trade.timestamp).toISOString().split('T')[0];
                          const currentPrice = selectedStockData?.currentPrice || trade.price;
                          const plPercent = ((currentPrice - trade.price) / trade.price) * 100 * (trade.side === 'buy' ? 1 : -1);
                          
                          return (
                            <ReferenceDot 
                              key={trade.id}
                              x={tradeDate}
                              y={trade.price}
                              r={5}
                              fill={trade.side === 'buy' ? '#10b981' : '#ef4444'}
                              stroke="#fff"
                              strokeWidth={2}
                              label={{
                                value: `${plPercent >= 0 ? '+' : ''}${plPercent.toFixed(1)}%`,
                                position: 'top',
                                fill: plPercent >= 0 ? '#10b981' : '#ef4444',
                                fontSize: 8,
                                fontWeight: 'bold',
                                offset: 10
                              }}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-4 mt-2 px-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Buy Point</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Sell Point</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} className="text-blue-400" />
                  Trade History for {selectedAsset.ticker}
                </h4>
                <div className="space-y-2">
                  {portfolioTrades.filter(t => t.ticker === selectedAsset.ticker).reverse().map(trade => {
                    const currentPrice = selectedStockData?.currentPrice || trade.price;
                    const pl = (currentPrice - trade.price) * trade.quantity * (trade.side === 'buy' ? 1 : -1);
                    const plPercent = ((currentPrice - trade.price) / trade.price) * 100 * (trade.side === 'buy' ? 1 : -1);
                    
                    return (
                      <div key={trade.id} className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold",
                            trade.side === 'buy' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          )}>
                            {trade.side === 'buy' ? 'B' : 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-200">{trade.quantity} Shares</p>
                            <p className="text-[9px] text-zinc-500">{new Date(trade.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs font-bold text-zinc-200">@ ${trade.price.toFixed(2)}</p>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                              Total: ${(trade.quantity * trade.price).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className={cn(
                              "text-xs font-bold",
                              pl >= 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                              {pl >= 0 ? '+' : ''}${Math.abs(pl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                            <p className={cn(
                              "text-[9px] font-bold uppercase tracking-widest mt-1",
                              plPercent >= 0 ? "text-emerald-400/60" : "text-rose-400/60"
                            )}>
                              {plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Trades (only show if no asset is selected or show all) */}
      {!selectedAsset && (
        <div className="glass-card p-6 border-zinc-800/50">
          <h3 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {portfolioTrades.slice().reverse().slice(0, 5).map((trade) => (
              <div key={trade.id} className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold",
                    trade.side === 'buy' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {trade.side === 'buy' ? 'B' : 'S'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-200">{trade.ticker}</p>
                    <p className="text-[9px] text-zinc-500">{new Date(trade.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-200">{trade.quantity} @ ${trade.price.toFixed(2)}</p>
                  <button 
                    onClick={() => onRemoveTrade(trade.id)}
                    className="text-[9px] text-zinc-600 hover:text-rose-400 font-bold uppercase tracking-widest mt-1 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Trade Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-zinc-100">Add Trade</h3>
                <button onClick={() => setIsAdding(false)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
                  <X size={18} className="text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-4">
                  <button
                    type="button"
                    onClick={() => setNewTrade(prev => ({ ...prev, side: 'buy' }))}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all",
                      newTrade.side === 'buy' ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTrade(prev => ({ ...prev, side: 'sell' }))}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all",
                      newTrade.side === 'sell' ? "bg-rose-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    SELL
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Ticker</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                    <input 
                      type="text"
                      value={newTrade.ticker}
                      onChange={(e) => setNewTrade(prev => ({ ...prev, ticker: e.target.value }))}
                      placeholder="AAPL, TSLA, etc."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Quantity</label>
                    <input 
                      type="number"
                      value={newTrade.quantity || ''}
                      onChange={(e) => setNewTrade(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                      placeholder="0.00"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      required
                      step="any"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Price</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                      <input 
                        type="number"
                        value={newTrade.price || ''}
                        onChange={(e) => setNewTrade(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                        placeholder="0.00"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        required
                        step="any"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                    <input 
                      type="date"
                      value={tradeDate}
                      onChange={(e) => setTradeDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all mt-4"
                >
                  Add to Portfolio
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortfolioManager;
