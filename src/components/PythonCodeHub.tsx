import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Terminal,
  Play,
  Copy,
  Download,
  Check,
  Cpu,
  Layers,
  Sparkles,
  Server,
  Zap,
  Globe,
  TrendingUp,
  ShieldAlert,
  Compass,
  Code2,
  RefreshCw,
  FolderArchive,
  ArrowRight
} from 'lucide-react';
import { cn } from '../utils/cn';

interface PythonModule {
  filename: string;
  name: string;
  description: string;
  category: string;
  sizeBytes?: number;
}

const STATIC_MODULES: PythonModule[] = [
  {
    filename: 'main.py',
    name: 'Unified CLI Orchestrator',
    description: 'CLI entry point for running projections, autonomous news scanning, supply chain telemetry, options, and server.',
    category: 'CLI & Core'
  },
  {
    filename: 'server.py',
    name: 'Standalone REST API Server',
    description: 'Multi-threaded Python standard library HTTP server implementing all market, news, and projection routes.',
    category: 'Backend Server'
  },
  {
    filename: 'projection_engine.py',
    name: 'Monte Carlo & Fuzzy Logic Engine',
    description: 'Geometric Brownian Motion with antithetic variates, Merton jumps, Mamdani Fuzzy Logic controller, and Fourier filtering.',
    category: 'Quantitative Math'
  },
  {
    filename: 'news_scanner.py',
    name: 'Autonomous Global News Scanner',
    description: 'Continuous market news scanner with NLP sentiment quantification (-1 to +1), urgency scoring, and stock ticker mapping.',
    category: 'AI & Market News'
  },
  {
    filename: 'supply_chain.py',
    name: 'Maritime Supply Chain & Open API',
    description: 'Telemetry for 8 maritime chokepoints, 7 mega ports, live vessel fleet, and OpenStreetMap geocoding.',
    category: 'Supply Chain'
  },
  {
    filename: 'options_pricing.py',
    name: 'Black-Scholes & Greeks Engine',
    description: 'Analytical European options model, Delta/Gamma/Theta/Vega/Rho, volatility smile, and Newton-Raphson IV.',
    category: 'Derivatives'
  },
  {
    filename: 'backtest_engine.py',
    name: 'HFT Strategy Backtester',
    description: 'Event-driven simulation with slippage, commissions, Half-Kelly allocation, and Sharpe/Sortino ratios.',
    category: 'Backtesting'
  }
];

