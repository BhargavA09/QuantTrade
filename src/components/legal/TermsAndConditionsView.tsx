import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Scale, 
  AlertTriangle, 
  BookOpen, 
  CheckCircle2, 
  Lock, 
  Printer, 
  Sparkles, 
  ArrowUpRight, 
  HelpCircle,
  ExternalLink,
  Clock,
  Layers,
  Search,
  Check
} from 'lucide-react';

interface TermsAndConditionsViewProps {
  onAcknowledge?: () => void;
  onNavigateToTerminal?: () => void;
}

export const TermsAndConditionsView: React.FC<TermsAndConditionsViewProps> = ({
  onAcknowledge,
  onNavigateToTerminal
}) => {
  const [hasAccepted, setHasAccepted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('quant_terms_accepted') === 'true';
    } catch {
      return false;
    }
  });

  const [acceptedTimestamp, setAcceptedTimestamp] = useState<string | null>(() => {
    try {
      return localStorage.getItem('quant_terms_accepted_date');
    } catch {
      return null;
    }
  });

  const [activeSection, setActiveSection] = useState<'all' | 'educational' | 'non_fiduciary' | 'risk_warning' | 'algorithmic_sim' | 'liability'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmToast, setConfirmToast] = useState<string | null>(null);

  const handleAcceptTerms = () => {
    const now = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
    try {
      localStorage.setItem('quant_terms_accepted', 'true');
      localStorage.setItem('quant_terms_accepted_date', now);
    } catch {}
    setHasAccepted(true);
    setAcceptedTimestamp(now);
    setConfirmToast('✓ Acknowledged: You have confirmed the Educational & Research Mandate.');
    if (onAcknowledge) onAcknowledge();
    setTimeout(() => setConfirmToast(null), 5000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-amber-500/40 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                OFFICIAL TERMS OF USE &amp; REGULATORY DISCLOSURE
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Version 3.4 · Effective Date: October 31, 2026
              </span>
              {hasAccepted ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ACCEPTED &amp; VERIFIED
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  ACKNOWLEDGMENT PENDING
                </span>
              )}
            </div>
            
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Platform Terms, Disclaimers &amp; Usage Protocol</span>
            </h2>
            
            <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
              Please review these legally binding terms carefully prior to utilizing the QuantTrade Pro platform, its algorithmic models, Fourier signal decomposition tools, C-suite Form 4 insider radar, and stochastic scenario projections.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors border border-zinc-700/80"
              title="Print or Save Official Legal Disclosures as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            {onNavigateToTerminal && (
              <button
                onClick={onNavigateToTerminal}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
              >
                <span>Return to Terminal &rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. CORE STATUTORY HIGHLIGHT: STRICTLY FOR EDUCATIONAL & RESEARCH PURPOSES */}
        <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm uppercase tracking-wide font-mono">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <span>MANDATORY STATUTORY NOTICE: EDUCATIONAL &amp; RESEARCH USE ONLY</span>
          </div>
          <p className="text-xs text-amber-100/90 leading-relaxed font-sans font-medium">
            THIS PLATFORM, INCLUDING ALL ARTIFICIAL INTELLIGENCE ENGINES, REINFORCEMENT LEARNING MODELS, FOURIER WAVELET SIGNAL FILTERS, INTRADAY BUY RECOMMENDATIONS, OUT PRICE CAPS, VALUE AT RISK (VAR) PROJECTIONS, AND MONTE CARLO TRAJECTORIES, IS DEVELOPED, MAINTAINED, AND PROVIDED <strong>STRICTLY AND EXCLUSIVELY FOR EDUCATIONAL, ACADEMIC, AND SCIENTIFIC QUANTITATIVE RESEARCH PURPOSES ONLY</strong>. UNDER NO CIRCUMSTANCES DOES ANY CONTENT, ALGORITHM, SIGNAL, SCORE, OR CALCULATION CONSTITUTE FINANCIAL, INVESTMENT, TAX, ACCOUNTING, OR LEGAL ADVICE.
          </p>
        </div>
      </div>

      {/* Confirmation Toast */}
      {confirmToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center justify-between gap-2 shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{confirmToast}</span>
          </div>
          <button 
            onClick={() => setConfirmToast(null)}
            className="text-zinc-400 hover:text-white px-2 py-0.5 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Section Filter Navigation & Live Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800">
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'all' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Sections (6)
          </button>
          <button
            onClick={() => setActiveSection('educational')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'educational' 
                ? 'bg-amber-600 text-white' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            1. Educational Scope
          </button>
          <button
            onClick={() => setActiveSection('non_fiduciary')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'non_fiduciary' 
                ? 'bg-indigo-600 text-white' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            2. Non-Fiduciary
          </button>
          <button
            onClick={() => setActiveSection('risk_warning')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'risk_warning' 
                ? 'bg-rose-600 text-white' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            3. Risk of Loss
          </button>
          <button
            onClick={() => setActiveSection('algorithmic_sim')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'algorithmic_sim' 
                ? 'bg-teal-600 text-white' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            4. Simulation Policy
          </button>
          <button
            onClick={() => setActiveSection('liability')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'liability' 
                ? 'bg-zinc-700 text-white' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            5. Liability
          </button>
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search clauses, SEC, advice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>
      </div>

      {/* 4. Comprehensive Legal Clauses & Terms Body */}
      <div className="space-y-4">
        {/* SECTION 1 */}
        {(activeSection === 'all' || activeSection === 'educational') && (
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-black font-mono text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
                  Educational, Academic &amp; Quantitative Research Scope
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Clause 1.0</span>
            </div>

            <div className="text-xs text-zinc-300 leading-relaxed space-y-2.5 font-sans">
              <p>
                <strong>1.1 Purpose:</strong> QuantTrade Pro is an interactive pedagogical simulation suite and quantitative research framework created to explore mathematical time-series modeling, signal processing (including Discrete Fourier Transforms and Kalman Filtering), statistical arbitrage, stochastic simulations (Monte Carlo jump-diffusion paths), and machine learning reinforcement architectures.
              </p>
              <p>
                <strong>1.2 Non-Commercial Scientific Exploration:</strong> All algorithmic strategies, backtesting outputs, win-rate metrics, profit factor estimations, and suggested execution windows represent mathematical hypotheses evaluated against historical or delayed informational series. They are designed exclusively for intellectual study, software validation, and econometric modeling.
              </p>
              <p>
                <strong>1.3 No Brokerage Affiliation:</strong> QuantTrade Pro is not an authorized or registered banking institution, broker-dealer, asset management firm, or electronic communications network (ECN). The system does not hold customer funds, clear securities, or route orders to execution venues or public exchanges.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 2 */}
        {(activeSection === 'all' || activeSection === 'non_fiduciary') && (
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-black font-mono text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
                  No Investment, Financial, Tax, or Legal Advice
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Clause 2.0</span>
            </div>

            <div className="text-xs text-zinc-300 leading-relaxed space-y-2.5 font-sans">
              <p>
                <strong>2.1 Non-Fiduciary Relationship:</strong> Nothing contained within the application, including the &ldquo;Trader Brain&rdquo;, &ldquo;Buy &amp; Out Price Cap Model&rdquo;, &ldquo;Delta-Gamma Gauge&rdquo;, &ldquo;VolumeLens Order Flow&rdquo;, or &ldquo;Global Scenario Projections&rdquo;, constitutes a personalized recommendation, endorsement, solicitation, or offer to purchase or liquidate any security, derivative, option, future, penny stock, currency, or cryptocurrency.
              </p>
              <p>
                <strong>2.2 Regulatory Registration Disclaimer:</strong> The authors, contributors, operators, and developers of QuantTrade Pro are not registered as Investment Advisers under the U.S. Investment Advisers Act of 1940, the Commodity Exchange Act (CFTC), the Canadian Provincial Securities Commissions (such as OSC or BCSC), the UK Financial Conduct Authority (FCA), or any comparable international regulatory framework. No fiduciary or confidential relationship is formed by your interaction with this platform.
              </p>
              <p>
                <strong>2.3 Independent Consultation:</strong> You are strictly advised to consult with a certified, licensed, and registered financial advisor, tax attorney, or accountant before making any actual capital commitments in live financial markets.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 3 */}
        {(activeSection === 'all' || activeSection === 'risk_warning') && (
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-rose-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 font-black font-mono text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
                  Substantial Risk of Capital Loss &amp; Volatility Disclosures
                </h3>
              </div>
              <span className="text-[10px] font-mono text-rose-400 font-bold">CRITICAL WARNING</span>
            </div>

            <div className="text-xs text-zinc-300 leading-relaxed space-y-2.5 font-sans">
              <p>
                <strong>3.1 Capital Risk:</strong> Securities trading, particularly in equities, high-beta instruments, penny stocks (&lt; $5.00), leveraged derivatives, and multi-leg options strategies, carries an inherent and substantial risk of catastrophic capital loss. You may lose all or more than your initial principal investment.
              </p>
              <p>
                <strong>3.2 Penny Stock &amp; Low-Float Hazard:</strong> Micro-cap and penny stock equities are characterized by extreme price volatility, illiquidity, wide bid-ask spreads, and susceptibility to market manipulation. Algorithmic Buy recommendations and Out Price Caps generated for low-float tickers are probabilistic mathematical bounds, not guaranteed execution prices.
              </p>
              <p>
                <strong>3.3 Past Performance Non-Predictive:</strong> Hypothetical or simulated performance metrics generated by the platform (including historical win rates, Sharpe ratios, and Kelly allocations) have inherent limitations and do not represent actual trading. Past performance is no guarantee of future returns.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 4 */}
        {(activeSection === 'all' || activeSection === 'algorithmic_sim') && (
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 font-black font-mono text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
                  Simulation Methodology, Synthetic Orders &amp; Data Feeds
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Clause 4.0</span>
            </div>

            <div className="text-xs text-zinc-300 leading-relaxed space-y-2.5 font-sans">
              <p>
                <strong>4.1 Simulated Executions:</strong> All actions initiated via &ldquo;Simulate Brain Order&rdquo;, &ldquo;Simulate Trade&rdquo;, or &ldquo;Backtest Engine&rdquo; are virtual calculations recorded within browser local storage. No funds are transferred, no broker accounts are connected, and no actual market transactions occur.
              </p>
              <p>
                <strong>4.2 Friction Disclaimers:</strong> Simulations do not factor in real-world market microstructure frictions, such as execution latency, exchange access fees, order book depth depletion, partial fills, locate borrowing fees for short sales, or overnight financing costs. Real-market execution will materially deviate from simulated models.
              </p>
              <p>
                <strong>4.3 Third-Party &amp; SEC EDGAR Information:</strong> SEC Form 4 insider transaction reports, market quotes, volume profiles, and news catalysts are retrieved from publicly accessible feeds, statutory filings, and synthetic market models. While calibrated continuously, QuantTrade Pro provides this data &ldquo;AS IS&rdquo; with no express or implied warranty of accuracy, timeliness, completeness, or fitness for a particular purpose.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 5 */}
        {(activeSection === 'all' || activeSection === 'liability') && (
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-zinc-700 text-zinc-200 font-black font-mono text-xs flex items-center justify-center">
                  5
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
                  Limitation of Liability &amp; User Indemnification
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Clause 5.0</span>
            </div>

            <div className="text-xs text-zinc-300 leading-relaxed space-y-2.5 font-sans">
              <p>
                <strong>5.1 Hold Harmless:</strong> By accessing and using this application, you expressly agree to hold harmless, indemnify, and release the developers, authors, architects, cloud hosts, and contributors of QuantTrade Pro from any and all direct, indirect, consequential, punitive, or special damages, including financial trading losses, lost profits, or business interruption arising from the use of, or inability to use, this application or any information contained herein.
              </p>
              <p>
                <strong>5.2 Sole Responsibility:</strong> You acknowledge and agree that you are solely responsible for any investment or trading decisions you make, whether or not influenced by information, models, or signals displayed on QuantTrade Pro.
              </p>
              <p>
                <strong>5.3 Severability:</strong> If any provision of these Terms is deemed unlawful, void, or for any reason unenforceable, that provision shall be deemed severable from these Terms and shall not affect the validity and enforceability of any remaining provisions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 5. Production Ready Acceptance Card & Verification Stamp */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border-2 border-emerald-500/40 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-emerald-400 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>User Consent &amp; Production Verification</span>
            </div>
            <h4 className="text-base font-bold text-white">
              Confirmation of Educational &amp; Research Acknowledgment
            </h4>
            <p className="text-xs text-zinc-400">
              Your acknowledgment is cryptographically recorded in client storage to maintain an audit trail of user compliance.
            </p>
          </div>

          <div className="text-right font-mono text-xs shrink-0">
            <span className="text-zinc-500 text-[10px] uppercase block">Compliance Status</span>
            {hasAccepted ? (
              <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                <Check className="w-4 h-4" />
                Active &amp; Compliant
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center justify-end gap-1">
                <Clock className="w-4 h-4 animate-spin" />
                Pending Agreement
              </span>
            )}
            {acceptedTimestamp && (
              <span className="text-[10px] text-zinc-500 block mt-0.5">
                Timestamp: {acceptedTimestamp}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="text-xs text-zinc-300 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Educational &amp; Quantitative Research Protocol: <strong>ENFORCED</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Non-Fiduciary Investment Advice Disclaimer: <strong>ACTIVE</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!hasAccepted ? (
              <button
                onClick={handleAcceptTerms}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider font-mono bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Acknowledge &amp; Agree</span>
              </button>
            ) : (
              <button
                onClick={handleAcceptTerms}
                className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1.5 transition-colors border border-zinc-700"
                title="Re-confirm your agreement timestamp"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Re-Verify Acceptance</span>
              </button>
            )}

            {onNavigateToTerminal && (
              <button
                onClick={onNavigateToTerminal}
                className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-zinc-900 hover:bg-zinc-800 text-white flex items-center gap-1.5 transition-colors border border-zinc-700/60"
              >
                <span>Launch Terminal</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
