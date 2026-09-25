import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { Simulation, StockData } from '../types';
import { cn } from '../utils/cn';
import StatCard from './StatCard';

interface PortfolioManagerProps {
  portfolioSimulations: Simulation[];
  onAddSimulation: (simulation: Omit<Simulation, 'id'>) => void;
  onRemoveSimulation: (id: string) => void;
  allData: Record<string, StockData>;
}

const GLOBAL_ASSETS = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'Equity' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'Equity' },
  { symbol: 'META', name: 'Meta Platforms', type: 'Equity' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', type: 'Equity' },
  { symbol: 'V', name: 'Visa Inc.', type: 'Equity' },
  { symbol: 'JPM', name: 'JPMorgan Chase', type: 'Equity' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'Equity' },
  { symbol: 'WMT', name: 'Walmart Inc.', type: 'Equity' },
  { symbol: 'PG', name: 'Procter & Gamble', type: 'Equity' },
  { symbol: 'MA', name: 'Mastercard Inc.', type: 'Equity' },
  { symbol: 'HD', name: 'Home Depot', type: 'Equity' },
  { symbol: 'CVX', name: 'Chevron Corp.', type: 'Equity' },
  { symbol: 'LLY', name: 'Eli Lilly', type: 'Equity' },
  { symbol: 'BAC', name: 'Bank of America', type: 'Equity' },
  { symbol: 'PFE', name: 'Pfizer Inc.', type: 'Equity' },
  { symbol: 'KO', name: 'Coca-Cola Co.', type: 'Equity' },
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'ETF' },
  { symbol: 'IWM', name: 'iShares Russell 2000', type: 'ETF' },
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'Crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', type: 'Crypto' },
  { symbol: 'GC=F', name: 'Gold Futures', type: 'Commodity' },
  { symbol: 'CL=F', name: 'Crude Oil', type: 'Commodity' }
];

