#!/usr/bin/env python3
"""
=============================================================================
QuantLab Python Quantitative Trading & Financial Intelligence Suite
Main CLI Runner & Unified System Orchestrator
=============================================================================

Usage:
  python main.py status                    # System status & environment check
  python main.py project AAPL --days 30    # Run Monte Carlo & Fuzzy Logic projections
  python main.py news                      # Scan global market news & impacted stocks
  python main.py news --daemon             # Continuous live scanning daemon
  python main.py supply-chain              # Retrieve global maritime Open API telemetry
  python main.py options SPY --strike 580  # Compute Black-Scholes Greeks & Option Chain
  python main.py backtest NVDA             # Execute quantitative algorithmic backtest
  python main.py server --port 8080        # Start standalone Python REST API server
=============================================================================
"""

import sys
import os
import json
import argparse
from datetime import datetime

# Local module imports
from projection_engine import MonteCarloProjectionEngine
from news_scanner import GlobalNewsScanner
from supply_chain import SupplyChainEngine
from options_pricing import BlackScholesEngine
from backtest_engine import BacktestEngine
from server import run_server


def cmd_status():
    """Print system status, Python version, and model readiness."""
    print("=" * 65)
    print("  QUANTLAB PYTHON QUANTITATIVE TRADING ENGINE")
    print("=" * 65)
    print(f"  Python Runtime:     {sys.version.split()[0]} ({sys.executable})")
    print(f"  Operating System:   {sys.platform}")
    print(f"  Gemini API Grounding: {'Configured (GEMINI_API_KEY detected)' if os.getenv('GEMINI_API_KEY') else 'Standard Heuristic Mode'}")
    print("\n  Active Engines:")
    print("   [x] Monte Carlo & Merton Jump Diffusion (Antithetic Variates)")
    print("   [x] Fuzzy Logic Controller (Regime & Drift Adaptation)")
    print("   [x] Fourier Transform (FFT) Spectral Filtering")
    print("   [x] Autonomous Global News Scanner (Real-time Catalyst Mapping)")
    print("   [x] Global Supply Chain & Maritime Open API (Chokepoints & Ports)")
    print("   [x] Black-Scholes Analytical Greeks & Implied Volatility")
    print("   [x] Event-Driven Strategy Backtester & Kelly Criterion")
    print("   [x] Multi-threaded Standalone REST API Server (Zero-Dependency)")
    print("=" * 65)


def cmd_project(args):
    """Run Monte Carlo simulation."""
    price = args.price if args.price is not None else 225.0
    engine = MonteCarloProjectionEngine(seed=args.seed)
    print(f"[*] Running {args.simulations} Monte Carlo paths for {args.ticker} over {args.days} trading days...")
    res = engine.run_simulation(
        current_price=price,
        days_ahead=args.days,
        num_simulations=args.simulations,
        annual_drift=args.drift,
        annual_volatility=args.volatility,
        rsi=args.rsi,
        trend_slope=args.trend
    )

    p = res["projections"]
    print("\n" + "=" * 50)
    print(f"  PROJECTION SUMMARY: {args.ticker.upper()} (Current: ${price:.2f})")
    print("=" * 50)
    print(f"  Market Regime:       {res['market_regime']}")
    print(f"  Fuzzy Drift Mod:     {res['fuzzy_drift_adjustment']:+.4f} (Conf: {res['confidence_score']*100:.0f}%)")
    print(f"  Expected Median:     ${p['expected_price_median']:.2f} ({p['expected_return_pct']:+.2f}%)")
    print(f"  Probability Profit:  {p['prob_profit_pct']:.1f}%")
    print(f"  95% Confidence Band: ${p['target_low_95']:.2f} to ${p['target_high_95']:.2f}")
    print(f"  Value at Risk (95%): -{p['var_95_pct']:.2f}% (CVaR: -{p['cvar_95_pct']:.2f}%)")
    print("=" * 50)


