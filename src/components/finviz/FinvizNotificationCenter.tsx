import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Sliders,
  CheckCircle2,
  ShieldAlert,
  Flame,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Plus,
  Trash2,
  Radio,
  X,
  Zap,
  Target,
  Maximize2,
  Layers,
  Activity
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { soundEngine } from '../../utils/audioAlerts';
import {
  patternAlertManager,
  PatternAlert,
  PatternRuleConfig
} from '../../services/patternAlertService';

export interface AlertRule {
  id: string;
  ticker: string;
  condition: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'RSI_OVERSOLD' | 'RSI_OVERBOUGHT' | 'WHALE_BLOCK' | 'PATTERN_ASCENDING_TRIANGLE' | 'PATTERN_DOUBLE_BOTTOM';
  value: number;
  label: string;
  soundType: 'bullish' | 'bearish' | 'whale' | 'tap';
  enabled: boolean;
}

const DEFAULT_ALERT_RULES: AlertRule[] = [
  { id: '1', ticker: 'ALL', condition: 'PATTERN_ASCENDING_TRIANGLE', value: 85, label: 'Ascending Triangle Detected (Conf > 85%)', soundType: 'bullish', enabled: true },
  { id: '2', ticker: 'ALL', condition: 'PATTERN_DOUBLE_BOTTOM', value: 85, label: 'Double Bottom W-Reversal (Conf > 85%)', soundType: 'bullish', enabled: true },
  { id: '3', ticker: 'NVDA', condition: 'PRICE_ABOVE', value: 145.0, label: 'NVDA Breakout Above $145.00', soundType: 'bullish', enabled: true },
  { id: '4', ticker: 'TSLA', condition: 'PRICE_BELOW', value: 230.0, label: 'TSLA Breakdown Below $230.00', soundType: 'bearish', enabled: true },
  { id: '5', ticker: 'ALL', condition: 'WHALE_BLOCK', value: 25000000, label: 'Dark Pool Block > $25M', soundType: 'whale', enabled: true }
];

interface FinvizNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTicker?: (ticker: string) => void;
  onSendToQuantLab?: (ticker: string) => void;
  onNavigateToHistory?: () => void;
}