const PortfolioManager: React.FC<PortfolioManagerProps> = ({ 
  portfolioSimulations, 
  onAddSimulation, 
  onRemoveSimulation,
  allData
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSimulation, setNewSimulation] = useState<Omit<Simulation, 'id' | 'timestamp'>>({
    ticker: '',
    quantity: 0,
    price: 0,
    side: 'buy',
  });
  const [simulationDate, setSimulationDate] = useState(new Date().toISOString().split('T')[0]);

  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{symbol: string, name: string, type: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleTickerChange = (val: string) => {
    setNewSimulation(prev => ({ ...prev, ticker: val }));
    if (val.length > 0) {
      const filtered = GLOBAL_ASSETS.filter(t => 
        t.symbol.toLowerCase().includes(val.toLowerCase()) || 
        t.name.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (symbol: string) => {
    const currentPrice = allData[symbol]?.currentPrice || 0;
    setNewSimulation(prev => ({ 
      ...prev, 
      ticker: symbol,
      price: currentPrice > 0 ? currentPrice : prev.price
    }));
    setShowSuggestions(false);
  };

  const portfolioStats = useMemo(() => {
    const holdings: Record<string, { quantity: number; costBasis: number }> = {};
    
    portfolioSimulations.forEach(simulation => {
      if (!holdings[simulation.ticker]) {
        holdings[simulation.ticker] = { quantity: 0, costBasis: 0 };
      }
      
      if (simulation.side === 'buy') {
        const totalCost = holdings[simulation.ticker].quantity * holdings[simulation.ticker].costBasis + simulation.quantity * simulation.price;
        holdings[simulation.ticker].quantity += simulation.quantity;
        holdings[simulation.ticker].costBasis = totalCost / holdings[simulation.ticker].quantity;
      } else {
        holdings[simulation.ticker].quantity -= simulation.quantity;
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
  }, [portfolioSimulations, allData]);

  const selectedAsset = useMemo(() => {
    return portfolioStats.assets.find(a => a.ticker === selectedTicker);
  }, [portfolioStats.assets, selectedTicker]);

  const selectedStockData = selectedTicker ? allData[selectedTicker] : null;
  const assetSimulations = useMemo(() => {
    return portfolioSimulations.filter(t => t.ticker === selectedTicker);
  }, [portfolioSimulations, selectedTicker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSimulation.ticker || newSimulation.quantity <= 0 || newSimulation.price <= 0) return;
    
    onAddSimulation({
      ...newSimulation,
      ticker: newSimulation.ticker.toUpperCase(),
      timestamp: new Date(simulationDate)
    });
    
    setNewSimulation({ ticker: '', quantity: 0, price: 0, side: 'buy' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
          <Briefcase className="text-blue-400" size={24} />
          QuantLab Portfolio
        </h2>
        <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Advanced Portfolio Optimization & Asset Tracking</p>
      </div>

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
            Simulated Holdings
          </h3>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <Plus size={14} />
            Add Simulation
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
            portfolioStats.assets.map((asset, i) => (
              <motion.div 
                key={`${asset.ticker}-${i}`} 
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

              {/* Simulation History Chart */}
              {selectedStockData?.history && (
                <div className="mb-8">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <TrendingUp size={14} className="text-emerald-400" />
                    Price Performance & Simulation Points
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
                        {assetSimulations.map((simulation) => {
                          const simulationDate = new Date(simulation.timestamp).toISOString().split('T')[0];
                          const currentPrice = selectedStockData?.currentPrice || simulation.price;
                          const plPercent = ((currentPrice - simulation.price) / simulation.price) * 100 * (simulation.side === 'buy' ? 1 : -1);
                          
                          return (
                            <ReferenceDot 
                              key={simulation.id}
                              x={simulationDate}
                              y={simulation.price}
                              r={5}
                              fill={simulation.side === 'buy' ? '#10b981' : '#ef4444'}
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
                  Simulation History for {selectedAsset.ticker}
                </h4>
                <div className="space-y-2">
                  {portfolioSimulations.filter(t => t.ticker === selectedAsset.ticker).reverse().map(simulation => {
                    const currentPrice = selectedStockData?.currentPrice || simulation.price;
                    const pl = (currentPrice - simulation.price) * simulation.quantity * (simulation.side === 'buy' ? 1 : -1);
                    const plPercent = ((currentPrice - simulation.price) / simulation.price) * 100 * (simulation.side === 'buy' ? 1 : -1);
                    
                    return (
                      <div key={simulation.id} className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold",
                            simulation.side === 'buy' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          )}>
                            {simulation.side === 'buy' ? 'B' : 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-200">{simulation.quantity} Shares</p>
                            <p className="text-[9px] text-zinc-500">{new Date(simulation.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs font-bold text-zinc-200">@ ${simulation.price.toFixed(2)}</p>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                              Total: ${(simulation.quantity * simulation.price).toLocaleString()}
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

      {/* Recent Simulations (only show if no asset is selected or show all) */}
      {!selectedAsset && (
        <div className="glass-card p-6 border-zinc-800/50">
          <h3 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {portfolioSimulations.slice().reverse().slice(0, 5).map((simulation) => (
              <div key={simulation.id} className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold",
                    simulation.side === 'buy' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {simulation.side === 'buy' ? 'B' : 'S'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-200">{simulation.ticker}</p>
                    <p className="text-[9px] text-zinc-500">{new Date(simulation.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-200">{simulation.quantity} @ ${simulation.price.toFixed(2)}</p>
                  <button 
                    onClick={() => onRemoveSimulation(simulation.id)}
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

      {/* Add Simulation Modal */}
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
                <h3 className="text-lg font-bold text-zinc-100">Add Paper Simulation</h3>
                <button onClick={() => setIsAdding(false)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
                  <X size={18} className="text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-4">
                  <button
                    type="button"
                    onClick={() => setNewSimulation(prev => ({ ...prev, side: 'buy' }))}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all",
                      newSimulation.side === 'buy' ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSimulation(prev => ({ ...prev, side: 'sell' }))}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all",
                      newSimulation.side === 'sell' ? "bg-rose-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    SELL
                  </button>
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Ticker</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                    <input 
                      type="text"
                      value={newSimulation.ticker}
                      onChange={(e) => handleTickerChange(e.target.value)}
                      onFocus={() => newSimulation.ticker && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="AAPL, TSLA, etc."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      required
                      autoComplete="off"
                    />
                  </div>
                  
                  {/* Suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl z-50"
                      >
                        {suggestions.map((t, idx) => (
                          <button
                            key={`${t.symbol}-${idx}`}
                            type="button"
                            onClick={() => selectSuggestion(t.symbol)}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-800/50 flex items-center justify-between group transition-colors border-b border-zinc-800/50 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">{t.symbol}</p>
                              <p className="text-[10px] text-zinc-500">{t.name}</p>
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 bg-zinc-950 px-2 py-1 rounded-md">
                              {t.type}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-1">Quantity</label>
                    <input 
                      type="number"
                      value={newSimulation.quantity || ''}
                      onChange={(e) => setNewSimulation(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
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
                        value={newSimulation.price || ''}
                        onChange={(e) => setNewSimulation(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
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
                      value={simulationDate}
                      onChange={(e) => setSimulationDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all mt-4"
                >
                  Add to Simulation
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
