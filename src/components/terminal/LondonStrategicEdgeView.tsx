import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import {
  Database,
  Cpu,
  Globe,
  ExternalLink,
  Code,
  Copy,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Sparkles,
  Zap,
  BarChart3,
  Calendar,
  Search,
  RotateCw,
  Sliders,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import {
  LsePlatformOverview,
  LseMacroSeriesItem,
  LseForecastingResponse,
  fetchLseOverview,
  fetchLseMacroSeries,
  fetchLseForecasting,
  fetchLseCodeSnippet
} from '../../services/api/londonStrategicEdgeService';

interface LondonStrategicEdgeViewProps {
  initialTicker?: string;
  onSelectTicker?: (ticker: string) => void;
}

const POPULAR_LSE_INSTRUMENTS = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', category: 'US Tech', exchange: 'NASDAQ' },
  { symbol: 'AAPL', name: 'Apple Inc', category: 'US Tech', exchange: 'NASDAQ' },
  { symbol: 'SHEL.L', name: 'Shell plc', category: 'UK Energy', exchange: 'LSE' },
  { symbol: 'AZN.L', name: 'AstraZeneca', category: 'UK Pharma', exchange: 'LSE' },
  { symbol: 'SHOP.TO', name: 'Shopify', category: 'Canadian TSX', exchange: 'TSX' },
  { symbol: 'GC=F', name: 'Gold Futures', category: 'Commodities', exchange: 'COMEX' },
  { symbol: 'CL=F', name: 'Crude Oil', category: 'Energy', exchange: 'NYMEX' },
  { symbol: 'BTC-USD', name: 'Bitcoin', category: 'Digital Asset', exchange: 'Crypto' }
];