def cmd_news(args):
    """Scan global market news."""
    scanner = GlobalNewsScanner()
    if args.daemon:
        scanner.run_continuous_monitor(interval_seconds=args.interval, max_iterations=args.max_loops)
    else:
        events = scanner.scan_all()
        print(f"\n[+] Scanned {len(events)} real-time global news catalysts:")
        for ev in events:
            score = ev["sentiment_score"]
            bias = "BULLISH" if score > 0.2 else ("BEARISH" if score < -0.2 else "NEUTRAL")
            print(f"\n • [{ev['urgency']}] {ev['title']}")
            print(f"   Source: {ev['source']} ({ev['region']}) | Bias: {bias} ({score:+.2f})")
            print(f"   Impacted Equities: {', '.join(ev['impacted_tickers'])}")
            print(f"   Recommendation: {ev['suggested_action']}")


def cmd_supply_chain(args):
    """Retrieve maritime supply chain state or geocode location."""
    engine = SupplyChainEngine()
    if args.geocode:
        res = engine.geocode_location(args.geocode)
        print(json.dumps({"query": args.geocode, "result": res}, indent=2))
    else:
        state = engine.get_full_supply_chain_state()
        m = state["metrics"]
        print("=" * 60)
        print("  GLOBAL SUPPLY CHAIN & MARITIME TELEMETRY")
        print("=" * 60)
        print(f"  Global Fragility Index:   {m['globalFragilityIndex']}/100")
        print(f"  Baltic Dry Index:         {m['balticDryIndex']} ({m['balticDryChange']})")
        print(f"  Container Spot Rate FEU:  ${m['containerSpotRateFEU']} ({m['containerSpotRateChange']})")
        print(f"  Active Vessels Tracked:   {m['activeVesselsMonitored']}")
        print(f"  Monitored Chokepoints:    {m['trackedChokepoints']}")
        print("\n  Critical Chokepoint Status:")
        for cp in state["chokepoints"]:
            print(f"   • {cp['name']:<22} [{cp['status']:<10}] Congestion: {cp['congestionLevel']:>2}% | Delay: {cp['delayDays']}d")
        print("=" * 60)


def cmd_options(args):
    """Compute Black-Scholes Greeks and option chain."""
    engine = BlackScholesEngine()
    spot = args.spot or 230.0
    res = engine.calculate_greeks(
        spot=spot,
        strike=args.strike or spot,
        time_to_expiry_years=args.days / 365.0,
        volatility=args.volatility
    )
    print("=" * 55)
    print(f"  BLACK-SCHOLES OPTIONS VALUATION: {args.ticker.upper()}")
    print("=" * 55)
    print(f"  Spot: ${spot:.2f} | Strike: ${res['strike']:.2f} | Days to Expiry: {res['time_to_expiry_days']}")
    print(f"  Call Price: ${res['call_price']:.2f}  | Put Price: ${res['put_price']:.2f}")
    print(f"  Call Delta: {res['call_delta']:+.4f} | Put Delta: {res['put_delta']:+.4f}")
    print(f"  Gamma:      {res['gamma']:.5f}  | Vega:      {res['vega']:.4f}")
    print(f"  Theta Call: ${res['theta_call_per_day']:.4f}/day | Rho Call: {res['rho_call']:.4f}")
    print("=" * 55)


