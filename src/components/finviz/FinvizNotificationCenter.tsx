import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { soundEngine } from '../../utils/audioAlerts';

export interface AlertRule {
  id: string;
  ticker: string;
  condition: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'RSI_OVERSOLD' | 'RSI_OVERBOUGHT' | 'WHALE_BLOCK' | 'INSIDER_BUY';
  value: number;
  label: string;
  soundType: 'bullish' | 'bearish' | 'whale' | 'tap';
  enabled: boolean;
}

const DEFAULT_ALERT_RULES: AlertRule[] = [
  { id: '1', ticker: 'NVDA', condition: 'PRICE_ABOVE', value: 145.0, label: 'NVDA Breakout Above $145.00', soundType: 'bullish', enabled: true },
  { id: '2', ticker: 'TSLA', condition: 'PRICE_BELOW', value: 230.0, label: 'TSLA Breakdown Below $230.00', soundType: 'bearish', enabled: true },
  { id: '3', ticker: 'AAPL', condition: 'RSI_OVERSOLD', value: 30, label: 'AAPL RSI < 30 (Oversold Dip)', soundType: 'bullish', enabled: true },
  { id: '4', ticker: 'ALL', condition: 'WHALE_BLOCK', value: 25000000, label: 'Any Dark Pool Block > $25M', soundType: 'whale', enabled: true },
  { id: '5', ticker: 'ALL', condition: 'INSIDER_BUY', value: 1000000, label: 'SEC Form 4 Officer Purchase > $1M', soundType: 'bullish', enabled: true }
];

interface FinvizNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FinvizNotificationCenter: React.FC<FinvizNotificationCenterProps> = ({
  isOpen,
  onClose
}) => {
  const [rules, setRules] = useState<AlertRule[]>(DEFAULT_ALERT_RULES);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [volume, setVolume] = useState<number>(soundEngine.getVolume() * 100);
  const [newTicker, setNewTicker] = useState<string>('NVDA');
  const [newCondition, setNewCondition] = useState<AlertRule['condition']>('PRICE_ABOVE');
  const [newValue, setNewValue] = useState<string>('150.00');

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

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newValue) || 100;
    const rule: AlertRule = {
      id: `rule-${Date.now()}`,
      ticker: newTicker.toUpperCase(),
      condition: newCondition,
      value: val,
      label: `${newTicker.toUpperCase()} ${newCondition.replace(/_/g, ' ')} ${val}`,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Sound & Real-Time Alert Notification Center</h3>
              <p className="text-xs text-zinc-400">Web Audio synthesis for breakouts, extreme RSI, and whale prints</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Audio Controls Bar */}
        <div className="px-5 py-3.5 bg-zinc-900/40 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
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
              {isMuted ? 'Audio Alerts: MUTED' : 'Audio Alerts: ACTIVE'}
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
                className="w-20 accent-emerald-500 cursor-pointer"
              />
              <span>{volume}%</span>
            </div>
          </div>

          {/* Test Sound Triggers */}
          <div className="flex items-center gap-1">
            <span className="text-zinc-500 text-[10px] uppercase font-bold mr-1">Synthesizer Test:</span>
            <button
              onClick={() => testSound('bullish')}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-zinc-300 text-[10px] font-mono border border-zinc-700"
            >
              Bullish Chime
            </button>
            <button
              onClick={() => testSound('bearish')}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-300 text-[10px] font-mono border border-zinc-700"
            >
              Bearish Chord
            </button>
            <button
              onClick={() => testSound('whale')}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-purple-500/20 hover:text-purple-400 text-zinc-300 text-[10px] font-mono border border-zinc-700"
            >
              Whale Sonar
            </button>
          </div>
        </div>

        {/* Scrollable Rules List */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
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
                <option value="PRICE_ABOVE">Price Above ($)</option>
                <option value="PRICE_BELOW">Price Below ($)</option>
                <option value="RSI_OVERSOLD">RSI &lt; 30 (Oversold)</option>
                <option value="RSI_OVERBOUGHT">RSI &gt; 70 (Overbought)</option>
                <option value="WHALE_BLOCK">Whale Block &gt; ($)</option>
              </select>
              <input
                type="text"
                placeholder="Target Value"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
              >
                <Plus size={14} />
                Save Alert
              </button>
            </div>
          </form>

          {/* Active Rules List */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              Active Configured Watchers ({rules.length})
            </span>
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
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Synthesizer Sound: <span className="text-cyan-400">{rule.soundType.toUpperCase()}</span>
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

        {/* Footer */}
        <div className="px-5 py-3.5 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Web Audio Synthesizer Running</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
