import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full glass-card p-8 text-center space-y-6 border-rose-500/20">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="text-rose-500" size={40} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">System Interruption</h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                The application encountered an unexpected error. This might be due to a temporary connection issue or a data processing fault.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-black/40 rounded-xl border border-zinc-800 text-left overflow-hidden">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Error Details</p>
                <p className="text-xs font-mono text-rose-400/80 break-all leading-tight">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-sm font-bold text-zinc-100 transition-all active:scale-95"
              >
                <RefreshCcw size={16} />
                Reload
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-bold text-zinc-950 transition-all active:scale-95"
              >
                <Home size={16} />
                Home
              </button>
            </div>

            <p className="text-[10px] text-zinc-600 uppercase tracking-tighter">
              If the problem persists, please check your network connection or try again later.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