def cmd_backtest(args):
    """Run strategy backtest."""
    engine = BacktestEngine(initial_capital=args.capital)
    bars = engine.generate_synthetic_bars(
        ticker=args.ticker,
        num_bars=args.bars,
        start_price=args.start_price
    )
    res = engine.run_strategy(
        bars,
        strategy_type=args.strategy,
        fast_period=args.fast,
        slow_period=args.slow
    )
    m = res["metrics"]
    print("=" * 60)
    print(f"  QUANTITATIVE BACKTEST RESULTS: {args.ticker.upper()}")
    print("=" * 60)
    print(f"  Strategy Return:     {m['strategy_return_pct']:+.2f}%")
    print(f"  Benchmark Return:    {m['benchmark_return_pct']:+.2f}%")
    print(f"  Alpha (Excess):      {m['alpha_pct']:+.2f}%")
    print(f"  Sharpe Ratio:        {m['annualized_sharpe']:.2f}")
    print(f"  Sortino Ratio:       {m['sortino_ratio']:.2f}")
    print(f"  Max Drawdown:        -{m['max_drawdown_pct']:.2f}%")
    print(f"  Total Trades:        {m['total_trades']} (Win Rate: {m['win_rate_pct']}%)")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="QuantLab Python Quantitative Trading Suite")
    subparsers = parser.add_subparsers(dest="command")

    # status
    subparsers.add_parser("status", help="Check system status and active models")

    # project
    p_proj = subparsers.add_parser("project", help="Run Monte Carlo simulation")
    p_proj.add_argument("ticker", nargs="?", default="SPY", help="Ticker symbol")
    p_proj.add_argument("--price", type=float, default=225.0, help="Current asset price")
    p_proj.add_argument("--days", type=int, default=30, help="Days forward to simulate")
    p_proj.add_argument("--simulations", type=int, default=1000, help="Number of price paths")
    p_proj.add_argument("--drift", type=float, default=0.08, help="Annualized drift")
    p_proj.add_argument("--volatility", type=float, default=0.22, help="Annualized volatility")
    p_proj.add_argument("--rsi", type=float, default=54.0, help="Current 14-period RSI")
    p_proj.add_argument("--trend", type=float, default=1.8, help="Trend slope %")
    p_proj.add_argument("--seed", type=int, default=None, help="Random seed")

    # news
    p_news = subparsers.add_parser("news", help="Scan global financial news")
    p_news.add_argument("--daemon", action="store_true", help="Run continuous monitoring loop")
    p_news.add_argument("--interval", type=int, default=10, help="Scan interval in seconds")
    p_news.add_argument("--max-loops", type=int, default=3, help="Max iterations for daemon")

    # supply-chain
    p_sc = subparsers.add_parser("supply-chain", help="Supply chain and maritime Open API")
    p_sc.add_argument("--geocode", type=str, default=None, help="Geocode location name")

    # options
    p_opt = subparsers.add_parser("options", help="Black-Scholes options pricing")
    p_opt.add_argument("ticker", nargs="?", default="SPY", help="Ticker symbol")
    p_opt.add_argument("--spot", type=float, default=230.0, help="Spot price")
    p_opt.add_argument("--strike", type=float, default=230.0, help="Strike price")
    p_opt.add_argument("--days", type=int, default=30, help="Days to expiration")
    p_opt.add_argument("--volatility", type=float, default=0.25, help="Annualized IV")

    # backtest
    p_bt = subparsers.add_parser("backtest", help="Run algorithmic backtest")
    p_bt.add_argument("ticker", nargs="?", default="SPY", help="Ticker symbol")
    p_bt.add_argument("--strategy", type=str, default="momentum_crossover", help="Strategy name")
    p_bt.add_argument("--capital", type=float, default=100000.0, help="Starting portfolio capital")
    p_bt.add_argument("--bars", type=int, default=252, help="Historical bars count")
    p_bt.add_argument("--start-price", type=float, default=220.0, help="Starting price")
    p_bt.add_argument("--fast", type=int, default=12, help="Fast moving average period")
    p_bt.add_argument("--slow", type=int, default=26, help="Slow moving average period")

    # server
    p_srv = subparsers.add_parser("server", help="Start standalone Python REST API server")
    p_srv.add_argument("--port", type=int, default=8080, help="Port to listen on")

    args = parser.parse_args()

    if args.command == "status":
        cmd_status()
    elif args.command == "project":
        cmd_project(args)
    elif args.command == "news":
        cmd_news(args)
    elif args.command == "supply-chain":
        cmd_supply_chain(args)
    elif args.command == "options":
        cmd_options(args)
    elif args.command == "backtest":
        cmd_backtest(args)
    elif args.command == "server":
        run_server(args.port)
    else:
        # Default behavior: print status and help
        cmd_status()
        print("\nRun 'python main.py --help' to see all available commands.")


if __name__ == "__main__":
    main()
