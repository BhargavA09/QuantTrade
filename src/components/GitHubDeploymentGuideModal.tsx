import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Copy, 
  Check, 
  Github, 
  Globe, 
  ExternalLink, 
  Terminal, 
  Server, 
  CheckCircle2, 
  Share2, 
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { cn } from '../utils/cn';

interface GitHubDeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GitHubDeploymentGuideModal({
  isOpen,
  onClose
}: GitHubDeploymentGuideModalProps) {
  const [copiedStep1, setCopiedStep1] = useState(false);
  const [copiedClone, setCopiedClone] = useState(false);
  const [copiedDocker, setCopiedDocker] = useState(false);
  const [activeTab, setActiveTab] = useState<'vercel' | 'github_push' | 'local_clone' | 'docker'>('vercel');

  if (!isOpen) return null;

  const gitPushScript = `# 1. Initialize git in this project directory (if not already initialized)
git init
git add .
git commit -m "feat: complete quant trading strategy & backtest lab"

# 2. Rename branch to main
git branch -M main

# 3. Add your remote GitHub repository (replace with your username/repo)
git remote add origin https://github.com/YOUR_USERNAME/quantlab-terminal.git

# 4. Push all code to GitHub
git push -u origin main`;

  const cloneScript = `# Anyone can run your project in 3 simple commands:
git clone https://github.com/YOUR_USERNAME/quantlab-terminal.git
cd quantlab-terminal
npm install
npm run dev
# App will be running at http://localhost:3000`;

  const dockerScript = `# Build Docker image
docker build -t quantlab-terminal .

# Run container on port 3000
docker run -p 3000:3000 quantlab-terminal`;

  const handleCopy = (text: string, setFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
        >
          {/* Top Header */}
          <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-zinc-800 text-white border border-zinc-700">
                <Github size={20} />
              </span>
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                  Share & Run Link via GitHub
                </h3>
                <p className="text-xs text-zinc-400">
                  How to link to GitHub and deploy so anyone can access and run the terminal online with zero setup.
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

          {/* Sub Navigation */}
          <div className="px-6 py-3 border-b border-zinc-800/60 bg-zinc-900/10 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('vercel')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'vercel'
                  ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              )}
            >
              <Globe size={13} />
              1-Click Web Link (Vercel / Render)
            </button>
            <button
              onClick={() => setActiveTab('github_push')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'github_push'
                  ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              )}
            >
              <Github size={13} />
              Push to GitHub
            </button>
            <button
              onClick={() => setActiveTab('local_clone')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'local_clone'
                  ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              )}
            >
              <Terminal size={13} />
              Local Run (git clone)
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {activeTab === 'vercel' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed flex items-start gap-3">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <strong className="text-white block font-bold mb-0.5">Fastest Way to Share a Public Link</strong>
                    Deploying your GitHub repository to <strong>Vercel</strong> or <strong>Render</strong> takes under 60 seconds and produces a permanent, free public URL (e.g. <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">https://quantlab.vercel.app</code>) that anyone in the world can run in any browser without installing anything!
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                    Step-by-Step Instructions:
                  </h4>
                  
                  <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3 text-xs text-zinc-300">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0">1</span>
                      <div>
                        <strong>Push this project to your GitHub account</strong> (see the "Push to GitHub" tab for the 4 terminal commands).
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0">2</span>
                      <div>
                        Go to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">Vercel.com</a> (or <a href="https://render.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">Render.com</a>) and sign in with your GitHub account.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0">3</span>
                      <div>
                        Click <strong>"Add New..."</strong> → <strong>"Project"</strong>. Choose your GitHub repository (<code className="text-white">quantlab-terminal</code>).
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0">4</span>
                      <div>
                        Keep default framework settings (Vite / Node.js) and click <strong>"Deploy"</strong>.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0">5</span>
                      <div>
                        🎉 <strong>Done!</strong> Vercel gives you an instant shareable HTTPS link you can paste to colleagues or clients.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'github_push' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                    Terminal Commands to Push to GitHub:
                  </h4>
                  <button
                    onClick={() => handleCopy(gitPushScript, setCopiedStep1)}
                    className="text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
                  >
                    {copiedStep1 ? <Check size={12} /> : <Copy size={12} />}
                    {copiedStep1 ? "Copied All" : "Copy Commands"}
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed select-text shadow-inner">
                  <code>{gitPushScript}</code>
                </pre>
              </div>
            )}

            {activeTab === 'local_clone' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                    How Anyone Can Clone & Run Locally:
                  </h4>
                  <button
                    onClick={() => handleCopy(cloneScript, setCopiedClone)}
                    className="text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
                  >
                    {copiedClone ? <Check size={12} /> : <Copy size={12} />}
                    {copiedClone ? "Copied" : "Copy Clone Command"}
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed select-text shadow-inner">
                  <code>{cloneScript}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Close Guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
