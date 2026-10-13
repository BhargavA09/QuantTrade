#!/usr/bin/env python3
"""
=============================================================================
QuantLab Python Quantitative Projection Engine
- Monte Carlo Simulation (Geometric Brownian Motion + Jump Diffusion)
- Fourier Transform (FFT) Spectral Decomposition & Cycle Filtering
- Fuzzy Logic Controller (Multi-rule inference with centroid defuzzification)
- Statistical Confidence Intervals, VaR, and CVaR calculations
=============================================================================
"""

import sys
import math
import random
import json
from typing import List, Dict, Any, Tuple, Optional


class FuzzyLogicController:
    """
    Mamdani-style Fuzzy Logic Controller for quantitative market regime adaptation.
    Evaluates momentum (RSI), volatility (ATR/Std), and trend strength to modulate drift.
    """

    @staticmethod
    def _triangular(x: float, a: float, b: float, c: float) -> float:
        """Triangular membership function."""
        if x <= a or x >= c:
            return 0.0
        elif a < x <= b:
            return (x - a) / (b - a + 1e-9)
        else:
            return (c - x) / (c - b + 1e-9)

    @staticmethod
    def _trapezoidal(x: float, a: float, b: float, c: float, d: float) -> float:
        """Trapezoidal membership function."""
        if x <= a or x >= d:
            return 0.0
        elif a < x <= b:
            return (x - a) / (b - a + 1e-9)
        elif b < x <= c:
            return 1.0
        else:
            return (d - x) / (d - c + 1e-9)

    def evaluate(self, rsi: float, volatility_pct: float, trend_slope: float) -> Dict[str, Any]:
        """
        Evaluate fuzzy rules and defuzzify via centroid method.
        Returns drift adjustment and market regime classification.
        """
        # 1. Fuzzification
        # Momentum (RSI 0-100)
        rsi_oversold = self._trapezoidal(rsi, 0, 0, 30, 45)
        rsi_neutral = self._triangular(rsi, 35, 50, 65)
        rsi_overbought = self._trapezoidal(rsi, 55, 70, 100, 100)

        # Volatility (annualized %: 5% - 80%)
        vol_low = self._trapezoidal(volatility_pct, 0, 0, 15, 25)
        vol_medium = self._triangular(volatility_pct, 18, 30, 45)
        vol_high = self._trapezoidal(volatility_pct, 35, 55, 150, 150)

        # Trend Slope (% per 20 days: -15% to +15%)
        trend_down = self._trapezoidal(trend_slope, -50, -50, -3, 0)
        trend_flat = self._triangular(trend_slope, -2, 0, 2)
        trend_up = self._trapezoidal(trend_slope, 0, 3, 50, 50)

        # 2. Rule Base Evaluation (Drift adjustment from -0.15 to +0.15)
        # We sample output space [-0.15, +0.15] at 31 discrete points
        sample_points = [ -0.15 + i * 0.01 for i in range(31) ]
        aggregated_membership = [0.0] * len(sample_points)

        rules = [
            # Strong bullish continuation: Uptrend + Low/Med Vol + Not Overbought
            (min(trend_up, max(vol_low, vol_medium), 1.0 - rsi_overbought), 0.08),
            # Mean reversion buy: Oversold + Flat Trend
            (min(rsi_oversold, trend_flat), 0.05),
            # Extreme momentum squeeze: Uptrend + Overbought + High Vol
            (min(trend_up, rsi_overbought, vol_high), 0.02),
            # Bearish continuation: Downtrend + High Vol
            (min(trend_down, vol_high), -0.09),
            # Exhaustion sell: Overbought + Downtrend slope
            (min(rsi_overbought, trend_down), -0.11),
            # Ranging regime: Neutral RSI + Low Vol
            (min(rsi_neutral, vol_low, trend_flat), 0.01),
        ]

        for strength, target_val in rules:
            if strength <= 0.0:
                continue
            for idx, pt in enumerate(sample_points):
                # Implication with triangular neighborhood around target_val
                point_mem = min(strength, max(0.0, 1.0 - abs(pt - target_val) / 0.05))
                aggregated_membership[idx] = max(aggregated_membership[idx], point_mem)

        # 3. Defuzzification (Centroid)
        num = sum(pt * mem for pt, mem in zip(sample_points, aggregated_membership))
        den = sum(aggregated_membership)
        drift_adjustment = (num / den) if den > 1e-6 else 0.0

        # Market Regime Label
        if trend_up > 0.5:
            regime = "Bullish Trend Expansion"
        elif trend_down > 0.5:
            regime = "Bearish Trend Contraction"
        elif vol_high > 0.6:
            regime = "High Volatility Regimes"
        elif rsi_oversold > 0.6:
            regime = "Oversold Mean Reversion"
        else:
            regime = "Equilibrium Consolidation"

        return {
            "drift_adjustment": round(drift_adjustment, 4),
            "regime": regime,
            "confidence_score": round(min(0.98, max(0.40, 0.50 + abs(drift_adjustment) * 3.5)), 2),
            "memberships": {
                "rsi_oversold": round(rsi_oversold, 2),
                "rsi_overbought": round(rsi_overbought, 2),
                "vol_high": round(vol_high, 2),
                "trend_up": round(trend_up, 2),
            }
        }


