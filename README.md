# QuantTrade Wiki

Welcome to the **QuantTrade** wiki — your complete reference for setting up, running, and extending the platform.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Backtesting](#backtesting)
- [Live Trading](#live-trading)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**QuantTrade** is a quantitative trading framework designed for building, backtesting, and deploying algorithmic trading strategies. It provides a clean, modular interface for connecting to market data sources, implementing custom strategies, and executing trades via broker APIs.

Whether you're a researcher testing a new hypothesis or a trader automating an existing edge, QuantTrade is built to take you from idea to live execution.

---

## Features

- **Strategy Engine** — Write and register custom strategies with a simple interface
- **Backtesting Framework** — Simulate strategies on historical OHLCV data with realistic slippage and commission modelling
- **Live Trading** — Connect to broker APIs for paper and live order execution
- **Market Data Integration** — Pull historical and real-time data from multiple sources
- **Risk Management** — Built-in position sizing, stop-loss, and drawdown controls
- **Performance Analytics** — Sharpe ratio, drawdown, win rate, and more out-of-the-box
- **Modular & Extensible** — Plug in custom data sources, brokers, and indicators

---

## Architecture

```
QuantTrade/
├── core/
│   ├── engine.py          # Main trading/backtesting engine
│   ├── strategy.py        # Base strategy class
│   └── portfolio.py       # Portfolio and position tracking
├── data/
│   ├── sources/           # Market data connectors
│   └── feed.py            # Unified data feed interface
├── brokers/
│   ├── base.py            # Abstract broker interface
│   └── paper.py           # Paper trading broker
├── indicators/
│   └── ...                # Technical indicators (MA, RSI, MACD, etc.)
├── risk/
│   └── manager.py         # Risk and position sizing rules
├── analytics/
│   └── metrics.py         # Performance reporting
├── strategies/
│   └── examples/          # Example strategy implementations
├── config/
│   └── settings.py        # Global configuration
└── main.py                # Entry point
```

---

## Installation

### Prerequisites

- Python 3.9+
- `pip` or `conda`

### Clone the Repository

```bash
git clone https://github.com/BhargavA09/QuantTrade.git
cd QuantTrade
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

Or using conda:

```bash
conda env create -f environment.yml
conda activate quanttrade
```

---

## Configuration

Copy the example config and edit it with your settings:

```bash
cp config/settings.example.py config/settings.py
```

Key settings in `config/settings.py`:

| Setting | Description | Default |
|---|---|---|
| `DATA_SOURCE` | Market data provider (`yahoo`, `alpaca`, etc.) | `yahoo` |
| `BROKER` | Broker to use (`paper`, `alpaca`, etc.) | `paper` |
| `INITIAL_CAPITAL` | Starting capital for backtests/paper trading | `100000` |
| `LOG_LEVEL` | Logging verbosity (`DEBUG`, `INFO`, `WARNING`) | `INFO` |

---

## Usage

### Running a Backtest

```bash
python main.py --mode backtest --strategy MovingAverageCrossover --start 2022-01-01 --end 2024-01-01
```

### Running Paper Trading

```bash
python main.py --mode paper --strategy MovingAverageCrossover
```

### Running Live Trading

```bash
python main.py --mode live --strategy MovingAverageCrossover
```

> ⚠️ **Warning:** Live trading uses real capital. Make sure your strategy has been thoroughly backtested and paper traded before enabling live mode.

---

## Backtesting

### Writing a Strategy

Extend the `BaseStrategy` class and implement the `on_bar()` method:

```python
from core.strategy import BaseStrategy

class MyStrategy(BaseStrategy):
    def __init__(self, fast_period=10, slow_period=50):
        super().__init__()
        self.fast_period = fast_period
        self.slow_period = slow_period

    def on_bar(self, bar):
        fast_ma = self.indicators.sma(bar.symbol, self.fast_period)
        slow_ma = self.indicators.sma(bar.symbol, self.slow_period)

        if fast_ma > slow_ma and not self.is_long(bar.symbol):
            self.buy(bar.symbol, quantity=100)

        elif fast_ma < slow_ma and self.is_long(bar.symbol):
            self.sell(bar.symbol, quantity=100)
```

### Backtest Results

After a backtest, a summary is printed to the console and optionally saved to `results/`:

```
==== Backtest Results ====
Period:         2022-01-01 → 2024-01-01
Total Return:   +34.7%
Sharpe Ratio:   1.42
Max Drawdown:   -12.3%
Win Rate:       58.4%
Total Trades:   214
==========================
```

---

## Live Trading

### Supported Brokers

| Broker | Status | Notes |
|---|---|---|
| Paper (built-in) | ✅ Supported | No account needed |
| Alpaca | ✅ Supported | Requires API key |
| Interactive Brokers | 🔧 In Progress | — |

### Connecting to Alpaca

Add your credentials to `config/settings.py`:

```python
ALPACA_API_KEY = "your_api_key"
ALPACA_SECRET_KEY = "your_secret_key"
ALPACA_BASE_URL = "https://paper-api.alpaca.markets"  # paper trading endpoint
```

---

## API Reference

### `BaseStrategy`

| Method | Description |
|---|---|
| `on_bar(bar)` | Called on every new bar. Implement your logic here. |
| `buy(symbol, quantity)` | Submit a market buy order. |
| `sell(symbol, quantity)` | Submit a market sell order. |
| `is_long(symbol)` | Returns `True` if currently holding a long position. |
| `portfolio.cash` | Current available cash. |
| `portfolio.positions` | Dictionary of current open positions. |

### `indicators`

| Indicator | Method |
|---|---|
| Simple Moving Average | `indicators.sma(symbol, period)` |
| Exponential Moving Average | `indicators.ema(symbol, period)` |
| Relative Strength Index | `indicators.rsi(symbol, period)` |
| MACD | `indicators.macd(symbol, fast, slow, signal)` |
| Bollinger Bands | `indicators.bbands(symbol, period, std_dev)` |

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please ensure your code passes existing tests and includes tests for any new functionality.

```bash
pytest tests/
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

---

*Last updated: March 2026*
