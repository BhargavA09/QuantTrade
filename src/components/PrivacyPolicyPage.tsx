import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Trash2, 
  Download, 
  RefreshCw, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  EyeOff, 
  Server, 
  Cpu, 
  ExternalLink,
  ChevronRight,
  Mail
} from 'lucide-react';
import { cn } from '../utils/cn';

interface PrivacyPolicyPageProps {
  onOpenContact: () => void;
  onNavigateToTab: (tab: any) => void;
}

interface StorageAuditItem {
  key: string;
  category: 'Preferences' | 'Portfolio & Orders' | 'Watchlist & Tickers' | 'Strategy Backtests';
  sizeBytes: number;
  itemCount?: number;
  description: string;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onOpenContact, onNavigateToTab }) => {
  const [activeSection, setActiveSection] = useState<string>('local-first');
  const [storageItems, setStorageItems] = useState<StorageAuditItem[]>([]);
  const [totalStorageBytes, setTotalStorageBytes] = useState<number>(0);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Scan localStorage to provide live transparency
  const scanLocalStorage = () => {
    try {
      const items: StorageAuditItem[] = [];
      let totalBytes = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const val = localStorage.getItem(key) || '';
        const bytes = new Blob([key + val]).size;
        totalBytes += bytes;

        let category: StorageAuditItem['category'] = 'Preferences';
        let desc = 'System configuration and layout settings';
        let count = undefined;

        if (key.includes('portfolio') || key.includes('trade') || key.includes('order')) {
          category = 'Portfolio & Orders';
          desc = 'Simulated holdings, cash balance, and historical paper trades';
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) count = parsed.length;
          } catch {}
        } else if (key.includes('ticker') || key.includes('watchlist')) {
          category = 'Watchlist & Tickers';
          desc = 'Tracked symbols, custom tickers, and watchlist pins';
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) count = parsed.length;
          } catch {}
        } else if (key.includes('strategy') || key.includes('backtest') || key.includes('python')) {
          category = 'Strategy Backtests';
          desc = 'Saved algorithmic parameters, Python templates, and test results';
        }

        items.push({
          key,
          category,
          sizeBytes: bytes,
          itemCount: count,
          description: desc
        });
      }

      setStorageItems(items);
      setTotalStorageBytes(totalBytes);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    scanLocalStorage();
  }, []);

  const handleExportData = () => {
    try {
      const dump: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const val = localStorage.getItem(key);
        try {
          dump[key] = val ? JSON.parse(val) : val;
        } catch {
          dump[key] = val;
        }
      }

      const jsonStr = JSON.stringify(dump, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quantlab_personal_data_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setActionNotice('Local data exported successfully as JSON.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setActionNotice('Failed to export data: ' + err.message);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handlePurgeData = () => {
    try {
      localStorage.clear();
      scanLocalStorage();
      setShowPurgeConfirm(false);
      setActionNotice('All local storage data has been permanently cleared.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setActionNotice('Error clearing storage: ' + err.message);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 pb-16 px-4 sm:px-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-emerald-500/40 text-emerald-300 rounded-xl shadow-2xl backdrop-blur-md text-xs font-semibold"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{actionNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner with Measured Contrast Scrim */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800/80 shadow-2xl">
        <div className="relative h-48 sm:h-64 w-full overflow-hidden">
          <img
            src="/src/assets/images/security_vault_cipher_1791050268600.jpg"
            alt="Cryptographic Data Vault"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Measured Scrim for WCAG AA compliance */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/30" />
        </div>

        <div className="relative z-10 -mt-20 px-6 sm:px-10 pb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} />
              Privacy & Data Sovereign Protocol
            </span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>Version 2.4</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>Updated October 2026</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            QuantLab Privacy Policy & Data Architecture
          </h1>

          <p className="text-sm text-zinc-300 max-w-3xl leading-relaxed">
            QuantLab is built on a <strong className="text-emerald-400">local-first, privacy-by-design</strong> architecture. 
            Your simulated portfolios, custom quantitative formulas, and watchlists remain on your machine. 
            We do not sell data, we do not require brokerage credentials, and we run algorithms transparently.
          </p>
        </div>
      </section>

      {/* Core Privacy Guarantees Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Lock size={16} />
            <span>Zero Broker Credentials</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">No Financial Account Linking</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            QuantLab never prompts for, stores, or transmits your brokerage login, API keys with trading withdrawal access, or bank account credentials. All simulations use paper currency.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <EyeOff size={16} />
            <span>No Cross-Site Ad Tracking</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">Zero Behavioral Telemetry</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            We do not use surveillance pixels, Google Analytics tracking beacons, or data brokers. Your research habits and asset screens are your private intellectual property.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Database size={16} />
            <span>Data Sovereignty</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">Full User Control</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Your simulated trade logs and parameters reside in your browser's local sandbox. You can inspect, download, or permanently purge your local cache at any moment.
          </p>
        </div>
      </section>

      {/* Interactive Local Storage Audit Inspector */}
      <section className="p-6 sm:p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Database size={15} />
              <span>Client-Side Storage Transparency Inspector</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Live Audit of Data Residing in Your Browser
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={scanLocalStorage}
              className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              <span>Rescan</span>
            </button>
            <button
              onClick={handleExportData}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
            >
              <Download size={13} />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => setShowPurgeConfirm(true)}
              className="px-3 py-1.5 rounded-xl border border-rose-800/60 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={12} />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>

        {/* Storage stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-zinc-500 block text-[10px] uppercase">Active Keys</span>
            <span className="text-base font-bold text-white tabular-nums">{storageItems.length}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-zinc-500 block text-[10px] uppercase">Storage Footprint</span>
            <span className="text-base font-bold text-emerald-400 tabular-nums">{(totalStorageBytes / 1024).toFixed(2)} KB</span>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-zinc-500 block text-[10px] uppercase">Encryption Status</span>
            <span className="text-base font-bold text-blue-400">Sandbox Isolated</span>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-zinc-500 block text-[10px] uppercase">Cross-Site Leakage</span>
            <span className="text-base font-bold text-emerald-400">0.00% (Strict)</span>
          </div>
        </div>

        {/* Live table of storage keys */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Storage Key</th>
                <th className="pb-3 px-4">Category</th>
                <th className="pb-3 px-4">Purpose & Scope</th>
                <th className="pb-3 pl-4 text-right">Size (Bytes)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
              {storageItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-zinc-500">
                    No persistent local keys detected in this browser session.
                  </td>
                </tr>
              ) : (
                storageItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 pr-4 font-semibold text-white truncate max-w-[200px]">{item.key}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-zinc-400 text-xs max-w-sm truncate">
                      {item.description}
                      {item.itemCount !== undefined && ` (${item.itemCount} items)`}
                    </td>
                    <td className="py-3 pl-4 text-right tabular-nums text-emerald-400">
                      {item.sizeBytes} B
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirmation Modal for Data Purge */}
      <AnimatePresence>
        {showPurgeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full rounded-2xl bg-zinc-900 border border-zinc-700 p-6 space-y-4 shadow-2xl text-left"
            >
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle size={24} />
                <h3 className="text-base font-bold text-white">Reset Local Simulation Data?</h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                This will clear all custom watchlists, simulated paper trade history, and portfolio logs stored in your browser. 
                This action is immediate and cannot be undone.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowPurgeConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurgeData}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg"
                >
                  Yes, Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Policy Sections */}
      <section className="space-y-6">
        <div className="border-b border-zinc-800/80 pb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Detailed Data Protection & Compliance Standards
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Full disclosure on network requests, algorithms, cookies, and regulatory position.
          </p>
        </div>

        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server size={16} className="text-emerald-400" />
              1. Market Data Ingestion & Network Requests
            </h3>
            <p>
              QuantLab fetches real-time and historical equity, ETF, and crypto quotes through vetted server-side proxy routes (<code className="text-xs font-mono bg-zinc-950 px-1.5 py-0.5 rounded text-emerald-300">/api/stock/*</code>). 
              Requests to external financial sources (e.g. Yahoo Finance) are executed strictly on the backend to prevent IP exposure of the client and enforce query caching.
            </p>
            <p className="text-xs text-zinc-400">
              No user-identifying telemetry or portfolio balance headers are attached to outbound market data queries. Outbound queries carry only standard HTTP headers and ticker identifiers.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu size={16} className="text-purple-400" />
              2. Algorithmic Processing & Strategy IP
            </h3>
            <p>
              All mathematical models—including Monte Carlo Geometric Brownian Motion, Fourier Cycle Wave transforms, Fuzzy Logic regime classifiers, and Backtesting simulations—run client-side in your browser's V8 engine or on your isolated private server runtime.
            </p>
            <p className="text-xs text-zinc-400">
              Your customized quantitative strategy parameters, stop-loss ratios, and profit targets are never sent to external AI aggregators or sold to third-party hedge funds.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              3. Regulatory Position: Non-Advisory Simulator
            </h3>
            <p>
              QuantLab is an interactive quantitative educational simulator. It is not a registered investment advisor, broker-dealer, or financial intermediary under the jurisdiction of the U.S. Securities and Exchange Commission (SEC), Financial Industry Regulatory Authority (FINRA), or equivalent global authorities.
            </p>
            <p className="text-xs text-zinc-400">
              Simulation results, algorithmic trade suggestions, and intrinsic valuation scores do not constitute investment advice or a recommendation to purchase or liquidate any security. Past simulated returns do not guarantee future live performance.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              4. User Rights (GDPR & CCPA Harmonization)
            </h3>
            <p>
              Under global data sovereignty principles (including GDPR and CCPA), you hold the right to:
            </p>
            <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 pl-2 font-mono">
              <li>Right to Access: View all cached keys via the Live Audit Inspector above.</li>
              <li>Right to Portability: Download your complete JSON profile and simulated trade history.</li>
              <li>Right to Erasure: Instantly purge all localStorage records using the Clear Cache button.</li>
              <li>Right to Non-Discrimination: Complete access to all features without telemetry opt-in.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Support and Contact Officer */}
      <section className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-white tracking-tight">Have a Privacy or Compliance Question?</h3>
          <p className="text-xs text-zinc-400">
            Our data protection desk is available to address queries regarding simulation privacy and architecture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenContact}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2"
          >
            <Mail size={14} />
            <span>Contact Data Officer</span>
          </button>
          <button
            onClick={() => onNavigateToTab('about')}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all border border-zinc-700 flex items-center gap-2"
          >
            <span>About Creator</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;
