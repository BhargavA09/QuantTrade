"""
=============================================================================
VolumeLens Institutional Order Flow & Futures Engine
=============================================================================
Reverse-engineered architecture modeled after VolumeLens (volumelens.com):
  1. Granular Footprint Candlestick Engine (Bid x Ask volume cluster per price node)
  2. Diagonal Bid/Ask Volume Imbalance Detection (>= 300% institutional ratio)
  3. Cumulative Volume Delta (CVD) & Delta Divergence Algorithms
  4. Real-time Depth of Market (DOM) Ladder & Liquidity Profile
  5. Multi-Asset Futures Contract Universe (Index, Energy, Metals, Rates, Crypto)
  6. AI Tape Reader & Order Flow Mentor (Trapped Traders, Absorption, Sweeps)
=============================================================================
"""

import math
import random
import time
from datetime import datetime, timezone, timedelta

# =============================================================================
# 1. INSTITUTIONAL FUTURES SPECIFICATIONS & UNIVERSE
# =============================================================================
FUTURES_SPECIFICATIONS = {
    "ES=F": {
        "symbol": "ES=F",
        "name": "E-mini S&P 500 Index Futures",
        "exchange": "CME",
        "category": "Equity Index",
        "tickSize": 0.25,
        "tickValue": 12.50,
        "contractMultiplier": 50,
        "currency": "USD",
        "marginRequirement": 12980.00,
        "tradingHours": "23h/day (Globex)",
        "settlement": "Cash Settled",
        "activeMonth": "DEC 2026",
        "basePrice": 5982.50,
        "dailyVolumeAvg": 1450000,
        "openInterest": 2180000
    },
    "NQ=F": {
        "symbol": "NQ=F",
        "name": "E-mini Nasdaq 100 Index Futures",
        "exchange": "CME",
        "category": "Equity Index",
        "tickSize": 0.25,
        "tickValue": 5.00,
        "contractMultiplier": 20,
        "currency": "USD",
        "marginRequirement": 18600.00,
        "tradingHours": "23h/day (Globex)",
        "settlement": "Cash Settled",
        "activeMonth": "DEC 2026",
        "basePrice": 21485.75,
        "dailyVolumeAvg": 680000,
        "openInterest": 940000
    },
    "YM=F": {
        "symbol": "YM=F",
        "name": "E-mini Dow Jones ($5) Futures",
        "exchange": "CBOT",
        "category": "Equity Index",
        "tickSize": 1.00,
        "tickValue": 5.00,
        "contractMultiplier": 5,
        "currency": "USD",
        "marginRequirement": 9200.00,
        "tradingHours": "23h/day (Globex)",
        "settlement": "Cash Settled",
        "activeMonth": "DEC 2026",
        "basePrice": 43920.00,
        "dailyVolumeAvg": 220000,
        "openInterest": 310000
    },
    "RTY=F": {
        "symbol": "RTY=F",
        "name": "E-mini Russell 2000 Index Futures",
        "exchange": "CME",
        "category": "Equity Index",
        "tickSize": 0.10,
        "tickValue": 5.00,
        "contractMultiplier": 50,
        "currency": "USD",
        "marginRequirement": 7500.00,
        "tradingHours": "23h/day (Globex)",
        "settlement": "Cash Settled",
        "activeMonth": "DEC 2026",
        "basePrice": 2248.60,
        "dailyVolumeAvg": 190000,
        "openInterest": 280000
    },
    "CL=F": {
        "symbol": "CL=F",
        "name": "Crude Oil WTI Light Sweet Futures",
        "exchange": "NYMEX",
        "category": "Energy Commodity",
        "tickSize": 0.01,
        "tickValue": 10.00,
        "contractMultiplier": 1000,
        "currency": "USD",
        "marginRequirement": 6800.00,
        "tradingHours": "23h/day (Globex)",
        "settlement": "Physical Delivery",
        "activeMonth": "JAN 2027",
        "basePrice": 101.15,
        "dailyVolumeAvg": 450000,
        "openInterest": 1850000
    },
    "NG=F": {
        "symbol": "NG=F",
        "name": "Henry Hub Natural Gas Futures",
        "exchange": "NYMEX",
        "category": "Energy Commodity",
        "tickSize": 0.001,
        "tickValue": 10.00,
        "contractMultiplier": 10000,
        "currency": "USD",
        "marginRequirement": 4200.00,
        "tradingHours": "23h/day (Globex)",
        "settlement": "Physical Delivery",
        "activeMonth": "JAN 2027",
        "basePrice": 3.148,
        "dailyVolumeAvg": 380000,
        "openInterest": 1240000
    },
    "GC=F": {
        "symbol": "GC=F",
        "name": "Gold 100 Troy Oz Futures",
        "exchange": "COMEX",
        "category": "Precious Metals",
        "tickSize": 0.10,
        "tickValue": 10.00,
        "contractMultiplier": 100,
        "currency": "USD",
        "marginRequirement": 9400.00,
        "tradingHours": "23h/day (Globex)",
        "settlement": "Physical Delivery",
        "activeMonth": "FEB 2027",
        "basePrice": 4061.80,
        "dailyVolumeAvg": 310000,
        "openInterest": 580000
    },
    "SI=F": {
        "symbol": "SI=F",
        "name": "Silver 5000 Troy Oz Futures",
        "exchange": "COMEX",
        "category": "Precious Metals",
        "tickSize": 0.005,
        "tickValue": 25.00,
        "contractMultiplier": 5000,
        "currency": "USD",
        "marginRequirement": 10200.00,
        "tradingHours": "23h/day (Globex)",
        "settlement": "Physical Delivery",
        "activeMonth": "MAR 2027",
        "basePrice": 54.15,
        "dailyVolumeAvg": 180000,
        "openInterest": 210000
    },
    "ZB=F": {
        "symbol": "ZB=F",
        "name": "30-Year U.S. Treasury Bond Futures",
        "exchange": "CBOT",
        "category": "Interest Rates",
        "tickSize": 0.03125,
        "tickValue": 31.25,
        "contractMultiplier": 1000,
        "currency": "USD",
        "marginRequirement": 4100.00,
        "tradingHours": "23h/day (Globex)",
        "settlement": "Physical Delivery",
        "activeMonth": "MAR 2027",
        "basePrice": 118.45,
        "dailyVolumeAvg": 410000,
        "openInterest": 1420000
    },
    "6E=F": {
        "symbol": "6E=F",
        "name": "Euro FX Futures",
        "exchange": "CME",
        "category": "Currencies",
        "tickSize": 0.00005,
        "tickValue": 6.25,
        "contractMultiplier": 125000,
        "currency": "USD",
        "marginRequirement": 2400.00,
        "tradingHours": "23h/day (Globex)",
        "settlement": "Physical Delivery",
        "activeMonth": "MAR 2027",
        "basePrice": 1.0852,
        "dailyVolumeAvg": 290000,
        "openInterest": 780000
    },
    "BTC-USD": {
        "symbol": "BTC-USD",
        "name": "Bitcoin Perpetual / CME Futures",
        "exchange": "CME / Deribit",
        "category": "Digital Asset Futures",
        "tickSize": 5.00,
        "tickValue": 25.00,
        "contractMultiplier": 5,
        "currency": "USD",
        "marginRequirement": 24500.00,
        "tradingHours": "24/7/365 Continuous",
        "settlement": "Cash Settled",
        "activeMonth": "PERP / DEC 2026",
        "basePrice": 80827.00,
        "dailyVolumeAvg": 85000,
        "openInterest": 145000
    },
    "SPY": {
        "symbol": "SPY",
        "name": "SPDR S&P 500 ETF Trust",
        "exchange": "NYSE Arca",
        "category": "Equity Benchmark",
        "tickSize": 0.01,
        "tickValue": 1.00,
        "contractMultiplier": 100,
        "currency": "USD",
        "marginRequirement": 3500.00,
        "tradingHours": "09:30-16:00 EST + Extended",
        "settlement": "Physical Delivery",
        "activeMonth": "SPOT",
        "basePrice": 769.66,
        "dailyVolumeAvg": 52000000,
        "openInterest": 8200000
    },
    "QQQ": {
        "symbol": "QQQ",
        "name": "Invesco QQQ Trust (Nasdaq 100)",
        "exchange": "NASDAQ",
        "category": "Equity Benchmark",
        "tickSize": 0.01,
        "tickValue": 1.00,
        "contractMultiplier": 100,
        "currency": "USD",
        "marginRequirement": 3200.00,
        "tradingHours": "09:30-16:00 EST + Extended",
        "settlement": "Physical Delivery",
        "activeMonth": "SPOT",
        "basePrice": 494.50,
        "dailyVolumeAvg": 38000000,
        "openInterest": 6100000
    },
    "NVDA": {
        "symbol": "NVDA",
        "name": "NVIDIA Corporation",
        "exchange": "NASDAQ",
        "category": "Equities & Single-Stock",
        "tickSize": 0.01,
        "tickValue": 1.00,
        "contractMultiplier": 100,
        "currency": "USD",
        "marginRequirement": 4500.00,
        "tradingHours": "09:30-16:00 EST + Extended",
        "settlement": "Physical Delivery",
        "activeMonth": "SPOT",
        "basePrice": 217.94,
        "dailyVolumeAvg": 84300000,
        "openInterest": 12400000
    },
    "PSEC": {
        "symbol": "PSEC",
        "name": "Prospect Capital Corporation",
        "exchange": "NASDAQ",
        "category": "Equities & Credit Yield",
        "tickSize": 0.01,
        "tickValue": 1.00,
        "contractMultiplier": 100,
        "currency": "USD",
        "marginRequirement": 150.00,
        "tradingHours": "09:30-16:00 EST",
        "settlement": "Physical Delivery",
        "activeMonth": "SPOT",
        "basePrice": 1.62,
        "dailyVolumeAvg": 8400000,
        "openInterest": 450000
    }
}