class FourierSignalFilter:
    """
    Discrete Fourier Transform (DFT) spectral filtering for extracting dominant harmonic cycles
    and suppressing noise in financial time series.
    """

    @staticmethod
    def extract_cycles(series: List[float], top_k: int = 3) -> Dict[str, Any]:
        """
        Compute DFT and reconstruct primary sinusoidal cycles.
        """
        n = len(series)
        if n < 8:
            return {"dominant_periods": [], "filtered_trend": series}

        # Demean series for spectral analysis
        mean_val = sum(series) / n
        detrended = [x - mean_val for x in series]

        # Discrete Fourier Transform
        frequencies = []
        for k in range(1, n // 2):
            real_part = sum(detrended[t] * math.cos(2 * math.pi * k * t / n) for t in range(n))
            imag_part = sum(-detrended[t] * math.sin(2 * math.pi * k * t / n) for t in range(n))
            power = (real_part ** 2 + imag_part ** 2) / n
            period = round(n / k, 1)
            frequencies.append({
                "k": k,
                "period": period,
                "power": power,
                "real": real_part,
                "imag": imag_part
            })

        # Sort by spectral power
        frequencies.sort(key=lambda x: x["power"], reverse=True)
        top_components = frequencies[:top_k]

        # Inverse reconstruction using top components
        reconstructed = []
        for t in range(n):
            val = mean_val
            for comp in top_components:
                k = comp["k"]
                angle = 2 * math.pi * k * t / n
                # Coefficient amplitude: 2/n
                val += (2.0 / n) * (comp["real"] * math.cos(angle) - comp["imag"] * math.sin(angle))
            reconstructed.append(round(val, 2))

        return {
            "dominant_periods": [c["period"] for c in top_components],
            "filtered_trend": reconstructed,
            "spectral_energy": round(sum(c["power"] for c in top_components), 2)
        }


class MonteCarloProjectionEngine:
    """
    High-performance quantitative Monte Carlo simulator combining:
    1. Geometric Brownian Motion (GBM) with Antithetic Variates
    2. Merton Jump Diffusion (Poisson jump arrivals)
    3. Fuzzy Logic drift modulation
    4. Fourier harmonic cycle projection
    """

    def __init__(self, seed: Optional[int] = None):
        if seed is not None:
            random.seed(seed)
        self.fuzzy = FuzzyLogicController()
        self.fourier = FourierSignalFilter()

    @staticmethod
    def _box_muller() -> Tuple[float, float]:
        """Box-Muller transform for standard normal random variables."""
        u1 = max(1e-12, random.random())
        u2 = random.random()
        r = math.sqrt(-2.0 * math.log(u1))
        theta = 2.0 * math.pi * u2
        return r * math.cos(theta), r * math.sin(theta)

    def run_simulation(
        self,
        current_price: float,
        annual_drift: float = 0.08,
        annual_volatility: float = 0.25,
        days_ahead: int = 30,
        num_simulations: int = 1000,
        rsi: float = 52.0,
        trend_slope: float = 1.5,
        jump_intensity: float = 0.05,  # Expected jumps per year
        jump_mean: float = -0.02,
        jump_std: float = 0.06
    ) -> Dict[str, Any]:
        """
        Execute full Monte Carlo simulation with dynamic confidence bands and risk analysis.
        """
        # Evaluate Fuzzy Logic adaptations
        fuzzy_eval = self.fuzzy.evaluate(rsi, annual_volatility * 100, trend_slope)
        effective_drift = annual_drift + fuzzy_eval["drift_adjustment"]

        # Time discretization (Trading days = 252)
        dt = 1.0 / 252.0
        drift_term = (effective_drift - 0.5 * (annual_volatility ** 2)) * dt
        vol_term = annual_volatility * math.sqrt(dt)

        all_paths: List[List[float]] = []

        # Half simulations for antithetic variates (pairs)
        num_pairs = max(1, num_simulations // 2)

        for _ in range(num_pairs):
            path_a = [current_price]
            path_b = [current_price]
            price_a = current_price
            price_b = current_price

            for day in range(days_ahead):
                z_a, z_b_box = self._box_muller()
                z_b = -z_a  # Antithetic variate

                # Jump diffusion check
                jump_a = 0.0
                jump_b = 0.0
                if random.random() < (jump_intensity * dt):
                    jz_a, _ = self._box_muller()
                    jump_a = jump_mean + jump_std * jz_a
                if random.random() < (jump_intensity * dt):
                    jz_b, _ = self._box_muller()
                    jump_b = jump_mean + jump_std * jz_b

                # Update prices
                price_a = price_a * math.exp(drift_term + vol_term * z_a + jump_a)
                price_b = price_b * math.exp(drift_term + vol_term * z_b + jump_b)

                path_a.append(price_a)
                path_b.append(price_b)

            all_paths.append(path_a)
            all_paths.append(path_b)

        # Statistical Aggregations by Day
        timeline_stats = []
        for day in range(days_ahead + 1):
            prices_at_day = sorted([path[day] for path in all_paths])
            n = len(prices_at_day)

            def get_percentile(p: float) -> float:
                idx = int(p * (n - 1))
                return prices_at_day[idx]

            timeline_stats.append({
                "day": day,
                "median": round(get_percentile(0.50), 2),
                "ci_80_lower": round(get_percentile(0.10), 2),
                "ci_80_upper": round(get_percentile(0.90), 2),
                "ci_95_lower": round(get_percentile(0.025), 2),
                "ci_95_upper": round(get_percentile(0.975), 2),
                "min": round(prices_at_day[0], 2),
                "max": round(prices_at_day[-1], 2),
            })

        # Terminal day metrics
        final_prices = sorted([path[-1] for path in all_paths])
        n_final = len(final_prices)
        final_median = final_prices[int(0.50 * (n_final - 1))]
        expected_return_pct = round(((final_median / current_price) - 1.0) * 100.0, 2)

        # Probability of profit (P(Price > current_price))
        profitable_count = sum(1 for p in final_prices if p > current_price)
        prob_profit = round((profitable_count / n_final) * 100.0, 1)

        # Value at Risk (VaR) & CVaR (95%)
        var_95_price = final_prices[int(0.05 * (n_final - 1))]
        var_95_pct = round(max(0.0, ((current_price - var_95_price) / current_price) * 100.0), 2)
        tail_prices = final_prices[:int(0.05 * (n_final - 1))]
        cvar_95_price = sum(tail_prices) / len(tail_prices) if tail_prices else var_95_price
        cvar_95_pct = round(max(0.0, ((current_price - cvar_95_price) / current_price) * 100.0), 2)

        # Representative visual paths (5 sample paths for charting)
        sample_indices = [0, n_final // 4, n_final // 2, 3 * n_final // 4, n_final - 1]
        sample_paths = [
            [round(val, 2) for val in all_paths[i]] for i in sample_indices
        ]

        return {
            "success": True,
            "engine": "Python-QuantLab-MonteCarlo-v3",
            "current_price": current_price,
            "days_ahead": days_ahead,
            "num_simulations": len(all_paths),
            "effective_drift": round(effective_drift, 4),
            "annual_volatility": round(annual_volatility, 4),
            "market_regime": fuzzy_eval["regime"],
            "fuzzy_drift_adjustment": fuzzy_eval["drift_adjustment"],
            "confidence_score": fuzzy_eval["confidence_score"],
            "projections": {
                "expected_price_median": round(final_median, 2),
                "expected_return_pct": expected_return_pct,
                "prob_profit_pct": prob_profit,
                "var_95_pct": var_95_pct,
                "cvar_95_pct": cvar_95_pct,
                "target_high_95": timeline_stats[-1]["ci_95_upper"],
                "target_low_95": timeline_stats[-1]["ci_95_lower"],
            },
            "timeline": timeline_stats,
            "sample_paths": sample_paths
        }


def main():
    """CLI Runner for testing or direct piping."""
    args = sys.argv[1:]
    price = float(args[0]) if len(args) > 0 else 225.50
    days = int(args[1]) if len(args) > 1 else 30
    sims = int(args[2]) if len(args) > 2 else 500

    engine = MonteCarloProjectionEngine(seed=42)
    res = engine.run_simulation(
        current_price=price,
        days_ahead=days,
        num_simulations=sims,
        annual_drift=0.10,
        annual_volatility=0.22,
        rsi=54.0,
        trend_slope=2.1
    )

    print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