export default function PythonCodeHub() {
  const [modules, setModules] = useState<PythonModule[]>(STATIC_MODULES);
  const [selectedFilename, setSelectedFilename] = useState<string>('main.py');
  const [codeContent, setCodeContent] = useState<string>('');
  const [isLoadingCode, setIsLoadingCode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Terminal execution state
  const [terminalRunning, setTerminalRunning] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [customArgs, setCustomArgs] = useState<string>('status');
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal' | 'guide'>('editor');

  // Load code for selected module
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCode(true);

    fetch(`/api/python/file/${selectedFilename}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && data.code) {
          setCodeContent(data.code);
        }
      })
      .catch(() => {
        // Fallback placeholder if backend is restarting
        if (isMounted) {
          setCodeContent(`# Loading ${selectedFilename} from Python repository...\n# Please verify the server is running.`);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingCode(false);
      });

    return () => { isMounted = false; };
  }, [selectedFilename]);

  // Copy code handler
  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download file handler
  const handleDownload = () => {
    const blob = new Blob([codeContent], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Run script directly in container
  const handleRunScript = (scriptName: string = selectedFilename, argsString: string = customArgs) => {
    setActiveTab('terminal');
    setTerminalRunning(true);
    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] $ python3 python/${scriptName} ${argsString}`.trim()
    ]);

    const argsList = argsString.trim() ? argsString.trim().split(/\s+/) : [];

    fetch('/api/python/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: scriptName,
        args: argsList
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.stdout) {
          const lines = data.stdout.trim().split('\n');
          setTerminalLogs(prev => [...prev, ...lines]);
        }
        if (data.stderr) {
          setTerminalLogs(prev => [...prev, `[STDERR] ${data.stderr}`]);
        }
        setTerminalLogs(prev => [
          ...prev,
          `[Process completed in ${data.durationMs || 12}ms with exit code ${data.exitCode ?? 0}]`,
          '--------------------------------------------------------------------------------'
        ]);
      })
      .catch(err => {
        setTerminalLogs(prev => [
          ...prev,
          `[Execution Error] ${err.message}`,
          '--------------------------------------------------------------------------------'
        ]);
      })
      .finally(() => {
        setTerminalRunning(false);
      });
  };

  const selectedModule = modules.find(m => m.filename === selectedFilename) || modules[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900/80 to-blue-950/30 border border-emerald-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <FileCode size={22} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black uppercase tracking-wider text-white">
                    QuantLab Python 3 Quantitative Suite
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Pure Python 3.10+
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Zero-Dependency Core
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
                  Complete standalone Python codebase implementing the entire quantitative platform: Monte Carlo simulations, Mamdani Fuzzy Logic controller, autonomous global news scanner, maritime supply chain open APIs, Black-Scholes Greeks, and a multi-threaded REST server.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => handleRunScript('main.py', 'status')}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
            >
              <Play size={14} className="fill-black" />
              Run Python Diagnostic
            </button>
          </div>
        </div>

        {/* Quick Launch Command Bar */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Terminal size={13} className="text-emerald-400" />
            Quick Python CLI:
          </span>
          <button
            onClick={() => handleRunScript('main.py', 'project AAPL --days 30 --simulations 500')}
            className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 font-mono text-[11px] transition-all flex items-center gap-1.5"
          >
            <TrendingUp size={11} className="text-emerald-400" />
            python main.py project AAPL
          </button>
          <button
            onClick={() => handleRunScript('main.py', 'news')}
            className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 font-mono text-[11px] transition-all flex items-center gap-1.5"
          >
            <Globe size={11} className="text-blue-400" />
            python main.py news
          </button>
          <button
            onClick={() => handleRunScript('main.py', 'supply-chain')}
            className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 font-mono text-[11px] transition-all flex items-center gap-1.5"
          >
            <Compass size={11} className="text-amber-400" />
            python main.py supply-chain
          </button>
          <button
            onClick={() => handleRunScript('main.py', 'options SPY --strike 580')}
            className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 font-mono text-[11px] transition-all flex items-center gap-1.5"
          >
            <Zap size={11} className="text-purple-400" />
            python main.py options SPY
          </button>
          <button
            onClick={() => handleRunScript('main.py', 'backtest NVDA')}
            className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 font-mono text-[11px] transition-all flex items-center gap-1.5"
          >
            <Cpu size={11} className="text-cyan-400" />
            python main.py backtest NVDA
          </button>
        </div>
      </div>

      {/* Main Workspace Layout: File Explorer + Code Editor / Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Explorer (4 Cols) */}
        <div className="lg:col-span-4 bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Code2 size={14} className="text-emerald-400" />
              Python Modules (python/)
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">
              {modules.length} files
            </span>
          </div>

          <div className="space-y-2">
            {modules.map(mod => {
              const isSelected = mod.filename === selectedFilename;
              return (
                <button
                  key={mod.filename}
                  onClick={() => setSelectedFilename(mod.filename)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-2xl transition-all border group",
                    isSelected
                      ? "bg-zinc-900 border-emerald-500/40 shadow-md"
                      : "bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "font-mono text-xs font-bold transition-colors",
                      isSelected ? "text-emerald-400" : "text-zinc-200 group-hover:text-white"
                    )}>
                      {mod.filename}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {mod.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {mod.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Quick CLI Runner Box */}
          <div className="pt-4 border-t border-zinc-800/60 space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Execute with Custom Arguments</span>
              <span className="text-emerald-400 font-mono">python3 {selectedFilename}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customArgs}
                onChange={e => setCustomArgs(e.target.value)}
                placeholder="e.g. status or 220 30 500"
                className="flex-1 bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleRunScript(selectedFilename, customArgs)}
                disabled={terminalRunning}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5",
                  terminalRunning
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold"
                )}
              >
                <Play size={12} className={terminalRunning ? "animate-spin" : "fill-black"} />
                Run
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Code Editor & Interactive Terminal (8 Cols) */}
        <div className="lg:col-span-8 bg-zinc-950/70 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          {/* Editor Header Bar */}
          <div className="p-4 px-6 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-white bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
                {selectedFilename}
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                {selectedModule.name}
              </span>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-2">
              <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                    activeTab === 'editor' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Code View
                </button>
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
                    activeTab === 'terminal' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Terminal
                  {terminalRunning && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                </button>
                <button
                  onClick={() => setActiveTab('guide')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                    activeTab === 'guide' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Setup Guide
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all"
                title="Copy Code"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>

              <button
                onClick={handleDownload}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 transition-all"
                title="Download .py file"
              >
                <Download size={14} />
              </button>
            </div>
          </div>

          {/* Tab Body */}
          <div className="p-6 flex-1 min-h-[520px] max-h-[680px] overflow-hidden flex flex-col">
            {activeTab === 'editor' && (
              <div className="flex-1 relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950">
                <div className="absolute right-4 top-3 z-10 text-[10px] font-mono text-zinc-500 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                  {codeContent.split('\n').length} lines • Python 3
                </div>
                <pre className="p-5 font-mono text-xs text-zinc-300 overflow-auto h-full leading-relaxed select-text shadow-inner">
                  <code>{codeContent}</code>
                </pre>
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="flex-1 rounded-2xl bg-black border border-zinc-800 font-mono text-xs overflow-y-auto p-4 space-y-1.5 shadow-inner flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900 text-zinc-600 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-zinc-400">bash - /python-runtime (Python 3.10)</span>
                  </div>
                  <span>{terminalRunning ? "RUNNING..." : "IDLE"}</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pt-2">
                  {terminalLogs.length === 0 ? (
                    <div className="py-20 text-center text-zinc-600">
                      <Terminal size={32} className="mx-auto mb-2 opacity-30" />
                      <p>Run any script or CLI command above to see live stdout and mathematical evaluation here.</p>
                    </div>
                  ) : (
                    terminalLogs.map((log, i) => (
                      <div
                        key={i}
                        className={cn(
                          "leading-relaxed whitespace-pre-wrap",
                          log.startsWith("$") ? "text-emerald-400 font-bold" :
                          log.includes("[Process completed") ? "text-zinc-500 font-semibold" :
                          log.includes("Error") || log.includes("STDERR") ? "text-rose-400 font-semibold" :
                          log.includes("PROJECTION SUMMARY") || log.includes("QUANTITATIVE BACKTEST") ? "text-amber-300 font-bold" :
                          "text-zinc-300"
                        )}
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'guide' && (
              <div className="space-y-6 overflow-y-auto max-h-[580px] pr-2">
                <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                  <h4 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Zap size={16} />
                    Running Locally on Your Own Machine
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    The entire QuantLab Python codebase is self-contained. The mathematical models, Monte Carlo engine, news scanner, and HTTP server require <strong>zero pip dependencies</strong> to execute out of the box with standard Python 3.9+:
                  </p>
                  <pre className="p-3.5 rounded-xl bg-black border border-zinc-800 text-xs font-mono text-emerald-400">
                    {`# 1. Clone repository and navigate to folder
cd QuantTrade

# 2. Run system status diagnostic
python main.py status

# 3. Run Monte Carlo simulation for any ticker
python main.py project AAPL --days 30 --simulations 1000

# 4. Run autonomous global news scanner
python main.py news --daemon

# 5. Start standalone Python REST API server on port 8080
python main.py server --port 8080`}
                  </pre>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                  <h4 className="text-sm font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <Server size={16} />
                    Optional Scientific & Brokerage Packages
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    If you wish to use extended libraries (such as pandas, yfinance, or Alpaca/CCXT live order execution), install the optional dependencies:
                  </p>
                  <pre className="p-3.5 rounded-xl bg-black border border-zinc-800 text-xs font-mono text-blue-300">
                    pip install -r requirements.txt
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
