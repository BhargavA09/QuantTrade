import React from 'react';
import { AlertCircle, Zap, RefreshCw, Globe } from 'lucide-react';
import { motion } from 'motion/react';
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
}

interface RiskAssessmentProps {
  riskAnalysis: RiskAnalysisData | null;
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({ riskAnalysis }) => {
  if (!riskAnalysis) return null;

  return (
    <div className="space-y-6">
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