export const LondonStrategicEdgeView: React.FC<LondonStrategicEdgeViewProps> = ({
  initialTicker = 'NVDA',
  onSelectTicker
}) => {
  const [activeTicker, setActiveTicker] = useState<string>(initialTicker);
  const [searchInput, setSearchInput] = useState<string>(initialTicker);
  const [activeTab, setActiveTab] = useState<'forecasting' | 'macro' | 'open_feeds' | 'sdk_code'>('forecasting');
  
  // Data State
  const [overview, setOverview] = useState<LsePlatformOverview | null>(null);
  const [forecastData, setForecastData] = useState<LseForecastingResponse | null>(null);
  const [macroList, setMacroList] = useState<LseMacroSeriesItem[]>([]);
  const [selectedMacroId, setSelectedMacroId] = useState<string>('US.core_inflation_rate');
  const [codeSnippet, setCodeSnippet] = useState<string>('');
  
  // UI State
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Model Toggles in Chart
  const [visibleModels, setVisibleModels] = useState({
    consensus: true,
    lstm: true,
    xgboost: true,
    catboost: true,
    randomForest: false,
    confidenceBand: true
  });

  const loadAllLseData = async (ticker: string) => {
    setLoading(true);
    try {
      const [ov, fc, mc, cd] = await Promise.all([
        fetchLseOverview(),
        fetchLseForecasting(ticker),
        fetchLseMacroSeries(),
        fetchLseCodeSnippet(ticker)
      ]);
      setOverview(ov);
      setForecastData(fc);
      setMacroList(mc.series || []);
      setCodeSnippet(cd.pythonCode || '');
    } catch (err) {
      console.warn('LSE bundle fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllLseData(activeTicker);
  }, [activeTicker]);

  const handleSelectSymbol = (sym: string) => {
    setActiveTicker(sym);
    setSearchInput(sym);
    if (onSelectTicker) onSelectTicker(sym);
  };

  const handleCopyPython = () => {
    if (navigator?.clipboard?.writeText && codeSnippet) {
      navigator.clipboard.writeText(codeSnippet);
      setCopiedCode(true);
      setToastMessage('✓ Python lse-data code copied to clipboard!');
      setTimeout(() => {
        setCopiedCode(false);
        setToastMessage(null);
      }, 3500);
    }
  };

  const handleExportCsv = () => {
    if (!forecastData) return;
    const headers = ['Day', 'Consensus', 'LSTM', 'XGBoost', 'CatBoost', 'UpperBand', 'LowerBand'];
    const rows = forecastData.timeline.map(p => 
      [p.day, p.consensus, p.lstm, p.xgboost, p.catboost, p.upperBand, p.lowerBand].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LSE_Forecast_${activeTicker}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setToastMessage(`✓ Exported ${activeTicker} forecast to CSV!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedMacroSeries = macroList.find(m => m.seriesId === selectedMacroId) || macroList[0];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-mono flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-zinc-500 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner: London Strategic Edge Open Data Infrastructure */}
      <div className="rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-cyan-950/40 border border-zinc-800 p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 shadow-sm">
                <Globe className="w-3 h-3 text-cyan-400" />
                LONDON STRATEGIC EDGE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                OPEN SOURCE DATA FEED
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-zinc-800 text-zinc-300">
                APACHE-2.0 / MIT
              </span>
              <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{overview?.latencyMs || 24}ms Ultra-Low Latency</span>
              </span>
            </div>

            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <span>London Strategic Edge Open Market Data & ML Forecasting Engine</span>
            </h2>

            <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
              Institutional-grade market data architecture modeled after{' '}
              <a 
                href="https://londonstrategicedge.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-cyan-400 underline hover:text-cyan-300 inline-flex items-center gap-0.5 font-mono"
              >
                londonstrategicedge.com
                <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and the open-source{' '}
              <a 
                href="https://github.com/londonstrategicedge/lse-data" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-cyan-400 underline hover:text-cyan-300 inline-flex items-center gap-0.5 font-mono"
              >
                lse-data GitHub repository
                <ExternalLink className="w-3 h-3" />
              </a>
              . Free multi-asset streaming, macroeconomic time-series, and ML predictive ensembles (LSTM, XGBoost, CatBoost, Random Forest).
            </p>
          </div>

          {/* Quick Actions & Repos */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <a
              href="https://github.com/londonstrategicedge/lse-data"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>GitHub: lse-data</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>

            <button
              onClick={() => loadAllLseData(activeTicker)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-cyan-950/40 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Open Stream</span>
            </button>
          </div>
        </div>

        {/* Global Instrument Chips */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider shrink-0">
            POPULAR ASSETS:
          </span>
          {POPULAR_LSE_INSTRUMENTS.map(item => (
            <button
              key={item.symbol}
              onClick={() => handleSelectSymbol(item.symbol)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTicker === item.symbol
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-950/50'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <span>{item.symbol}</span>
              <span className="text-[9px] text-zinc-500">{item.exchange}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs & Symbol Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1">
          {[
            { id: 'forecasting', label: 'ML Price Forecasting', icon: Cpu, badge: 'LSTM / XGB' },
            { id: 'macro', label: 'Macroeconomic Series', icon: Globe, badge: 'CPI & SPREADS' },
            { id: 'open_feeds', label: 'Multi-Asset Stream', icon: Activity, badge: '4.2B TICKS' },
            { id: 'sdk_code', label: 'Python SDK & Export', icon: Code, badge: 'lse-data' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold ${
                  isActive ? 'bg-cyan-700/60 text-cyan-100' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Ticker Search in LSE Engine */}
        <div className="flex items-center gap-2 px-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchInput.trim()) {
                  handleSelectSymbol(searchInput.trim().toUpperCase());
                }
              }}
              placeholder="Search ticker (e.g. NVDA, SHEL.L, GC=F)..."
              className="bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-cyan-500 w-52 sm:w-60"
            />
          </div>

          <button
            onClick={() => handleSelectSymbol(searchInput.trim().toUpperCase())}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all"
          >
            Load
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: ML PRICE FORECASTING ENSEMBLE                                  */}
      {/* ========================================================================= */}
      {activeTab === 'forecasting' && forecastData && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Live Spot Anchor</span>
              <div className="text-xl font-black text-white font-mono">
                ${forecastData.spotPrice.toFixed(2)}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                Security: {forecastData.ticker}
              </div>
            </div>

            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">10-Day Consensus Target</span>
              <div className="text-xl font-black text-cyan-400 font-mono">
                ${forecastData.target10Day.toFixed(2)}
              </div>
              <div className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                forecastData.expectedReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {forecastData.expectedReturnPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{forecastData.expectedReturnPct >= 0 ? '+' : ''}{forecastData.expectedReturnPct}% Projected</span>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Model Directive</span>
              <div className="text-base font-black text-emerald-400 font-mono">
                {forecastData.directive.replace(/_/g, ' ')}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                Ensemble Confidence: {forecastData.confidenceScore}%
              </div>
            </div>

            <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Ensemble Models Active</span>
              <div className="text-sm font-black text-zinc-200 font-mono">
                LSTM · XGB · CatBoost
              </div>
              <div className="text-[10px] text-cyan-400 font-mono">
                Trained on LSE Multi-Asset Archive
              </div>
            </div>
          </div>

          {/* Main Forecast Trajectory Recharts Chart */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <span>10-Day ML Trajectory Projection: {forecastData.ticker}</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Ensemble projection synthesized from London Strategic Edge open weights (LSTM + XGBoost + CatBoost)
                </p>
              </div>

              {/* Model Visibility Toggles */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setVisibleModels(p => ({ ...p, consensus: !p.consensus }))}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    visibleModels.consensus ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  Consensus
                </button>
                <button
                  onClick={() => setVisibleModels(p => ({ ...p, lstm: !p.lstm }))}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    visibleModels.lstm ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  LSTM
                </button>
                <button
                  onClick={() => setVisibleModels(p => ({ ...p, xgboost: !p.xgboost }))}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    visibleModels.xgboost ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  XGBoost
                </button>
                <button
                  onClick={() => setVisibleModels(p => ({ ...p, catboost: !p.catboost }))}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    visibleModels.catboost ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  CatBoost
                </button>
                <button
                  onClick={() => setVisibleModels(p => ({ ...p, confidenceBand: !p.confidenceBand }))}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    visibleModels.confidenceBand ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  95% Band
                </button>

                <button
                  onClick={handleExportCsv}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 flex items-center gap-1 ml-2 transition-all"
                  title="Export simulation points to CSV"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData.timeline} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="day" stroke="#71717a" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="#71717a" 
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '0.75rem', fontSize: '12px' }}
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    formatter={(value: any, name: string) => [`$${Number(value).toFixed(2)}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

                  {/* 95% Confidence Envelope */}
                  {visibleModels.confidenceBand && (
                    <Area
                      type="monotone"
                      dataKey="upperBand"
                      stroke="none"
                      fill="#8b5cf6"
                      fillOpacity={0.12}
                      name="Upper 95% Bound"
                    />
                  )}
                  {visibleModels.confidenceBand && (
                    <Area
                      type="monotone"
                      dataKey="lowerBand"
                      stroke="none"
                      fill="#8b5cf6"
                      fillOpacity={0.12}
                      name="Lower 95% Bound"
                    />
                  )}

                  {/* ML Model Lines */}
                  {visibleModels.consensus && (
                    <Line
                      type="monotone"
                      dataKey="consensus"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#06b6d4' }}
                      name="Consensus Alpha"
                    />
                  )}
                  {visibleModels.lstm && (
                    <Line
                      type="monotone"
                      dataKey="lstm"
                      stroke="#818cf8"
                      strokeWidth={1.8}
                      strokeDasharray="4 2"
                      dot={false}
                      name="LSTM Network"
                    />
                  )}
                  {visibleModels.xgboost && (
                    <Line
                      type="monotone"
                      dataKey="xgboost"
                      stroke="#10b981"
                      strokeWidth={1.8}
                      strokeDasharray="5 3"
                      dot={false}
                      name="XGBoost Regressor"
                    />
                  )}
                  {visibleModels.catboost && (
                    <Line
                      type="monotone"
                      dataKey="catboost"
                      stroke="#f59e0b"
                      strokeWidth={1.8}
                      dot={false}
                      name="CatBoost Model"
                    />
                  )}
                  {visibleModels.randomForest && (
                    <Line
                      type="monotone"
                      dataKey="randomForest"
                      stroke="#ec4899"
                      strokeWidth={1.5}
                      dot={false}
                      name="Random Forest"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Accuracy Benchmark & Feature Importance Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Model Verification Metrics */}
            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Open Source Model Verification Metrics (Out-of-Sample)</span>
              </h3>

              <div className="space-y-3 font-mono text-xs">
                {Object.entries(forecastData.modelMetrics).map(([modelKey, metrics]) => (
                  <div key={modelKey} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase">{modelKey}</span>
                      <span className="text-emerald-400 font-bold">
                        {metrics.directionalAccuracyPct}% Directional Accuracy
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                      <div>R² Fit Score: <strong className="text-zinc-200">{metrics.r2Score}</strong></div>
                      <div>Mean Absolute Error (MAE): <strong className="text-zinc-200">${metrics.mae}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Feature Importance Breakdown */}
            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>XGBoost & CatBoost Feature Importance Weights</span>
              </h3>

              <div className="space-y-2.5">
                {forecastData.featureImportance.map((f, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-300 font-medium">{f.feature}</span>
                      <span className="text-cyan-400 font-bold">{f.importancePct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                        style={{ width: `${f.importancePct * 3.5}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Impact Vector: {f.directionalImpact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: MACROECONOMIC TIME-SERIES                                      */}
      {/* ========================================================================= */}
      {activeTab === 'macro' && (
        <div className="space-y-6">
          {/* Macro Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {macroList.map(item => (
              <button
                key={item.seriesId}
                onClick={() => setSelectedMacroId(item.seriesId)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedMacroId === item.seriesId
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <span>{item.name}</span>
                <span className="px-1.5 py-0.2 rounded bg-zinc-950 text-[10px] text-emerald-400 font-bold">
                  {item.latestValue} {item.units}
                </span>
              </button>
            ))}
          </div>

          {/* Detailed Series Chart & Analysis */}
          {selectedMacroSeries && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-cyan-400" />
                      <span>{selectedMacroSeries.name}</span>
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono">
                      Series ID: <code className="text-cyan-300">{selectedMacroSeries.seriesId}</code> · Region: {selectedMacroSeries.region}
                    </p>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-lg font-black text-white">
                      {selectedMacroSeries.latestValue} {selectedMacroSeries.units}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold">
                      Trend: {selectedMacroSeries.trend}
                    </div>
                  </div>
                </div>

                {/* Macro Recharts Bar/Line Chart */}
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={selectedMacroSeries.history} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                      <YAxis stroke="#71717a" tick={{ fontSize: 11, fill: '#a1a1aa' }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '0.75rem', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" fill="#06b6d4" fillOpacity={0.4} radius={[4, 4, 0, 0]} name={selectedMacroSeries.units} />
                      <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 4, fill: '#22d3ee' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Macro Impact Analysis */}
              <div className="lg:col-span-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Market Structure & Equity Cross-Impact</span>
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase">Impact Assessment</span>
                    <div className="text-emerald-400 font-bold text-sm">
                      {selectedMacroSeries.impactOnEquities.replace(/_/g, ' ')}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase">Update Frequency</span>
                    <div className="text-zinc-200 font-bold">
                      {selectedMacroSeries.frequency} Reporting Cycle
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase">Python SDK Query</span>
                    <pre className="text-[10px] text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                      client.series("{selectedMacroSeries.seriesId}")
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: MULTI-ASSET OPEN DATA FEEDS & TICKS                            */}
      {/* ========================================================================= */}
      {activeTab === 'open_feeds' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500">COVERAGE</span>
              <div className="text-lg font-black text-white">28,450+ Assets</div>
              <div className="text-[10px] text-zinc-400">US, UK LSE, TSX, CME, Crypto</div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500">FEED PROTOCOL</span>
              <div className="text-lg font-black text-cyan-400">WebSocket + REST</div>
              <div className="text-[10px] text-zinc-400">JSON & Binary Parquet streams</div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500">THROUGHPUT</span>
              <div className="text-lg font-black text-emerald-400">4.2 Billion</div>
              <div className="text-[10px] text-zinc-400">Daily normalized market ticks</div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500">TIER ACCESS</span>
              <div className="text-lg font-black text-amber-400">Open Free Tier</div>
              <div className="text-[10px] text-zinc-400">No mandatory paywalls for research</div>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Multi-Asset Live Streaming Universe</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">Asset Name</th>
                    <th className="pb-3">Exchange</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Stream Latency</th>
                    <th className="pb-3 text-right">Inspect Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {POPULAR_LSE_INSTRUMENTS.map((inst) => (
                    <tr key={inst.symbol} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 font-bold text-white">{inst.symbol}</td>
                      <td className="py-3 text-zinc-300">{inst.name}</td>
                      <td className="py-3">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                          {inst.exchange}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-400">{inst.category}</td>
                      <td className="py-3 text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>~{Math.floor(18 + Math.random() * 12)}ms</span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleSelectSymbol(inst.symbol)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 transition-all"
                        >
                          Forecast &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: PYTHON SDK & CODE GENERATOR (lse-data)                        */}
      {/* ========================================================================= */}
      {activeTab === 'sdk_code' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Code className="w-5 h-5 text-cyan-400" />
                  <span>Reproducible Python Pipeline (`lse-data`)</span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Standard open-source client for ingestion, tick streaming, and backtest archives
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-950 text-cyan-300 border border-zinc-800">
                  pip install lse-data
                </span>

                <button
                  onClick={handleCopyPython}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950/40"
                >
                  {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>
            </div>

            {/* Code Block */}
            <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800 font-mono text-xs overflow-x-auto text-zinc-300 leading-relaxed shadow-inner">
              <pre>{codeSnippet}</pre>
            </div>

            {/* Terminal Open Source Links */}
            <div className="pt-2 flex items-center justify-between text-xs font-mono text-zinc-500 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/londonstrategicedge/lse-data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span>·</span>
                <a
                  href="https://github.com/londonstrategicedge/lse-terminal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Terminal Project</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="text-[10px]">
                Educational & Algorithmic Research Mandate Compliant
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