export const FinvizNotificationCenter: React.FC<FinvizNotificationCenterProps> = ({
  isOpen,
  onClose,
  onSelectTicker,
  onSendToQuantLab,
  onNavigateToHistory
}) => {
  const [activeTab, setActiveTab] = useState<'pattern_radar' | 'rules' | 'price_alerts'>('pattern_radar');
  const [alerts, setAlerts] = useState<PatternAlert[]>(patternAlertManager.getAlerts());
  const [config, setConfig] = useState<PatternRuleConfig>(patternAlertManager.getConfig());
  const [rules, setRules] = useState<AlertRule[]>(DEFAULT_ALERT_RULES);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [volume, setVolume] = useState<number>(soundEngine.getVolume() * 100);

  // Custom alert rule input state
  const [newTicker, setNewTicker] = useState<string>('NVDA');
  const [newCondition, setNewCondition] = useState<AlertRule['condition']>('PATTERN_ASCENDING_TRIANGLE');
  const [newValue, setNewValue] = useState<string>('85');

  // Subscribe to live pattern alerts
  useEffect(() => {
    const unsub = patternAlertManager.subscribe((_, all) => {
      setAlerts([...all]);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
    if (!next) soundEngine.playNotificationTap();
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    soundEngine.setVolume(v / 100);
  };

  const testSound = (type: 'bullish' | 'bearish' | 'whale' | 'tap') => {
    if (type === 'bullish') soundEngine.playBullishBreakout();
    else if (type === 'bearish') soundEngine.playBearishBreakdown();
    else if (type === 'whale') soundEngine.playWhaleSonar();
    else soundEngine.playNotificationTap();
  };

  const handleSimulatePattern = (type: 'ascending_triangle' | 'double_bottom') => {
    patternAlertManager.simulateDetection(type);
  };

  const handleToggleConfig = (key: keyof PatternRuleConfig) => {
    const updated = { ...config, [key]: !config[key] };
    setConfig(updated);
    patternAlertManager.updateConfig(updated);
    soundEngine.playNotificationTap();
  };

  const handleConfidenceChange = (val: number) => {
    const updated = { ...config, minConfidence: val };
    setConfig(updated);
    patternAlertManager.updateConfig(updated);
  };

  const handleClearAlerts = () => {
    patternAlertManager.clearAll();
    setAlerts([]);
    soundEngine.playNotificationTap();
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newValue) || 85;
    const rule: AlertRule = {
      id: `rule-${Date.now()}`,
      ticker: newTicker.toUpperCase(),
      condition: newCondition,
      value: val,
      label: `${newTicker.toUpperCase()} ${newCondition.replace(/_/g, ' ')} (${val})`,
      soundType: newCondition.includes('BELOW') ? 'bearish' : newCondition.includes('WHALE') ? 'whale' : 'bullish',
      enabled: true
    };
    setRules(prev => [rule, ...prev]);
    soundEngine.playNotificationTap();
    setNewValue('');
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    soundEngine.playNotificationTap();
  };

  const removeRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Bell size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Finviz Real-Time Alert & Pattern Radar</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-mono font-bold animate-pulse">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Live quant pattern recognition alerts for Ascending Triangles, Double Bottoms, and breakouts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Sound Control & Simulation Ribbon */}
        <div className="px-6 py-3 bg-zinc-900/40 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all",
                isMuted
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : "bg-emerald-500 text-black shadow-sm"
              )}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {isMuted ? 'Muted' : 'Audio On'}
            </button>

            {/* Volume Slider */}
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
              <span>Vol:</span>
              <input
                type="range"
                min="10"
                max="100"
                value={volume}
                onChange={e => handleVolumeChange(Number(e.target.value))}
                className="w-16 accent-emerald-500 cursor-pointer"
              />
              <span>{volume}%</span>
            </div>
          </div>

          {/* Quick Simulation Trigger Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[10px] uppercase font-bold mr-1">Simulate Detection:</span>
            <button
              onClick={() => handleSimulatePattern('ascending_triangle')}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-mono font-bold border border-cyan-500/30 transition-all flex items-center gap-1"
              title="Test Ascending Triangle Alert"
            >
              <Zap size={11} className="text-cyan-400" />
              Ascending Triangle
            </button>
            <button
              onClick={() => handleSimulatePattern('double_bottom')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-bold border border-emerald-500/30 transition-all flex items-center gap-1"
              title="Test Double Bottom Alert"
            >
              <Activity size={11} className="text-emerald-400" />
              Double Bottom
            </button>
            {onNavigateToHistory && (
              <button
                onClick={onNavigateToHistory}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-[11px] font-mono font-bold border border-zinc-700 transition-all flex items-center gap-1"
                title="Open full Pattern History & Post-Detection Performance Matrix"
              >
                <Target size={11} className="text-cyan-400" />
                <span>Pattern History</span>
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pattern_radar')}
              className={cn(
                "pb-2.5 px-3 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-1.5",
                activeTab === 'pattern_radar'
                  ? "border-cyan-500 text-cyan-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Target size={13} />
              Detected Patterns Feed ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={cn(
                "pb-2.5 px-3 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-1.5",
                activeTab === 'rules'
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Sliders size={13} />
              Pattern Detection Rules
            </button>
            <button
              onClick={() => setActiveTab('price_alerts')}
              className={cn(
                "pb-2.5 px-3 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-1.5",
                activeTab === 'price_alerts'
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Flame size={13} />
              Price / Whale Watchers ({rules.length})
            </button>
          </div>

          {activeTab === 'pattern_radar' && alerts.length > 0 && (
            <button
              onClick={handleClearAlerts}
              className="text-[11px] font-mono text-zinc-500 hover:text-rose-400 pb-2 transition-colors"
            >
              Clear Feed
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* 1. Live Pattern Radar Feed */}
          {activeTab === 'pattern_radar' && (
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 font-mono text-xs">
                  <Target size={32} className="mx-auto mb-2 text-zinc-700" />
                  No pattern alerts triggered yet. Click "Simulate Detection" above to test!
                </div>
              ) : (
                alerts.map((alert) => {
                  const isTriangle = alert.patternType === 'ascending_triangle';
                  const isDoubleBottom = alert.patternType === 'double_bottom';

                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-4 rounded-2xl border transition-all shadow-md group relative",
                        isTriangle
                          ? "bg-cyan-950/20 border-cyan-500/30 hover:border-cyan-500/60"
                          : isDoubleBottom
                          ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/60"
                          : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      {/* Top Row: Ticker & Pattern Type */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-base font-black text-white">
                            {alert.ticker}
                          </span>
                          <span className="text-xs text-zinc-400 truncate max-w-[160px]">
                            {alert.companyName}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono",
                              isTriangle
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : isDoubleBottom
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                            )}
                          >
                            {alert.patternName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-500">
                            {alert.timestamp}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                            {alert.confidence}% Conf
                          </span>
                        </div>
                      </div>

                      {/* Pattern Rationale Description */}
                      <p className="text-xs text-zinc-300 leading-relaxed mt-2 font-sans">
                        {alert.description}
                      </p>

                      {/* Key Price Levels & Action Buttons */}
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div>
                            <span className="text-zinc-500 text-[10px] block">CURRENT PRICE</span>
                            <span className="font-bold text-white">${alert.currentPrice.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[10px] block">QUANT TARGET</span>
                            <span className="font-bold text-emerald-400">${alert.targetPrice.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[10px] block">STOP LOSS</span>
                            <span className="font-bold text-rose-400">${alert.stopLossPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              patternAlertManager.markAsRead(alert.id);
                              onSelectTicker?.(alert.ticker);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Maximize2 size={12} />
                            View Chart
                          </button>
                          <button
                            onClick={() => {
                              patternAlertManager.markAsRead(alert.id);
                              onSendToQuantLab?.(alert.ticker);
                              soundEngine.playBullishBreakout();
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1"
                          >
                            <Sparkles size={12} />
                            Simulate in QuantLab
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 2. Pattern Detection Rules Config */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider block">
                  Automated Pattern Alert Channels
                </span>

                {/* Ascending Triangle Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-850">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      Ascending Triangles (Bullish Accumulation)
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Trigger alerts when swing lows rise against horizontal resistance with volume expansion
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.ascendingTriangles}
                    onChange={() => handleToggleConfig('ascendingTriangles')}
                    className="accent-cyan-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {/* Double Bottom Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-850">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Double Bottoms (W-Reversals)
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Trigger alerts when dual swing lows reject support and break through the intervening neckline
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.doubleBottoms}
                    onChange={() => handleToggleConfig('doubleBottoms')}
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {/* Horizontal Channel Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-850">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Horizontal Channels & Key Level Retests
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Alert on multi-test support/resistance corridors and breakout confirmations
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.horizontalChannels}
                    onChange={() => handleToggleConfig('horizontalChannels')}
                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {/* Minimum Confidence Slider */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-bold">Minimum Pattern Confidence Threshold:</span>
                    <span className="text-emerald-400 font-bold">{config.minConfidence}%+</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="95"
                    step="5"
                    value={config.minConfidence}
                    onChange={e => handleConfidenceChange(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>70% (More Alerts)</span>
                    <span>85% (Balanced)</span>
                    <span>95% (High Precision Only)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Custom Price / Whale Watchers */}
          {activeTab === 'price_alerts' && (
            <div className="space-y-4">
              {/* Add New Rule Form */}
              <form onSubmit={handleAddRule} className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Add Custom Quantitative Price/Signal Alert
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Ticker (e.g. NVDA)"
                    value={newTicker}
                    onChange={e => setNewTicker(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white uppercase font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={newCondition}
                    onChange={e => setNewCondition(e.target.value as any)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PATTERN_ASCENDING_TRIANGLE">Pattern: Ascending Triangle</option>
                    <option value="PATTERN_DOUBLE_BOTTOM">Pattern: Double Bottom</option>
                    <option value="PRICE_ABOVE">Price Above ($)</option>
                    <option value="PRICE_BELOW">Price Below ($)</option>
                    <option value="WHALE_BLOCK">Whale Block &gt; ($)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Value / Threshold"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <Plus size={14} />
                    Save Rule
                  </button>
                </div>
              </form>

              {/* Active Watchers List */}
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between transition-all",
                      rule.enabled
                        ? "bg-zinc-900/60 border-zinc-800 text-white"
                        : "bg-zinc-950 border-zinc-900 text-zinc-500 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => toggleRule(rule.id)}
                        className="accent-emerald-500 cursor-pointer rounded"
                      />
                      <div>
                        <div className="text-xs font-bold font-mono text-white flex items-center gap-2">
                          <span className="text-emerald-400">{rule.ticker}</span>
                          <span>{rule.label}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => testSound(rule.soundType)}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                        title="Test Sound"
                      >
                        <Volume2 size={12} />
                      </button>
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="p-1 rounded hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 text-[10px]"
                        title="Delete Rule"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-Time Quant Pattern Listener Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
