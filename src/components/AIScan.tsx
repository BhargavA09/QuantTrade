import React, { useState, useRef } from 'react';
import { Upload, Brain, Activity, TrendingUp, AlertCircle, Loader2, Camera, ChevronRight, BarChart2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

interface AnalysisResult {
  pattern: string;
  confidence: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  supportLevels: string[];
  resistanceLevels: string[];
  description: string;
  projection: string;
}

export const AIScan: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, etc.)');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, etc.)');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResult(null);
      setError(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Check if we reached rate limit recently
      const cooldown = localStorage.getItem('quant_gemini_backoff');
      if (cooldown && Date.now() < parseInt(cooldown)) {
        const remainingMinutes = Math.ceil((parseInt(cooldown) - Date.now()) / 60000);
        throw new Error(`Neural engine is currently recalibrating due to high load. Please try again in about ${remainingMinutes} minutes.`);
      }

      const base64Data = await fileToBase64(selectedFile);

      const response = await fetch('/api/ai/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: selectedFile.type
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
      }

      const analysis = await response.json();
      
      // Success: Clear backoff
      localStorage.removeItem('quant_gemini_backoff');
      
      setResult(analysis);
    } catch (err: any) {
      console.error("AI Analysis Error:", err);
      
      if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
         localStorage.setItem('quant_gemini_backoff', (Date.now() + 300000).toString()); // 5 min cooldown for user action
         setError("Rate limit reached. The neural engine needs a 5-minute cooldown. Our free tier is currently under heavy communal load.");
      } else {
         setError(err.message || 'Something went wrong during analysis.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
          <Brain className="text-emerald-400" size={32} />
          AI Visual Pattern Recognition
        </h2>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
          Upload a stock chart image and let our neural engine identify complex technical patterns & projections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Upload */}
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "relative aspect-video rounded-3xl border-2 border-dashed transition-all cursor-pointer group flex flex-col items-center justify-center gap-4 overflow-hidden",
              previewUrl 
                ? "border-emerald-500/50 bg-emerald-500/5" 
                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/80"
            )}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-4" />
            ) : (
              <>
                <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <Upload className="text-emerald-400" size={32} />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">Click or Drag & Drop</p>
                  <p className="text-zinc-500 text-sm">PNG, JPG, WEBP (Max 5MB)</p>
                </div>
              </>
            )}
            
            {previewUrl && !isAnalyzing && (
              <button 
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 border border-white/10 text-white hover:bg-rose-500/80 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex gap-4">
            <button
              onClick={analyzeImage}
              disabled={!selectedFile || isAnalyzing}
              className={cn(
                "flex-1 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                !selectedFile || isAnalyzing
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95"
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing Pattern...
                </>
              ) : (
                <>
                  <Activity size={20} />
                  Scan for Alpha
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {!result && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full glass-card p-8 flex flex-col items-center justify-center text-center gap-6 border border-white/5"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                  <BarChart2 size={64} className="text-zinc-700 relative z-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-zinc-300 text-xl font-bold uppercase tracking-widest">Waiting for Scan</h3>
                  <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                    Upload a technical chart to see neural analysis of patterns like H&S, Flags, Triangles, and more.
                  </p>
                </div>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full glass-card p-8 border border-emerald-500/20 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                <div className="flex flex-col items-center justify-center h-full gap-8 relative z-10">
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="w-32 h-32 rounded-full border-t-2 border-r-2 border-emerald-500"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-2 rounded-full border-t-2 border-l-2 border-emerald-500/30"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain className="text-emerald-400 animate-pulse" size={40} />
                    </div>
                  </div>
                  <div className="text-center space-y-3">
                    <p className="text-white font-black text-xl uppercase tracking-tighter">Neural Engine Processing</p>
                    <div className="space-y-1">
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Deconstructing Pixels...</p>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Identifying Support/Resistance...</p>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Projecting Momentum...</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 border border-emerald-500/30 space-y-6"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Identified Pattern</p>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{result.pattern}</h3>
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border",
                    result.sentiment === 'Bullish' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    result.sentiment === 'Bearish' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                  )}>
                    {result.sentiment}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Confidence Score</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">{Math.round(result.confidence * 100)}%</span>
                      <span className="text-[10px] text-zinc-600 font-bold uppercase">Neural Match</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Alpha Signal</p>
                    <div className="flex items-center gap-2">
                       <TrendingUp className="text-emerald-400" size={20} />
                       <span className="text-sm font-black text-zinc-200 uppercase tracking-tighter">Strong Accumulation</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Technical Briefing</p>
                  <p className="text-zinc-300 text-sm leading-relaxed">{result.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Support Clusters</p>
                    <div className="flex flex-wrap gap-2">
                      {result.supportLevels.map((lvl, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                          {lvl}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Resistance Walls</p>
                    <div className="flex flex-wrap gap-2">
                      {result.resistanceLevels.map((lvl, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold">
                          {lvl}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Camera size={14} className="text-emerald-400" />
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Neural Projection</p>
                  </div>
                  <p className="text-zinc-300 text-sm font-medium italic">"{result.projection}"</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

