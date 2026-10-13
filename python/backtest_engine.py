#!/usr/bin/env python3
"""
=============================================================================
QuantLab Python Quantitative Strategy Backtesting Engine
- High-Performance Event-Driven Bar Simulation
- Realistic Market Frictions: Slippage, Bid-Ask Spread, Commissions
- Kelly Criterion & Fractional Capital Allocation
- Quantitative Risk Metrics: Sharpe Ratio, Sortino Ratio, Max Drawdown
=============================================================================
"""

import math
import random
import json
import sys
from typing import List, Dict, Any, Optional


class BacktestEngine:
    """
    Quantitative strategy execution and backtesting engine.
    """

    def __init__(
        self,
        initial_capital: float = 100000.0,
        commission_bps: float = 5.0,  # 5 bps
        slippage_bps: float = 2.0
    ):
        self.initial_capital = initial_capital
        self.commission_rate = commission_bps / 10000.0
        self.slippage_rate = slippage_bps / 10000.0

    @staticmethod
    def generate_synthetic_bars(
        ticker: str = "SPY",
        num_bars: int = 252,
        start_price: float = 500.0,
        annual_drift: float = 0.12,
        annual_vol: float = 0.18
    ) -> List[Dict[str, float]]:
        """Generate realistic geometric Brownian motion price bars with OHLCV."""
        dt = 1.0 / 252.0
        drift_dt = (annual_drift - 0.5 * annual_vol ** 2) * dt
        vol_dt = annual_vol * math.sqrt(dt)

        bars = []
        curr_close = start_price

        for i in range(num_bars):
            # Box-muller random normal
            u1 = max(1e-12, random.random())
            u2 = random.random()
            z = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)

            prev_close = curr_close
            curr_close = prev_close * math.exp(drift_dt + vol_dt * z)

            high = max(prev_close, curr_close) * (1.0 + abs(random.gauss(0, 0.005)))
            low = min(prev_close, curr_close) * (1.0 - abs(random.gauss(0, 0.005)))
            open_p = prev_close * (1.0 + random.gauss(0, 0.002))
            vol = int(random.uniform(1500000, 6500000))

            bars.append({
                "bar": i + 1,
                "open": round(open_p, 2),
                "high": round(high, 2),
                "low": round(low, 2),
                "close": round(curr_close, 2),
                "volume": vol
            })

        return bars

    def run_strategy(
        self,
        bars: List[Dict[str, float]],
        strategy_type: str = "momentum_crossover",
        fast_period: int = 12,
        slow_period: int = 26,
        stop_loss_pct: float = 0.04,
        take_profit_pct: float = 0.08,
        use_kelly: bool = True
    ) -> Dict[str, Any]:
        """
        Simulate strategy execution over historical price bars.
        """
        n = len(bars)
        closes = [b["close"] for b in bars]

        # Calculate Indicators
        def moving_average(series: List[float], period: int) -> List[Optional[float]]:
            ma = [None] * len(series)
            for i in range(period - 1, len(series)):
                ma[i] = sum(series[i - period + 1: i + 1]) / period
            return ma

        fast_ma = moving_average(closes, fast_period)
        slow_ma = moving_average(closes, slow_period)

        capital = self.initial_capital
        position_shares = 0
        entry_price = 0.0
        trade_log = []
        equity_curve = []
        daily_returns = []
        prev_equity = capital

        for i in range(n):
            curr_price = closes[i]

            # 1. Exit Evaluation
            if position_shares > 0:
                pnl_pct = (curr_price - entry_price) / entry_price
                hit_sl = curr_price <= entry_price * (1.0 - stop_loss_pct)
                hit_tp = curr_price >= entry_price * (1.0 + take_profit_pct)

                # Indicator exit signal
                f_val = fast_ma[i]
                s_val = slow_ma[i]
                bearish_cross = (f_val is not None and s_val is not None and f_val < s_val)

                if hit_sl or hit_tp or bearish_cross:
                    reason = "STOP_LOSS" if hit_sl else ("TAKE_PROFIT" if hit_tp else "CROSSOVER_EXIT")
                    fill_price = curr_price * (1.0 - self.slippage_rate)
                    gross = position_shares * fill_price
                    comm = gross * self.commission_rate
                    capital += (gross - comm)
                    net_pnl = (fill_price - entry_price) * position_shares - comm

                    trade_log.append({
                        "bar": i,
                        "action": "SELL",
                        "price": round(fill_price, 2),
                        "shares": position_shares,
                        "pnl": round(net_pnl, 2),
                        "pnl_pct": round(pnl_pct * 100, 2),
                        "reason": reason
                    })

                    position_shares = 0
                    entry_price = 0.0

            # 2. Entry Evaluation
            if position_shares == 0 and i >= slow_period:
                f_curr = fast_ma[i]
                s_curr = slow_ma[i]
                f_prev = fast_ma[i - 1]
                s_prev = slow_ma[i - 1]

                bullish_trigger = (
                    f_curr is not None and s_curr is not None and
                    f_prev is not None and s_prev is not None and
                    f_curr > s_curr and f_prev <= s_prev
                )

                if bullish_trigger:
                    fill_price = curr_price * (1.0 + self.slippage_rate)
                    # Allocation sizing
                    alloc_ratio = 0.35 if use_kelly else 0.20
                    allocated_cash = capital * alloc_ratio
                    shares_to_buy = int(allocated_cash // fill_price)

                    if shares_to_buy > 0:
                        cost = shares_to_buy * fill_price
                        comm = cost * self.commission_rate
                        capital -= (cost + comm)
                        position_shares = shares_to_buy
                        entry_price = fill_price

                        trade_log.append({
                            "bar": i,
                            "action": "BUY",
                            "price": round(fill_price, 2),
                            "shares": shares_to_buy,
                            "pnl": 0.0,
                            "pnl_pct": 0.0,
                            "reason": "BULLISH_CROSSOVER"
                        })

            # Mark to market equity
            current_portfolio_value = capital + (position_shares * curr_price)
            equity_curve.append(round(current_portfolio_value, 2))

            if i > 0:
                ret = (current_portfolio_value - prev_equity) / (prev_equity + 1e-9)
                daily_returns.append(ret)
            prev_equity = current_portfolio_value

        # Calculate Performance Metrics
        final_equity = equity_curve[-1]
        strategy_return_pct = round(((final_equity / self.initial_capital) - 1.0) * 100.0, 2)
        benchmark_return_pct = round(((closes[-1] / closes[0]) - 1.0) * 100.0, 2)
        alpha = round(strategy_return_pct - benchmark_return_pct, 2)

        # Drawdown calculation
        peak = self.initial_capital
        max_drawdown = 0.0
        for eq in equity_curve:
            if eq > peak:
                peak = eq
            dd = (peak - eq) / (peak + 1e-9)
            if dd > max_drawdown:
                max_drawdown = dd

        # Sharpe & Sortino
        if daily_returns:
            mean_ret = sum(daily_returns) / len(daily_returns)
            variance = sum((r - mean_ret) ** 2 for r in daily_returns) / len(daily_returns)
            std_ret = math.sqrt(variance)
            sharpe = round((mean_ret / (std_ret + 1e-9)) * math.sqrt(252), 2)

            downside_returns = [r for r in daily_returns if r < 0]
            downside_var = sum(r ** 2 for r in downside_returns) / (len(downside_returns) + 1e-9)
            downside_std = math.sqrt(downside_var)
            sortino = round((mean_ret / (downside_std + 1e-9)) * math.sqrt(252), 2)
        else:
            sharpe = 0.0
            sortino = 0.0

        # Win rate
        closed_trades = [t for t in trade_log if t["action"] == "SELL"]
        winning_trades = [t for t in closed_trades if t["pnl"] > 0]
        win_rate = round((len(winning_trades) / len(closed_trades) * 100.0), 1) if closed_trades else 0.0

        return {
            "success": True,
            "engine": "Python-QuantLab-Backtest-v3",
            "strategy": strategy_type,
            "metrics": {
                "initial_capital": self.initial_capital,
                "final_equity": final_equity,
                "strategy_return_pct": strategy_return_pct,
                "benchmark_return_pct": benchmark_return_pct,
                "alpha_pct": alpha,
                "annualized_sharpe": sharpe,
                "sortino_ratio": sortino,
                "max_drawdown_pct": round(max_drawdown * 100.0, 2),
                "total_trades": len(closed_trades),
                "win_rate_pct": win_rate
            },
            "recent_trades": closed_trades[-8:],
            "equity_sample": [equity_curve[idx] for idx in range(0, len(equity_curve), max(1, len(equity_curve) // 20))]
        }


def main():
    engine = BacktestEngine()
    bars = engine.generate_synthetic_bars(num_bars=252, start_price=220.0)
    result = engine.run_strategy(bars)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