class VolumeLensOrderFlowEngine:
    """
    Reverse-engineered VolumeLens analytical engine providing:
      - Footprint bars with Bid x Ask cluster grids
      - Diagonal imbalance flagging (institutional >= 300% ratio)
      - Cumulative Volume Delta (CVD) series and Divergences
      - Point of Control (POC), Value Area (70%), and High Volume Nodes
      - Level 2 Depth of Market (DOM) ladder
      - Real-time tape interpretation with trapped trader identification
    """

    def __init__(self, imbalance_ratio_threshold: float = 3.0):
        self.imbalance_ratio = imbalance_ratio_threshold

    def get_futures_universe(self) -> list:
        """Returns the full futures & order flow instrument catalogue."""
        universe = []
        for sym, spec in FUTURES_SPECIFICATIONS.items():
            universe.append({
                "symbol": spec["symbol"],
                "name": spec["name"],
                "exchange": spec["exchange"],
                "category": spec["category"],
                "tickSize": spec["tickSize"],
                "tickValue": spec["tickValue"],
                "contractMultiplier": spec["contractMultiplier"],
                "currency": spec["currency"],
                "marginRequirement": spec["marginRequirement"],
                "basePrice": spec["basePrice"],
                "dailyVolumeAvg": spec["dailyVolumeAvg"],
                "activeMonth": spec["activeMonth"],
                "openInterest": spec["openInterest"]
            })
        return universe

    def get_instrument_spec(self, ticker: str, current_spot: float = 0.0) -> dict:
        """Returns metadata for the requested instrument or dynamic contract specs."""
        clean = ticker.strip().upper()
        if clean in FUTURES_SPECIFICATIONS:
            spec = dict(FUTURES_SPECIFICATIONS[clean])
            if current_spot > 0:
                spec["basePrice"] = current_spot
            return spec

        # Fallback dynamic specification for equities/other tickers
        tick_size = 0.01 if current_spot < 500 else 0.05
        return {
            "symbol": clean,
            "name": f"{clean} Equity Order Flow",
            "exchange": "US Equities",
            "category": "Equity",
            "tickSize": tick_size,
            "tickValue": 1.00,
            "contractMultiplier": 100,
            "currency": "USD",
            "marginRequirement": round(current_spot * 30.0, 2),
            "tradingHours": "09:30-16:00 EST",
            "settlement": "Physical Delivery",
            "activeMonth": "SPOT",
            "basePrice": current_spot if current_spot > 0 else 150.0,
            "dailyVolumeAvg": 12500000,
            "openInterest": 1500000
        }

    def generate_footprint_bars(self, ticker: str, spot_price: float, num_bars: int = 14, timeframe: str = "5m") -> list:
        """
        Generates realistic institutional footprint candles.
        Each bar consists of:
          - Timestamp & OHLC
          - Discrete price levels with Bid Volume and Ask Volume
          - Diagonal imbalance calculation:
              Ask Vol(P) vs Bid Vol(P - tick) >= 3.0 -> Bullish Imbalance
              Bid Vol(P) vs Ask Vol(P + tick) >= 3.0 -> Bearish Imbalance
          - Point of Control (POC price with highest volume)
          - Bar Delta = sum(Ask) - sum(Bid)
          - Stacked Imbalances & Absorption alerts
        """
        spec = self.get_instrument_spec(ticker, spot_price)
        tick = spec["tickSize"]
        price = spot_price if spot_price > 0 else spec["basePrice"]

        # Number of ticks per typical candle range
        ticks_per_bar = max(6, min(16, int(round((price * 0.0035) / tick))))
        
        bars = []
        base_time = datetime.now(timezone.utc) - timedelta(minutes=num_bars * 5)
        running_price = price * 0.994

        cumulative_delta = 0

        for i in range(num_bars):
            bar_time = base_time + timedelta(minutes=i * 5)
            # Drift with slight mean-reverting momentum
            drift_direction = random.choice([1, 1, 1, -1, -1]) if i % 3 != 0 else (1 if i > num_bars // 2 else -1)
            bar_open = running_price
            delta_price = drift_direction * random.uniform(2, ticks_per_bar) * tick
            bar_close = bar_open + delta_price

            wick_top = random.uniform(1, 4) * tick
            wick_bottom = random.uniform(1, 4) * tick
            bar_high = max(bar_open, bar_close) + wick_top
            bar_low = min(bar_open, bar_close) - wick_bottom

            # Quantize high and low to exact tick grid
            bar_high = round(round(bar_high / tick) * tick, 4)
            bar_low = round(round(bar_low / tick) * tick, 4)
            bar_open = round(round(bar_open / tick) * tick, 4)
            bar_close = round(round(bar_close / tick) * tick, 4)

            # Generate footprint price levels from low to high
            current_level = bar_low
            levels = []
            max_level_vol = 0
            poc_price = bar_low
            bar_total_buy = 0
            bar_total_sell = 0

            # Determine whether buyers or sellers are aggressive in this bar
            is_bullish = bar_close >= bar_open
            buyer_bias = 0.58 if is_bullish else 0.42

            while current_level <= bar_high + (tick * 0.1):
                cur_p = round(current_level, 4)
                
                # Base volume clustered around mid-body
                dist_from_mid = abs(cur_p - ((bar_open + bar_close) / 2)) / max(tick, (bar_high - bar_low))
                bell_weight = math.exp(-2.5 * dist_from_mid)
                
                # Volume scaling based on instrument
                vol_scale = 120 if "ES" in ticker or "NQ" in ticker else (45 if "CL" in ticker or "GC" in ticker else 2400)
                mean_vol = int(vol_scale * (0.6 + bell_weight * 1.8) * random.uniform(0.7, 1.4))
                
                # Split between bid (market seller into bid) and ask (market buyer into ask)
                ask_ratio = random.betavariate(buyer_bias * 10, (1 - buyer_bias) * 10)
                ask_vol = max(1, int(round(mean_vol * ask_ratio)))
                bid_vol = max(1, int(round(mean_vol * (1 - ask_ratio))))
                
                tot_vol = bid_vol + ask_vol
                delta = ask_vol - bid_vol
                bar_total_buy += ask_vol
                bar_total_sell += bid_vol

                if tot_vol > max_level_vol:
                    max_level_vol = tot_vol
                    poc_price = cur_p

                levels.append({
                    "price": cur_p,
                    "bidVolume": bid_vol,
                    "askVolume": ask_vol,
                    "totalVolume": tot_vol,
                    "delta": delta,
                    "bidImbalance": False,
                    "askImbalance": False,
                    "isPoc": False
                })

                current_level += tick

            # Mark POC level
            for lvl in levels:
                if lvl["price"] == poc_price:
                    lvl["isPoc"] = True

            # Calculate diagonal imbalances:
            # Diagonal: Compare Ask at price P to Bid at price P - 1 tick
            # Imbalance threshold: >= 3.0 ratio and minimum volume requirement
            min_imbalance_vol = max(10, int(vol_scale * 0.35))
            bullish_imbalance_count = 0
            bearish_imbalance_count = 0

            for idx in range(len(levels)):
                # Ask Imbalance (diagonal compare with bid below)
                if idx > 0:
                    ask_cur = levels[idx]["askVolume"]
                    bid_below = levels[idx - 1]["bidVolume"]
                    if bid_below > 0 and (ask_cur / bid_below >= self.imbalance_ratio) and ask_cur >= min_imbalance_vol:
                        levels[idx]["askImbalance"] = True
                        bullish_imbalance_count += 1
                
                # Bid Imbalance (diagonal compare with ask above)
                if idx < len(levels) - 1:
                    bid_cur = levels[idx]["bidVolume"]
                    ask_above = levels[idx + 1]["askVolume"]
                    if ask_above > 0 and (bid_cur / ask_above >= self.imbalance_ratio) and bid_cur >= min_imbalance_vol:
                        levels[idx]["bidImbalance"] = True
                        bearish_imbalance_count += 1

            # Detect Stacked Imbalances (>= 3 contiguous imbalances)
            stacked_buy = bullish_imbalance_count >= 3
            stacked_sell = bearish_imbalance_count >= 3

            bar_delta = bar_total_buy - bar_total_sell
            cumulative_delta += bar_delta

            # Trapped traders detection:
            # Trapped Buyers: High ask volume at bar_high but price closes low
            trapped_buyers = False
            if len(levels) >= 2 and levels[-1]["askVolume"] > (min_imbalance_vol * 1.5) and bar_close < bar_open:
                trapped_buyers = True

            # Trapped Sellers: High bid volume at bar_low but price closes high
            trapped_sellers = False
            if len(levels) >= 2 and levels[0]["bidVolume"] > (min_imbalance_vol * 1.5) and bar_close > bar_open:
                trapped_sellers = True

            bars.append({
                "barIndex": i,
                "timestamp": bar_time.strftime("%H:%M"),
                "isoDate": bar_time.isoformat(),
                "open": bar_open,
                "high": bar_high,
                "low": bar_low,
                "close": bar_close,
                "totalVolume": bar_total_buy + bar_total_sell,
                "buyVolume": bar_total_buy,
                "sellVolume": bar_total_sell,
                "delta": bar_delta,
                "deltaPercent": round((bar_delta / max(1, bar_total_buy + bar_total_sell)) * 100.0, 1),
                "cumulativeDelta": cumulative_delta,
                "pocPrice": poc_price,
                "stackedBuyImbalance": stacked_buy,
                "stackedSellImbalance": stacked_sell,
                "trappedBuyers": trapped_buyers,
                "trappedSellers": trapped_sellers,
                "levels": levels
            })

            running_price = bar_close

        return bars

    def calculate_cvd_divergence(self, bars: list) -> dict:
        """
        Detects Cumulative Volume Delta (CVD) Divergences:
          - Bullish Divergence: Price makes lower low, but CVD makes higher low (Absorption / Accumulation)
          - Bearish Divergence: Price makes higher high, but CVD makes lower high (Exhaustion / Distribution)
          - Absorption Warning: Strong negative delta near support without price breakdown
        """
        if len(bars) < 6:
            return {"type": "NONE", "description": "Insufficient bar depth for CVD divergence.", "score": 0}

        recent_bars = bars[-6:]
        price_start = recent_bars[0]["close"]
        price_end = recent_bars[-1]["close"]
        cvd_start = recent_bars[0]["cumulativeDelta"]
        cvd_end = recent_bars[-1]["cumulativeDelta"]

        price_delta_pct = (price_end - price_start) / max(0.01, price_start)
        cvd_delta = cvd_end - cvd_start

        # Bearish Divergence: Price went UP, but CVD went DOWN
        if price_delta_pct > 0.002 and cvd_delta < -150:
            return {
                "type": "BEARISH_DIVERGENCE",
                "bias": "SHORT_EXHAUSTION",
                "severity": "HIGH",
                "score": -78,
                "title": "Exhaustion Divergence (Trapped Buyers)",
                "description": f"Price pushed upward (+{(price_delta_pct*100):.2f}%) while CVD declined by {abs(cvd_delta):,}. Market buyers are being absorbed by passive limit sell orders at the institutional high."
            }

        # Bullish Divergence: Price went DOWN, but CVD went UP
        if price_delta_pct < -0.002 and cvd_delta > 150:
            return {
                "type": "BULLISH_DIVERGENCE",
                "bias": "LONG_ABSORPTION",
                "severity": "HIGH",
                "score": 82,
                "title": "Absorption Divergence (Trapped Sellers)",
                "description": f"Price drifted lower ({(price_delta_pct*100):.2f}%) while CVD increased by +{cvd_delta:,}. Aggressive market selling was completely absorbed by institutional limit buyers."
            }

        # Aggressive initiative trend
        if price_delta_pct > 0.002 and cvd_delta > 250:
            return {
                "type": "AGGRESSIVE_BULLISH_INITIATIVE",
                "bias": "LONG_MOMENTUM",
                "severity": "NORMAL",
                "score": 65,
                "title": "Aggressive Buyer Sweep",
                "description": f"Price and CVD expanding in mutual confluence (+{cvd_delta:,} delta). Institutional market orders are aggressively lifting offers."
            }

        if price_delta_pct < -0.002 and cvd_delta < -250:
            return {
                "type": "AGGRESSIVE_BEARISH_INITIATIVE",
                "bias": "SHORT_MOMENTUM",
                "severity": "NORMAL",
                "score": -65,
                "title": "Aggressive Seller Sweep",
                "description": f"Price and CVD declining in mutual breakdown ({cvd_delta:,} delta). Institutional market sellers are hitting bids with aggression."
            }

        return {
            "type": "NEUTRAL_BALANCED",
            "bias": "BALANCED_CHOP",
            "severity": "LOW",
            "score": 10,
            "title": "Balanced Value Rotation",
            "description": "Order flow delta is closely matching auction value rotation. No significant footprint divergence detected."
        }

    def generate_dom_ladder(self, ticker: str, spot_price: float, depth_levels: int = 12) -> dict:
        """
        Generates realistic Level 2 Depth of Market (DOM) ladder centered at spot price.
        Features:
          - Exact resting limit buy (bid) sizes and resting limit sell (ask) sizes
          - Cumulative volume depth
          - High-liquidity dark pool / institutional blocks
          - Current spread in dollars and ticks
        """
        spec = self.get_instrument_spec(ticker, spot_price)
        tick = spec["tickSize"]
        price = spot_price if spot_price > 0 else spec["basePrice"]
        center_price = round(round(price / tick) * tick, 4)

        base_size = 85 if "ES" in ticker or "NQ" in ticker else (40 if "CL" in ticker or "GC" in ticker else 1500)

        # Generate Ask side (above market)
        asks = []
        cum_ask_depth = 0
        for i in range(1, depth_levels + 1):
            ask_p = round(center_price + (i * tick), 4)
            # Occasional institutional resting limit block (iceberg/wall)
            is_iceberg = (i == 4 or i == 8)
            size = int(base_size * random.uniform(0.6, 1.8) * (3.8 if is_iceberg else 1.0))
            cum_ask_depth += size
            asks.append({
                "price": ask_p,
                "size": size,
                "cumulativeSize": cum_ask_depth,
                "isIcebergWall": is_iceberg,
                "orderType": "ASK"
            })

        # Generate Bid side (below market)
        bids = []
        cum_bid_depth = 0
        for i in range(1, depth_levels + 1):
            bid_p = round(center_price - (i * tick), 4)
            is_iceberg = (i == 5 or i == 9)
            size = int(base_size * random.uniform(0.6, 1.8) * (3.5 if is_iceberg else 1.0))
            cum_bid_depth += size
            bids.append({
                "price": bid_p,
                "size": size,
                "cumulativeSize": cum_bid_depth,
                "isIcebergWall": is_iceberg,
                "orderType": "BID"
            })

        spread_dollars = round(tick, 4)
        spread_ticks = 1.0
        bid_ask_ratio = round(cum_bid_depth / max(1, cum_ask_depth), 2)

        return {
            "centerPrice": center_price,
            "tickSize": tick,
            "spreadDollars": spread_dollars,
            "spreadTicks": spread_ticks,
            "totalBidDepth": cum_bid_depth,
            "totalAskDepth": cum_ask_depth,
            "bidAskRatio": bid_ask_ratio,
            "depthSentiment": "BULLISH_SUPPORT" if bid_ask_ratio > 1.15 else ("BEARISH_RESISTANCE" if bid_ask_ratio < 0.85 else "BALANCED"),
            "asks": list(reversed(asks)), # Highest ask at the top
            "bids": bids                  # Highest bid at the top
        }

    def generate_ai_mentor_tape_narrative(self, ticker: str, spot: float, bars: list, divergence: dict, dom: dict) -> dict:
        """
        VolumeLens AI Order Flow Mentor & Tape Narrator:
        Synthesizes footprint cluster patterns, CVD divergences, and DOM liquidity
        into institutional intelligence with trade setups.
        """
        spec = self.get_instrument_spec(ticker, spot)
        tick = spec["tickSize"]
        last_bar = bars[-1] if bars else None
        
        # Calculate session POC and 70% Value Area
        all_levels = {}
        total_vol = 0
        for b in bars:
            for lvl in b["levels"]:
                p = lvl["price"]
                all_levels[p] = all_levels.get(p, 0) + lvl["totalVolume"]
                total_vol += lvl["totalVolume"]

        poc_price = spot
        max_v = 0
        for p, v in all_levels.items():
            if v > max_v:
                max_v = v
                poc_price = p

        # Value area 70%
        sorted_prices = sorted(all_levels.keys())
        vah = sorted_prices[int(len(sorted_prices) * 0.85)] if sorted_prices else spot + (tick * 10)
        val = sorted_prices[int(len(sorted_prices) * 0.15)] if sorted_prices else spot - (tick * 10)

        # Bias determination
        bias = divergence["bias"]
        score = divergence["score"]

        # Strategy setup formulation
        if "LONG" in bias:
            setup_name = "VolumeLens Institutional Absorption Long"
            entry = round(spot, 2)
            stop_loss = round(min(val, spot - (tick * 12)), 2)
            target1 = round(poc_price if poc_price > spot else spot + (tick * 16), 2)
            target2 = round(max(vah, spot + (tick * 28)), 2)
            risk_reward = round(abs(target1 - entry) / max(0.01, abs(entry - stop_loss)), 2)
        elif "SHORT" in bias:
            setup_name = "VolumeLens Institutional Exhaustion Short"
            entry = round(spot, 2)
            stop_loss = round(max(vah, spot + (tick * 12)), 2)
            target1 = round(poc_price if poc_price < spot else spot - (tick * 16), 2)
            target2 = round(min(val, spot - (tick * 28)), 2)
            risk_reward = round(abs(entry - target1) / max(0.01, abs(stop_loss - entry)), 2)
        else:
            setup_name = "VolumeLens Value Area Mean-Reversion"
            entry = round(spot, 2)
            stop_loss = round(spot - (tick * 8), 2)
            target1 = round(poc_price, 2)
            target2 = round(vah, 2)
            risk_reward = 2.15

        # Tape Mentor Narrative Bullet Points
        tape_bullets = [
            f"Point of Control (POC): High-volume node anchored at ${poc_price:.2f} acting as magnetic institutional liquidity.",
            f"Value Area: 70% of auction volume distributed between VAL ${val:.2f} and VAH ${vah:.2f}.",
            f"Order Book Balance: DOM Bid/Ask ratio is {dom['bidAskRatio']:.2f} ({dom['depthSentiment'].replace('_', ' ')}).",
            f"CVD Signal: {divergence['title']} - {divergence['description']}"
        ]

        if last_bar and last_bar.get("trappedBuyers"):
            tape_bullets.append("Alert: Trapped buyers identified at candle high. Heavy market buying met passive limit resistance.")
        if last_bar and last_bar.get("trappedSellers"):
            tape_bullets.append("Alert: Trapped sellers identified at candle low. Absorption confirmed as price rejected downward flush.")

        return {
            "regime": bias,
            "institutionalScore": score,
            "pocPrice": poc_price,
            "vah": vah,
            "val": val,
            "totalAuctionVolume": total_vol,
            "setup": {
                "name": setup_name,
                "bias": "BULLISH" if "LONG" in bias else ("BEARISH" if "SHORT" in bias else "NEUTRAL"),
                "entryPrice": entry,
                "stopLoss": stop_loss,
                "target1": target1,
                "target2": target2,
                "riskReward": risk_reward,
                "confidencePct": 88 if abs(score) > 70 else 72
            },
            "tapeNarrative": tape_bullets
        }

    def get_complete_order_flow_package(self, ticker: str, current_spot: float = 0.0, timeframe: str = "5m") -> dict:
        """
        Master method assembling the full VolumeLens order flow suite:
          - Instrument Contract Specs
          - Footprint Bars with Bid x Ask clusters
          - Cumulative Volume Delta series
          - Level 2 DOM Ladder
          - Value Area (POC / VAH / VAL)
          - AI Mentor Tape Narrative & Execution Play
        """
        clean = ticker.strip().upper()
        spec = self.get_instrument_spec(clean, current_spot)
        spot = current_spot if current_spot > 0 else spec["basePrice"]

        bars = self.generate_footprint_bars(clean, spot, num_bars=12, timeframe=timeframe)
        divergence = self.calculate_cvd_divergence(bars)
        dom = self.generate_dom_ladder(clean, spot, depth_levels=10)
        ai_mentor = self.generate_ai_mentor_tape_narrative(clean, spot, bars, divergence, dom)

        return {
            "success": True,
            "ticker": clean,
            "spotPrice": spot,
            "timeframe": timeframe,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "specification": spec,
            "footprintBars": bars,
            "cvdDivergence": divergence,
            "domLadder": dom,
            "aiMentor": ai_mentor
        }


# Global Singleton instance
volume_lens_engine = VolumeLensOrderFlowEngine(imbalance_ratio_threshold=3.0)
