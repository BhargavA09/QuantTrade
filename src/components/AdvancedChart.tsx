import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { motion } from 'motion/react';
import { Maximize2, Minimize2, LineChart, CandlestickChart } from 'lucide-react';

interface AdvancedChartProps {
  data: { date: string; open?: number; high?: number; low?: number; close?: number; price: number; volume: number }[];
  forecastData?: { date: string; price: number }[];
  models?: { name: string; forecast: { date: string; price: number }[]; confidence: string; description?: string }[];
  ticker: string;
}

export const AdvancedChart: React.FC<AdvancedChartProps> = ({ data, forecastData, models, ticker }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [activeModel, setActiveModel] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const forecastSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    // Calculate moving averages
    const calculateSMA = (data: any[], period: number) => {
      const sma = [];
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) continue;
        let sum = 0;
        for (let j = 0; j < period; j++) sum += data[i - j].close ?? data[i - j].price;
        sma.push({ time: data[i].date, value: sum / period });
      }
      return sma;
    };

    const sma20 = calculateSMA(data, 20);
    const sma50 = calculateSMA(data, 50);

    const formattedData = data.map(d => ({
      time: d.date,
      open: d.open ?? d.price,
      high: d.high ?? d.price,
      low: d.low ?? d.price,
      close: d.close ?? d.price,
      value: d.close ?? d.price, // For line chart
    }));

    const volumeData = data.map((d, index) => ({
      time: d.date,
      value: d.volume,
      color: index === 0 || (d.close ?? d.price) >= (data[index - 1].close ?? data[index - 1].price) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'
    }));

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a1a1aa', // zinc-400
      },
      grid: {
        vertLines: { color: 'rgba(39, 39, 42, 0.5)' }, // zinc-800
        horzLines: { color: 'rgba(39, 39, 42, 0.5)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(63, 63, 70, 0.5)',
      },
      timeScale: {
        borderColor: 'rgba(63, 63, 70, 0.5)',
        timeVisible: true,
      },
      crosshair: {
        mode: 0,
      },
      autoSize: true,
    });
    
    chartRef.current = chart;

    let mainSeries;
    if (chartType === 'candle') {
      mainSeries = chart.addCandlestickSeries({
        upColor: '#10b981', // emerald-500
        downColor: '#f43f5e', // rose-500
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
      });
      mainSeries.setData(formattedData);
    } else {
      mainSeries = chart.addLineSeries({
        color: '#3b82f6', // blue-500
        lineWidth: 2,
      });
      mainSeries.setData(formattedData.map(d => ({ time: d.time, value: d.close })));
    }
    mainSeriesRef.current = mainSeries as any;

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as an overlay
    });
    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeries.setData(volumeData);
    volumeSeriesRef.current = volumeSeries;

    // Add moving averages
    const sma20Series = chart.addLineSeries({ color: 'rgba(234, 179, 8, 0.8)', lineWidth: 1, title: 'SMA 20' });
    sma20Series.setData(sma20);

    const sma50Series = chart.addLineSeries({ color: 'rgba(168, 85, 247, 0.8)', lineWidth: 1, title: 'SMA 50' });
    sma50Series.setData(sma50);

    // Add Forecast line if available
    const activeForecast = models?.[activeModel]?.forecast || forecastData;
    if (activeForecast && activeForecast.length > 0) {
      const forecastSeries = chart.addLineSeries({
        color: '#10b981', // emerald
        lineWidth: 2,
        lineStyle: 1, // Dotted
        title: models?.[activeModel]?.name || 'Neural Forecast'
      });
      
      const lastRealData = formattedData[formattedData.length - 1];
      const combinedForecast = [
        { time: lastRealData.time, value: lastRealData.close },
        ...activeForecast.map(f => ({ time: f.date, value: f.price }))
      ];
      
      forecastSeries.setData(combinedForecast);
      forecastSeriesRef.current = forecastSeries;
    }

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [data, forecastData, models, activeModel, chartType]);

  return (
    <div className={`flex flex-col gap-4 ${isFullscreen ? 'fixed inset-0 z-[100] p-6 bg-zinc-950/95 backdrop-blur-xl' : 'h-[500px]'}`}>
      <div className="flex justify-between items-center mb-2 z-10 overflow-x-auto gap-4 pb-2 scrollbar-hide">
        <div className="flex gap-2">
          {models && models.length > 0 && (
            <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 mr-2">
              {models.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActiveModel(i)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    activeModel === i ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {m.name.split(' (')[0]}
                </button>
              ))}
            </div>
          )}
          <button 
            onClick={() => setChartType('candle')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'candle' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <CandlestickChart size={18} />
          </button>
          <button 
            onClick={() => setChartType('line')}
            className={`p-2 rounded-lg transition-colors ${chartType === 'line' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <LineChart size={18} />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
             <span className="text-yellow-500/80">SMA 20</span>
             <span className="text-purple-500/80">SMA 50</span>
             {forecastData && <span className="text-emerald-500">Neural Forecast</span>}
          </div>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-900 rounded-lg hover:bg-zinc-800"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>
      <div ref={chartContainerRef} className="flex-1 w-full rounded-xl overflow-hidden border border-zinc-800/80 shadow-[0_0_40px_rgba(0,0,0,0.5)]" />
    </div>
  );
};