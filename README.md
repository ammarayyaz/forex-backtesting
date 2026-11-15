# QuantFX: Institutional Forex Replay Platform

A high-performance Forex backtesting web application featuring bar-by-bar historical replay, institutional position sizing, live margin telemetry, and terminal aesthetics.

---

## Overview

QuantFX delivers a simulation environment for Forex traders and algorithmic strategy development. The engine resamples 1-minute historical data on the fly, enforces spread and pip calculations, and executes orders with authentic balance, equity, and margin tracking.

### Core Capabilities

- **28 Forex Pairs**: Complete coverage across Majors (EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, USD/CHF, NZD/USD), Crosses, and Exotics.
- **Multi-Timeframe Engine**: Seamless switching between M1, M5, M15, M30, H1, H4, and D1 with instant client-side aggregation.
- **Bar-by-Bar Replay**: Forward step, backward step, continuous playback with configurable speeds (0.1s to 1.0s per bar), and interactive timeline scrubbing.
- **Institutional Risk & Sizing**: Automatic lot calculation based on account balance risk percentage (1%, 2%, 3%) or direct fixed lot execution.
- **Active Trade Management**: Stop Loss, Take Profit, 1-click Breakeven (BE), manual position liquidation, and real-time floating PnL tracking.
- **Margin & Leverage Telemetry**: Dynamic tracking of Used Margin, Free Margin, and Margin Level % at 1:100 institutional leverage.
- **Global Market Sessions**: Real-time status indicators for Sydney, Tokyo, London, and New York trading sessions.
- **Custom CSV Import**: Import custom broker M1 historical data with automatic resampling.
- **Performance Analytics & Journal**: Session metrics (Win Rate, Profit Factor, Max Drawdown, Average Win/Loss, Expected Payoff) and CSV export for trade journaling.

---

## Tech Stack

- **Framework**: React 19 (TypeScript)
- **Bundler & Tooling**: Vite, Oxlint
- **Styling**: Tailwind CSS v4
- **Charting Engine**: TradingView Lightweight Charts (v5.3)
- **Icons**: Lucide React

---

## Quick Start Guide

### Prerequisites

- Node.js 18.0 or higher
- npm 9.0 or higher

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/ammarayyaz/forex-backtesting.git

# Navigate to project directory
cd forex-backtesting

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### Production Build

