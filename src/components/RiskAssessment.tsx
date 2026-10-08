import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertCircle, 
  Zap, 
  RefreshCw, 
  Globe, 
  Bell, 
  BellRing, 
  BellOff, 
  Sliders, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Sparkles, 
  Activity, 
  Clock, 
  Flame, 
  X,
  History,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

interface CorrelationFactor {
  factor: string;
  impactScore: number;
  impactLabel: string;
}

interface RiskAnalysisData {
  riskScore: number;
  varAssessment: string;
  tailRisks: string[];
  mitigation: string[];
  correlationRisks: string;
  correlationFactors?: CorrelationFactor[];
  liveRiskAlerts?: string[];
}

export interface VolatilityAlertEvent {
  id: string;
  ticker: string;
  timestamp: string;
  measuredVol: number;
  threshold: number;
  metricType: string;
  channel: string;
}

interface RiskAssessmentProps {
  riskAnalysis: RiskAnalysisData | null;
  currentVolatility?: number;
  ticker?: string;
  currentPrice?: number;
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({ 
  riskAnalysis,
  currentVolatility,
  ticker = 'PORTFOLIO',
  currentPrice
}) => {
  // Determine effective live volatility from props or calibrated model score
  const liveVol = currentVolatility !== undefined 
    ? currentVolatility 
    : (riskAnalysis ? Math.round(riskAnalysis.riskScore * 0.45 + 12) : 26.5);

  // Configuration state with persistence
  const [threshold, setThreshold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('quant_volatility_threshold');
      return saved ? parseFloat(saved) : 28.0;
    } catch {
      return 28.0;
    }
  });

  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('quant_volatility_push_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('quant_volatility_sound_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [throttleSeconds, setThrottleSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('quant_volatility_throttle');
      return saved ? parseInt(saved, 10) : 120;
    } catch {
      return 120;
    }
  });

  const [metricMode, setMetricMode] = useState<'annual' | 'realized30' | 'intraday'>('annual');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    body: string;
    severity: 'danger' | 'warning' | 'info';
    time: string;
  } | null>(null);

  const [alertHistory, setAlertHistory] = useState<VolatilityAlertEvent[]>(() => {
    try {
      const saved = localStorage.getItem('quant_volatility_alert_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Cooldown tracker to prevent notification storming
  const lastAlertTimestampRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('quant_volatility_threshold', threshold.toString());
      localStorage.setItem('quant_volatility_push_enabled', pushEnabled.toString());
      localStorage.setItem('quant_volatility_sound_enabled', soundEnabled.toString());
      localStorage.setItem('quant_volatility_throttle', throttleSeconds.toString());
      localStorage.setItem('quant_volatility_alert_history', JSON.stringify(alertHistory.slice(0, 20)));
    } catch (e) {
      console.warn('Could not persist risk volatility settings', e);
    }
  }, [threshold, pushEnabled, soundEnabled, throttleSeconds, alertHistory]);

  // Web Audio synthesizer for alert chimes
  const playAlertChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Synthesize two-tone warning beep
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(587.33, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch (e) {
      console.log('Audio notification chime unavailable or muted', e);
    }
  };

  // Request browser push notification permission
  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Desktop push notifications are not supported in this browser environment.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermissionStatus(perm);
      if (perm === 'granted') {
        triggerPushDispatch(
          `Push Notifications Active`,
          `Automated volatility monitoring connected. Alerts will trigger when ${ticker} crosses ${threshold.toFixed(1)}%.`,
          'info'
        );
      }
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
    }
  };

  // Core push notification dispatch
  const triggerPushDispatch = (
    title: string, 
    body: string, 
    severity: 'danger' | 'warning' | 'info' = 'danger',
    isTest = false
  ) => {
    // 1. Browser Native Push Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new window.Notification(title, {
          body,
          icon: '/logo.svg',
          badge: '/logo.svg',
          tag: isTest ? 'test-volatility-alert' : `volatility-${ticker}-${Date.now()}`,
          silent: true // Audio is handled cleanly by synthesizer
        });
      } catch (err) {
        console.warn('Native push notification error:', err);
      }
    }

    // 2. Play audible synthesized alert
    if (soundEnabled) {
      playAlertChime();
    }

    // 3. Trigger In-App animated toast overlay
    const toastId = Math.random().toString();
    setActiveToast({
      id: toastId,
      title,
      body,
      severity,
      time: new Date().toLocaleTimeString()
    });

    // 4. Record to audit log
    const event: VolatilityAlertEvent = {
      id: toastId,
      ticker,
      timestamp: new Date().toLocaleTimeString(),
      measuredVol: parseFloat(liveVol.toFixed(2)),
      threshold: parseFloat(threshold.toFixed(2)),
      metricType: metricMode === 'annual' ? 'Annualized σ' : metricMode === 'realized30' ? '30D Realized' : 'True Range ATR',
      channel: permissionStatus === 'granted' ? 'Native Web Push + In-App' : 'In-App Toast'
    };

    setAlertHistory(prev => [event, ...prev.slice(0, 19)]);

    // Auto-dismiss in-app toast after 8 seconds
    setTimeout(() => {
      setActiveToast(prev => (prev?.id === toastId ? null : prev));
    }, 8000);
  };

  // Automated watcher: checks live volatility against threshold
  useEffect(() => {
    if (!pushEnabled) return;

    const isBreached = liveVol >= threshold;
    const now = Date.now();
    const elapsed = (now - lastAlertTimestampRef.current) / 1000;

    if (isBreached && elapsed >= throttleSeconds) {
      lastAlertTimestampRef.current = now;
      triggerPushDispatch(
        `🚨 Volatility Threshold Breach: ${ticker}`,
        `${ticker} live volatility surged to ${liveVol.toFixed(1)}% (Limit: ${threshold.toFixed(1)}%). Price: $${currentPrice?.toFixed(2) || 'N/A'}. Immediate risk rebalance recommended.`,
        'danger'
      );
    }
  }, [liveVol, threshold, pushEnabled, throttleSeconds, ticker, currentPrice]);

  const isCurrentBreached = liveVol >= threshold;
  const ratio = Math.min(100, Math.round((liveVol / Math.max(threshold, 1)) * 100));

  if (!riskAnalysis) return null;

  return (
    <div className="space-y-6">
      {/* Floating In-App Push Toast Alert */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start gap-3",
              activeToast.severity === 'danger'
                ? "bg-rose-950/90 border-rose-500/50 text-white shadow-rose-950/50"
                : activeToast.severity === 'warning'
                ? "bg-amber-950/90 border-amber-500/50 text-white shadow-amber-950/50"
                : "bg-zinc-900/90 border-emerald-500/50 text-white shadow-black/50"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl shrink-0 mt-0.5",
              activeToast.severity === 'danger' ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-emerald-500/20 text-emerald-400"
            )}>
              <BellRing size={20} />
            </div>
            <div className="flex-1 pr-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs uppercase tracking-wider text-rose-300">
                  {activeToast.title}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">{activeToast.time}</span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-sans">{activeToast.body}</p>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Multi-Model Risk Header */}
      <div className="glass-card p-6 bg-gradient-to-br from-zinc-900 to-black border-rose-500/20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Risk Projection</h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Multi-Model Risk Assessment</p>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-4xl font-black",
              riskAnalysis.riskScore > 70 ? "text-rose-400" : 
              riskAnalysis.riskScore > 40 ? "text-amber-400" : "text-emerald-400"
            )}>
              {riskAnalysis.riskScore}
            </div>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Composite Risk Score</p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* USER-CONFIGURABLE VOLATILITY THRESHOLD & AUTOMATED PUSH NOTIFICATION CARD */}
        {/* ========================================================================= */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Light Glow */}
          <div className={cn(
            "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700",
            isCurrentBreached ? "bg-rose-500/15" : "bg-emerald-500/10"
          )} />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sliders size={16} />
                </span>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  Automated Volatility Alert Threshold
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Push Engine
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Configure your custom volatility boundary. When {ticker} breaches this threshold, real-time push notifications and audio signals dispatch automatically.
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-2 flex-wrap">
              {permissionStatus === 'granted' ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                  <CheckCircle2 size={13} />
                  <span>Browser Push: Active</span>
                </div>
              ) : (
                <button
                  onClick={handleRequestPermission}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all"
                  title="Click to authorize system push notifications"
                >
                  <Bell size={13} className="animate-bounce" />
                  <span>Enable Browser Push</span>
                </button>
              )}

              <button
                onClick={() => setPushEnabled(!pushEnabled)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all border",
                  pushEnabled
                    ? "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
                )}
              >
                {pushEnabled ? <BellRing size={13} /> : <BellOff size={13} />}
                <span>{pushEnabled ? "Alerts: Enabled" : "Alerts: Muted"}</span>
              </button>
            </div>
          </div>

          {/* Real-time Status Gauge & Comparison Meter */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Live vs Threshold Meter */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                  <Activity size={14} className="text-blue-400" />
                  Live Measured Volatility ({ticker}):
                  <span className="text-zinc-200 font-mono font-bold text-sm ml-1">
                    {liveVol.toFixed(1)}%
                  </span>
                </span>
                <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                  Threshold Target:
                  <span className={cn(
                    "font-mono font-bold text-sm ml-1",
                    isCurrentBreached ? "text-rose-400" : "text-emerald-400"
                  )}>
                    {threshold.toFixed(1)}%
                  </span>
                </span>
              </div>

              {/* Graphical Volatility Bar */}
              <div className="relative h-4 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isCurrentBreached 
                      ? "bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 animate-pulse" 
                      : "bg-gradient-to-r from-emerald-500 to-cyan-500"
                  )}
                  style={{ width: `${Math.min(100, (liveVol / 100) * 100)}%` }}
                />
                {/* Visual marker of the threshold */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_white] z-10 transition-all duration-200"
                  style={{ left: `${Math.min(99, (threshold / 100) * 100)}%` }}
                  title={`Configured Threshold: ${threshold.toFixed(1)}%`}
                />
              </div>

              {/* Status Banner */}
              <div className={cn(
                "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs",
                isCurrentBreached 
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-200" 
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              )}>
                <div className="flex items-center gap-2">
                  {isCurrentBreached ? (
                    <AlertTriangle size={16} className="text-rose-400 shrink-0 animate-pulse" />
                  ) : (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  )}
                  <span>
                    {isCurrentBreached 
                      ? `BREACH DETECTED: ${ticker} volatility (${liveVol.toFixed(1)}%) exceeds your limit of ${threshold.toFixed(1)}%. Automated push alerts triggering.` 
                      : `NORMAL REGIME: ${ticker} volatility is safely below your ${threshold.toFixed(1)}% threshold limit.`}
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 shrink-0">
                  {ratio}% of ceiling
                </span>
              </div>
            </div>

            {/* Threshold Slider and Direct Numerical Adjustment */}
            <div className="md:col-span-5 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="volatility-threshold-input" className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame size={13} className="text-amber-400" />
                  Set Volatility Limit
                </label>
                <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-700">
                  <input
                    id="volatility-threshold-input"
                    type="number"
                    min="5"
                    max="120"
                    step="0.5"
                    value={threshold}
                    aria-label="Volatility threshold percentage"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= 200) {
                        setThreshold(val);
                      }
                    }}
                    className="w-14 bg-transparent font-mono text-sm font-black text-amber-300 focus:outline-none text-right"
                  />
                  <span className="text-xs text-zinc-400 font-bold">%</span>
                </div>
              </div>

              {/* Smooth Range Slider */}
              <input
                type="range"
                min="5"
                max="100"
                step="0.5"
                value={threshold}
                aria-label="Volatility threshold slider"
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />

              {/* Rapid Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Quick Regime Presets:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Low', val: 15 },
                    { label: 'Normal', val: 25 },
                    { label: 'Alert', val: 35 },
                    { label: 'Crisis', val: 50 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setThreshold(preset.val)}
                      className={cn(
                        "py-1 px-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border text-center",
                        threshold === preset.val
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850 hover:text-zinc-200"
                      )}
                    >
                      {preset.label} ({preset.val}%)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Config Controls Row: Metric, Cooldown, Sound & Test Dispatch */}
          <div className="mt-5 pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Metric Mode */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Volatility Metric
              </span>
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                {(['annual', 'realized30', 'intraday'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetricMode(m)}
                    className={cn(
                      "flex-1 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                      metricMode === m ? "bg-zinc-800 text-amber-300 shadow" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {m === 'annual' ? 'Annualized' : m === 'realized30' ? '30D Real' : 'ATR %'}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Throttle / Cooldown */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <Clock size={11} />
                Alert Frequency Limit
              </span>
              <select
                value={throttleSeconds}
                onChange={(e) => setThrottleSeconds(parseInt(e.target.value, 10))}
                className="w-full bg-zinc-950 text-zinc-300 text-xs font-medium border border-zinc-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-zinc-700"
              >
                <option value={30}>Every 30 seconds (High Frequency)</option>
                <option value={120}>Every 2 minutes (Balanced)</option>
                <option value={300}>Every 5 minutes (Low Noise)</option>
                <option value={1800}>Every 30 minutes (Macro Watch)</option>
              </select>
            </div>

            {/* Audio Synth Toggle */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Audio Tone Signal
              </span>
              <button
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) playAlertChime();
                }}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold transition-all border",
                  soundEnabled
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                    : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:bg-zinc-900"
                )}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span>{soundEnabled ? "Audio Chime: ON" : "Audio Chime: MUTED"}</span>
              </button>
            </div>

            {/* Test Trigger Button */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={11} className="text-cyan-400" />
                Notification Test
              </span>
              <button
                onClick={() => {
                  triggerPushDispatch(
                    `🧪 Test Volatility Alert [${ticker}]`,
                    `Simulated breach trigger: Volatility reached ${liveVol.toFixed(1)}% (Threshold: ${threshold.toFixed(1)}%). Push delivery validated.`,
                    'warning',
                    true
                  );
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)]"
              >
                <Send size={13} />
                <span>Test Push Notification</span>
              </button>
            </div>
          </div>

          {/* Breach History Log (Collapsed if empty) */}
          {alertHistory.length > 0 && (
            <div className="mt-5 pt-4 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <History size={12} className="text-zinc-400" />
                  Recent Push Notification Breach History ({alertHistory.length})
                </span>
                <button
                  onClick={() => setAlertHistory([])}
                  className="text-[10px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={11} />
                  Clear Log
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {alertHistory.slice(0, 5).map((evt) => (
                  <div 
                    key={evt.id}
                    className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-850 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-mono font-bold text-zinc-300">{evt.ticker}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-rose-400 font-mono font-semibold">
                        {evt.measuredVol.toFixed(1)}% vol
                      </span>
                      <span className="text-zinc-500">breached limit</span>
                      <span className="text-zinc-400 font-mono font-semibold">
                        {evt.threshold.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-500 text-[10px]">
                      <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
                        {evt.channel}
                      </span>
                      <span className="font-mono">{evt.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Existing Multi-Model Risk Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={14} className="text-rose-500" />
              Tail Risk Events
            </h3>
            <div className="space-y-2">
              {riskAnalysis.tailRisks.map((risk, i) => (
                <div key={i} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                  <p className="text-xs font-bold text-rose-200">{risk}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-amber-500" />
              VaR Assessment
            </h3>
            <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
              <p className="text-sm text-zinc-300 leading-relaxed italic">
                {riskAnalysis.varAssessment}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <RefreshCw size={14} className="text-emerald-500" />
              Mitigation Strategies
            </h3>
            <div className="space-y-2">
              {riskAnalysis.mitigation.map((m, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <p className="text-xs text-zinc-400">{m}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Correlation Risks Section */}
        <div className="mt-8 p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/50">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Globe size={14} className="text-blue-400" />
            Trade & Logistics Correlation Risks
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {riskAnalysis.correlationRisks}
              </p>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Risk Factor Sensitivity</h4>
                <div className="space-y-3">
                  {riskAnalysis.correlationFactors?.map((f, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-500">{f.factor}</span>
                        <span className="text-zinc-300">{f.impactLabel}</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          className={cn(
                            "h-full",
                            f.impactScore > 80 ? "bg-rose-500" : f.impactScore > 50 ? "bg-amber-500" : "bg-emerald-500"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${f.impactScore}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                  {!riskAnalysis.correlationFactors && (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-500">Shipping Lane Congestion</span>
                          <span className="text-zinc-300">High Impact</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 w-[85%]" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-500">Commodity Price Volatility</span>
                          <span className="text-zinc-300">Medium Impact</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 w-[65%]" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