```bash
# Type check and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## User Guide: Step-by-Step Workflow

### 1. Select Market and Timeframe
- Select any of the 28 Forex pairs from the pair selector in the navigation bar.
- Choose your working timeframe: `M1`, `M5`, `M15`, `M30`, `H1`, `H4`, or `D1`.
- Review the live spread in pips and active session clocks (Sydney, Tokyo, London, New York).

### 2. Replay Bar-by-Bar
- Use the Replay Control Deck at the base of the chart:
  - **Play / Pause (`Space`)**: Start or pause continuous candle progression.
  - **Step Forward (`Right Arrow`)**: Advance the market by 1 bar.
  - **Step Backward (`Left Arrow`)**: Rewind the market by 1 bar.
  - **Playback Speed**: Toggle between 0.1s, 0.25s, 0.5s, or 1.0s intervals per bar.
  - **Timeline Scrubber**: Seek to specific historical dates without forward lookahead bias.
  - **Bar Inspection**: Click any candlestick on the chart to inspect timestamp, duration, high/low pip range, and volume.

### 3. Position Sizing and Order Execution
- Configure orders in the Trade Panel on the right:
  - **Risk Percentage Lot Sizing**: Select 1%, 2%, or 3% risk. Set your Stop Loss in pips. The terminal computes lot size using account equity:
    $$\text{Risk Amount} = \text{Balance} \times \left(\frac{\text{Risk \%}}{100}\right)$$
    $$\text{Lot Size} = \frac{\text{Risk Amount}}{\text{SL Pips} \times \text{Pip Value per Standard Lot}}$$
  - **Fixed Lot Sizing**: Specify exact standard lots (e.g., 0.10, 0.50, 1.00).
  - **SL and TP Targets**: Set values in pips or absolute price targets.
  - **Execution**: Click **BUY (ASK)** or **SELL (BID)**. Realistic bid-ask spreads apply upon entry.

### 4. Active Trade Management
- **Automated Exits**: If price touches your SL or TP level during replay, the position automatically closes and realized PnL updates.
- **1-Click Breakeven**: Shift Stop Loss to the exact entry price to protect capital once price moves into profit.
- **Manual Liquidation**: Close individual tickets or liquidate all active positions with **Close All**.

### 5. Margin Telemetry
- **Balance**: Realized closed capital.
- **Equity**: Balance plus live floating unrealized PnL.
- **Used Margin**: Reserved collateral based on 1:100 institutional margin:
  $$\text{Margin} = \frac{\text{Lots} \times 100{,}000 \times \text{Entry Price}}{100}$$
- **Free Margin**: Capital available for opening additional positions ($\text{Equity} - \text{Used Margin}$).
- **Margin Level %**: Ratio of Equity to Used Margin ($(\text{Equity} / \text{Used Margin}) \times 100\%$).

### 6. Analytics and Trade Journal
- Inspect the bottom Analytics Deck:
  - **Open Positions**: Active tickets with live floating PnL, pip gain/loss, and allocated margin.
  - **Trade History**: Closed positions log with entry/exit timestamps, duration, and exit trigger (`STOP_LOSS`, `TAKE_PROFIT`, `MANUAL`).
  - **Performance Metrics**: Real-time Win Rate %, Profit Factor, Max Drawdown, Average Win/Loss, and Expected Payoff.
  - **CSV Export**: Export your complete session trading journal for external documentation.

---

## Keyboard Shortcuts

| Key | Action | Function |
| :--- | :--- | :--- |
| `Space` | Play / Pause | Toggle continuous replay playback |
| `Right Arrow` | Step Forward | Advance simulation by 1 bar |
| `Left Arrow` | Step Backward | Rewind simulation by 1 bar |
| `?` | Quick Start Guide | Open in-app keyboard shortcuts and user guide modal |
| `Esc` | Dismiss Modal | Close open dialogs and overlays |
| `Click Bar` | Inspect Candle | Display timestamp, duration, and pip range tooltip |
| `Click & Drag` | Pan Chart | Scroll timeline horizontally |
| `Mouse Wheel` | Zoom Chart | Adjust candle spacing and zoom level |

---

## Custom Broker Data Import

Import custom historical data through the **Data Import** tab in the Analytics Deck.

### Supported CSV Format

CSV files can arrange headers in any sequence (case-insensitive):

```csv
Date,Open,High,Low,Close,Volume
2026-03-01 00:00:00,1.08500,1.08540,1.08480,1.08520,120
2026-03-01 00:01:00,1.08520,1.08560,1.08510,1.08550,95
```

The aggregation engine converts 1-minute records into M5, M15, M30, H1, H4, and D1 candles automatically.

---

## Project Structure

```
forex-backtesting/
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── src/
│   ├── components/
│   │   ├── AnalyticsDeck.tsx       # Bottom telemetry drawer (history, metrics, CSV import)
│   │   ├── ChartCanvas.tsx         # Lightweight Charts candle renderer and drawing tools
│   │   ├── HeaderNav.tsx           # Pair selector, timeframe toggles, session clocks
│   │   ├── OrderConsole.tsx        # Buy/Sell execution dock, lot calculator, active orders
│   │   ├── QuickStartGuide.tsx     # In-app starting guide and hotkeys modal
│   │   └── ReplayControlDeck.tsx   # Replay playback controls, speeds, timeline scrubber
│   ├── data/
│   │   ├── forexPairs.ts           # 28 FX pair specs (pip size, decimals, spreads, sessions)
│   │   └── realHistoricalData.json # Preloaded authentic historical candle dataset
│   ├── services/
│   │   ├── forexMath.ts            # PnL math, margin calculation, pip conversion
│   │   └── historicalDataGenerator.ts # Candle aggregation, timeframe resampling, CSV parser
│   ├── types/
│   │   └── forex.ts                # TypeScript interfaces for pairs, orders, candles, metrics
│   ├── App.tsx                     # Main layout container and state orchestrator
│   └── main.tsx                    # React application entry point
├── .gitignore
├── .oxlintrc.json
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## License

MIT License. Open source for educational and trading research purposes.
