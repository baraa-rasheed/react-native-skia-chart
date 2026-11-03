import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AreaChart, BarChart, BubbleChart, CandlestickChart, DonutChart, GaugeChart, HeatmapChart, Histogram, LineChart, OHLCChart,
  PieChart, ProgressRings, RadarChart, ScatterChart, Sparkline, StackedAreaChart, StackedBarChart, type Candle, type ChartEffects,
  type ChartGradient, type ColorFilterPreset, type ShaderPreset,
} from 'react-native-skia-chart';
import type { ChartFonts } from './fonts';
import { palette, theme } from './theme';

/* ---------------- deterministic data ---------------- */
export type Rng = () => number;
/** mulberry32: same seed → same data, so the gallery tile and the playground always match. */
export const makeRng = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
/** Price-like random walk with momentum, so it trends like a real ticker instead of zig-zagging. */
export const prices = (r: Rng, n: number, start: number, vol = 0.02, drift = 0.0008) => {
  let v = start;
  let m = 0;
  return Array.from({ length: n }, () => {
    m = m * 0.65 + (r() - 0.5) * vol;
    v = Math.max(start * 0.3, v * (1 + drift + m));
    return v;
  });
};
const candlesOf = (r: Rng, n: number, start: number): Candle[] => {
  let p = start;
  return Array.from({ length: n }, (_, x) => {
    const open = p;
    const close = open * (1 + (r() - 0.48) * 0.03);
    p = close;
    return { x, open, close, high: Math.max(open, close) * (1 + r() * 0.012), low: Math.min(open, close) * (1 - r() * 0.012) };
  });
};
const colorsFrom = (base: string, n: number) => {
  const i0 = Math.max(0, palette.indexOf(base as (typeof palette)[number]));
  return Array.from({ length: n }, (_, i) => palette[(i0 + i) % palette.length] ?? base);
};

/* ---------------- formatting ---------------- */
export const commas = (n: number, d = 2) => {
  const [i, f] = n.toFixed(d).split('.');
  return (i ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? `.${f}` : '');
};
export const usd = (v: number, d = 2) => `$${commas(v, d)}`;
const pct = (a: number, b: number) => ((b - a) / (a || 1)) * 100;
const k = (v: number) => `${(v / 1000).toFixed(1)}k`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ---------------- config ---------------- */
export type FlagKey =
  | 'grid' | 'smooth' | 'percent' | 'horizontal' | 'donut' | 'center' | 'needle' | 'value' | 'ohlc' | 'trend' | 'fill'
  | 'compare' | 'labels' | 'interactive' | 'select' | 'zoom' | 'longPress';
export type GradientKind = 'none' | 'linear' | 'radial' | 'sweep';
export interface ChartConfig {
  color: string;
  /** Second gradient stop (the first is `color`). */
  color2: string;
  /** GPU gradient applied to the marks: 'none' keeps the solid colour. */
  gradient: GradientKind;
  count: number;
  seed: number;
  flags: Partial<Record<FlagKey, boolean>>;
  shadow: boolean;
  glow: boolean;
  shader: ShaderPreset;
  filter: ColorFilterPreset;
  /** Stream new data points (playground only). */
  live: boolean;
}
export interface Flag { key: FlagKey; label: string; hint?: string; group: 'style' | 'gesture'; initial: boolean }
export interface Summary { value: string; delta?: number; caption: string }
export interface RenderArgs {
  w: number;
  h: number;
  /** Gallery tile: no labels, no gestures. */
  mini: boolean;
  effects: ChartEffects;
  gradient?: ChartGradient;
  fonts: ChartFonts;
  /** Currently scrubbed / selected index. */
  picked: number | null;
  onPick: (i: number | null) => void;
}
export interface Built {
  headline: Summary;
  /** Readout for a scrubbed / selected index. */
  pick?: (i: number) => Summary | undefined;
  render: (a: RenderArgs) => React.ReactElement;
}
export type Category = 'Trends' | 'Comparison' | 'Part of whole' | 'Correlation' | 'Finance' | 'KPI';
export interface ChartDef {
  id: string;
  /** Chart type, e.g. "Candlestick". */
  name: string;
  /** Exported component(s), shown on the gallery tile. */
  component: string;
  category: Category;
  blurb: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  initial: number;
  color: string;
  /** Supports streaming data in the playground. */
  live?: boolean;
  /** Colour carries meaning (up/down, intensity, one colour per series), so a gradient tint would hide it. */
  noGradient?: boolean;
  flags: Flag[];
  build: (cfg: ChartConfig, tick: number) => Built;
}

const salt = (id: string) => [...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7);
const rngFor = (id: string, cfg: ChartConfig) => makeRng(salt(id) + cfg.seed * 7919);
const on = (cfg: ChartConfig, f: FlagKey) => cfg.flags[f] ?? false;
const style = (key: FlagKey, label: string, initial: boolean, hint?: string): Flag => ({ key, label, hint, group: 'style', initial });
const gesture = (key: FlagKey, label: string, initial: boolean, hint?: string): Flag => ({ key, label, hint, group: 'gesture', initial });
const GRID = style('grid', 'Axis labels', true, 'Grid lines with a Skia font');
const SCRUB = gesture('interactive', 'Scrub to inspect', true, 'Drag across the chart');
const LONG = gesture('longPress', 'Hold before scrubbing', false, 'Best inside scroll views');
const ZOOM = gesture('zoom', 'Pinch to zoom', true, 'Pinch, two-finger pan, double-tap');
const SELECT = gesture('select', 'Tap to select', true, 'Tap a mark, tap again to clear');
/** Labels need a font and only make sense full size. */
/** Gallery tiles are small: trade the default 16px padding for a little more chart. */
const MINI_PAD = { top: 8, bottom: 8, left: 6, right: 6 };
const axisFont = (cfg: ChartConfig, a: RenderArgs, f: FlagKey = 'grid') => (!a.mini && on(cfg, f) ? a.fonts.axis : undefined);

export const CHARTS: ChartDef[] = [
  {
    id: 'line', name: 'Line', component: 'LineChart', category: 'Trends', blurb: 'Smooth, scrubbable time series',
    unit: 'points', min: 10, max: 150, step: 10, initial: 60, color: palette[0], live: true,
    flags: [GRID, style('smooth', 'Smooth curve', true, 'Monotone cubic interpolation'), SCRUB, LONG, ZOOM],
    build: (cfg, tick) => {
      const n = cfg.count;
      const d = prices(rngFor('line', cfg), n + tick, 182, 0.022).slice(-n);
      const first = d[0] ?? 0;
      return {
        headline: { value: usd(d[n - 1] ?? 0), delta: pct(first, d[n - 1] ?? 0), caption: 'AAPL · Apple Inc.' },
        pick: (i) => (d[i] === undefined ? undefined : { value: usd(d[i]), delta: pct(first, d[i]), caption: `Point ${i + 1} of ${n}` }),
        render: (a) => (
          <LineChart padding={a.mini ? MINI_PAD : undefined} width={a.w} height={a.h} data={d} color={cfg.color} curve={on(cfg, 'smooth') ? 'monotone' : 'linear'}
            showGrid={!a.mini && on(cfg, 'grid')} font={axisFont(cfg, a)} formatY={(v) => `$${v.toFixed(0)}`}
            interactive={!a.mini && on(cfg, 'interactive')} scrubActivation={on(cfg, 'longPress') ? 'longPress' : 'pan'}
            zoom={!a.mini && on(cfg, 'zoom')} cursorColor="rgba(255,255,255,0.6)" onScrub={(p, i) => a.onPick(p ? i : null)}
            effects={a.effects} gradient={a.gradient} />
        ),
      };
    },
  },
  {
    id: 'area', name: 'Area', component: 'AreaChart', category: 'Trends', blurb: 'Gradient-filled trend',
    unit: 'points', min: 10, max: 150, step: 10, initial: 50, color: palette[1], live: true,
    flags: [GRID, SCRUB, LONG, ZOOM],
    build: (cfg, tick) => {
      const n = cfg.count;
      const d = prices(rngFor('area', cfg), n + tick, 118, 0.028, 0.0012).slice(-n);
      const first = d[0] ?? 0;
      return {
        headline: { value: usd(d[n - 1] ?? 0), delta: pct(first, d[n - 1] ?? 0), caption: 'NVDA · NVIDIA Corp.' },
        pick: (i) => (d[i] === undefined ? undefined : { value: usd(d[i]), delta: pct(first, d[i]), caption: `Point ${i + 1} of ${n}` }),
        render: (a) => (
          <AreaChart padding={a.mini ? MINI_PAD : undefined} width={a.w} height={a.h} data={d} color={cfg.color} showGrid={!a.mini && on(cfg, 'grid')} font={axisFont(cfg, a)}
            formatY={(v) => `$${v.toFixed(0)}`} interactive={!a.mini && on(cfg, 'interactive')}
            scrubActivation={on(cfg, 'longPress') ? 'longPress' : 'pan'} zoom={!a.mini && on(cfg, 'zoom')}
            cursorColor="rgba(255,255,255,0.6)" onScrub={(p, i) => a.onPick(p ? i : null)} effects={a.effects} gradient={a.gradient} />
        ),
      };
    },
  },
  {
    id: 'stackedArea', name: 'Stacked area', component: 'StackedAreaChart', category: 'Trends', blurb: 'Composition over time',
    unit: 'series', min: 1, max: 5, step: 1, initial: 3, color: palette[5], noGradient: true,
    flags: [style('percent', '100% stacked', false, 'Show each series as a share'), GRID, ZOOM],
    build: (cfg) => {
      const r = rngFor('stackedArea', cfg);
      const names = ['Stocks', 'Bonds', 'Crypto', 'Cash', 'Gold'];
      const s = colorsFrom(cfg.color, cfg.count).map((color, i) => ({ color, label: names[i], data: prices(r, 24, 40 - i * 7, 0.05) }));
      const total = s.reduce((acc, x) => acc + (x.data[23] ?? 0), 0);
      return {
        headline: { value: on(cfg, 'percent') ? `${cfg.count} assets` : `$${total.toFixed(1)}k`, caption: on(cfg, 'percent') ? 'Share of portfolio' : 'Portfolio value' },
        render: (a) => (
          <StackedAreaChart padding={a.mini ? MINI_PAD : undefined} width={a.w} height={a.h} series={s} percent={on(cfg, 'percent')} showGrid={!a.mini && on(cfg, 'grid')}
            font={axisFont(cfg, a)} formatY={on(cfg, 'percent') ? undefined : (v) => `$${v}k`} zoom={!a.mini && on(cfg, 'zoom')}
            effects={a.effects} gradient={a.gradient} />
        ),
      };
    },
  },
  {
    id: 'sparkline', name: 'Sparkline', component: 'Sparkline', category: 'Trends', blurb: 'Tiny inline trends for lists',
    unit: 'points', min: 10, max: 60, step: 5, initial: 32, color: palette[4],
    flags: [style('trend', 'Colour by trend', true, 'Green when up, red when down'), style('fill', 'Gradient fill', false)],
    build: (cfg) => {
      const r = rngFor('sparkline', cfg);
      const rows = [['AAPL', 182], ['NVDA', 118], ['MSFT', 415], ['TSLA', 248]].map(([t, start]) => {
        const d = prices(r, cfg.count, start as number, 0.03, 0);
        return { ticker: t as string, d, delta: pct(d[0] ?? 0, d[d.length - 1] ?? 0) };
      });
      const colorOf = (delta: number) => (on(cfg, 'trend') ? (delta >= 0 ? theme.up : theme.down) : cfg.color);
      return {
        headline: { value: `${rows.length} tickers`, caption: 'Watchlist rows' },
        render: (a) => {
          const first = rows[0];
          if (a.mini && first) return <Sparkline width={a.w} height={a.h} data={first.d} color={colorOf(first.delta)} fill={on(cfg, 'fill')} gradient={a.gradient} strokeWidth={2.5} />;
          return (
            <View style={[styles.rows, { width: a.w, height: a.h }]}>
              {rows.map((row) => (
                <View key={row.ticker} style={styles.row}>
                  <Text style={styles.ticker}>{row.ticker}</Text>
                  <Sparkline width={a.w * 0.4} height={34} data={row.d} color={colorOf(row.delta)} fill={on(cfg, 'fill')} gradient={a.gradient} strokeWidth={2} />
                  <Text style={[styles.delta, { color: row.delta >= 0 ? theme.up : theme.down }]}>{`${row.delta >= 0 ? '+' : ''}${row.delta.toFixed(2)}%`}</Text>
                </View>
              ))}
            </View>
          );
        },
      };
    },
  },
  {
    id: 'bar', name: 'Bar', component: 'BarChart', category: 'Comparison', blurb: 'Vertical or horizontal, selectable',
    unit: 'bars', min: 4, max: 24, step: 1, initial: 12, color: palette[3],
    flags: [style('horizontal', 'Horizontal', false), GRID, SELECT, { ...ZOOM, initial: false }],
    build: (cfg) => {
      const r = rngFor('bar', cfg);
      const d = Array.from({ length: cfg.count }, () => Math.round(20 + r() * 75));
      const labels = cfg.count <= 12 ? MONTHS.slice(0, cfg.count) : undefined;
      return {
        headline: { value: `${commas(d.reduce((x, y) => x + y, 0), 0)}M`, caption: 'MSFT · Monthly volume' },
        pick: (i) => (d[i] === undefined ? undefined : { value: `${d[i]}M`, caption: `${labels?.[i] ?? `Bar ${i + 1}`} volume` }),
        render: (a) => (
          <BarChart padding={a.mini ? MINI_PAD : undefined} key={`${on(cfg, 'horizontal')}`} width={a.w} height={a.h} data={d} color={cfg.color} horizontal={on(cfg, 'horizontal')}
            labels={!a.mini && on(cfg, 'grid') ? labels : undefined} showGrid={!a.mini && on(cfg, 'grid')} font={axisFont(cfg, a)}
            formatY={(v) => `${v}M`} selectable={!a.mini && on(cfg, 'select')} onSelect={a.onPick} zoom={!a.mini && on(cfg, 'zoom')}
            effects={a.effects} gradient={a.gradient} />
        ),
      };
    },
  },
  {
    id: 'stackedBar', name: 'Stacked bar', component: 'StackedBarChart', category: 'Comparison', blurb: 'Segments that add up',
    unit: 'segments', min: 1, max: 5, step: 1, initial: 3, color: palette[4], noGradient: true,
    flags: [GRID, SELECT],
    build: (cfg) => {
      const r = rngFor('stackedBar', cfg);
      const names = ['Cloud', 'Retail', 'Ads', 'Devices', 'Other'];
      const s = colorsFrom(cfg.color, cfg.count).map((color, i) => ({ color, label: names[i], data: Array.from({ length: 8 }, () => 4 + Math.round(r() * 16)) }));
      const totals = Array.from({ length: 8 }, (_, i) => s.reduce((acc, x) => acc + (x.data[i] ?? 0), 0));
      const labels = totals.map((_, i) => `Q${i + 1}`);
      return {
        headline: { value: `$${totals.reduce((x, y) => x + y, 0)}B`, caption: 'AMZN · Revenue by segment' },
        pick: (i) => (totals[i] === undefined ? undefined : { value: `$${totals[i]}B`, caption: `Q${i + 1} revenue` }),
        render: (a) => (
          <StackedBarChart padding={a.mini ? MINI_PAD : undefined} width={a.w} height={a.h} series={s} labels={!a.mini && on(cfg, 'grid') ? labels : undefined}
            showGrid={!a.mini && on(cfg, 'grid')} font={axisFont(cfg, a)} formatY={(v) => `$${v}B`}
            selectable={!a.mini && on(cfg, 'select')} onSelect={a.onPick} effects={a.effects} gradient={a.gradient} />
        ),
      };
    },
  },
  {
    id: 'histogram', name: 'Histogram', component: 'Histogram', category: 'Comparison', blurb: 'Bins raw values for you',
    unit: 'bins', min: 8, max: 40, step: 4, initial: 24, color: palette[0],
    flags: [GRID, SELECT],
    build: (cfg) => {
      const r = rngFor('histogram', cfg);
      const v = Array.from({ length: 800 }, () => (r() + r() + r() + r() - 2) * 2.4);
      const mean = v.reduce((x, y) => x + y, 0) / v.length;
      return {
        headline: { value: `${mean >= 0 ? '+' : ''}${mean.toFixed(2)}%`, caption: 'SPY · 800 daily returns' },
        render: (a) => (
          <Histogram padding={a.mini ? MINI_PAD : undefined} key={cfg.count} width={a.w} height={a.h} values={v} bins={cfg.count} color={cfg.color} showGrid={!a.mini && on(cfg, 'grid')}
            font={axisFont(cfg, a)} selectable={!a.mini && on(cfg, 'select')} effects={a.effects} gradient={a.gradient} />
        ),
      };
    },
  },
  {
    id: 'pie', name: 'Donut & pie', component: 'DonutChart · PieChart', category: 'Part of whole', blurb: 'Slices pop out on tap',
    unit: 'slices', min: 2, max: 6, step: 1, initial: 5, color: palette[2],
    flags: [style('donut', 'Donut', true), style('center', 'Centre label', true, 'Shows the selected slice'), SELECT],
    build: (cfg) => {
      const r = rngFor('pie', cfg);
      const names = ['AAPL', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'TSLA'];
      const d = colorsFrom(cfg.color, cfg.count).map((color, i) => ({ color, label: names[i], value: 8 + Math.round(r() * 40) }));
      const total = d.reduce((acc, x) => acc + x.value, 0);
      const share = (i: number) => Math.round(((d[i]?.value ?? 0) / total) * 100);
      const top = d.reduce((b, x, i) => (x.value > (d[b]?.value ?? 0) ? i : b), 0);
      return {
        headline: { value: `${share(top)}%`, caption: `Largest holding · ${d[top]?.label ?? ''}` },
        pick: (i) => (d[i] ? { value: `${share(i)}%`, caption: `${d[i].label} · ${usd(d[i].value * 1240, 0)}` } : undefined),
        render: (a) => {
          const center = !a.mini && on(cfg, 'donut') && on(cfg, 'center');
          const common = { width: a.w, height: a.h, data: d, padAngle: 2, selectable: !a.mini && on(cfg, 'select'), onSelect: a.onPick, effects: a.effects, gradient: a.gradient };
          return on(cfg, 'donut')
            ? <DonutChart key={`${cfg.seed}-${cfg.count}`} {...common} thickness={0.32} centerLabel={center ? `${share(a.picked ?? top)}%` : undefined} centerFont={a.fonts.value} centerLabelColor={theme.text} />
            : <PieChart key={`${cfg.seed}-${cfg.count}`} {...common} />;
        },
      };
    },
  },
  {
    id: 'rings', name: 'Progress rings', component: 'ProgressRings', category: 'Part of whole', blurb: 'Activity-style goals',
    unit: 'rings', min: 1, max: 5, step: 1, initial: 3, color: palette[2],
    flags: [SELECT],
    build: (cfg) => {
      const r = rngFor('rings', cfg);
      const names = ['Move', 'Exercise', 'Stand', 'Sleep', 'Mindful'];
      const d = colorsFrom(cfg.color, cfg.count).map((color, i) => ({ color, label: names[i], progress: 0.35 + r() * 0.6 }));
      const avg = Math.round((d.reduce((acc, x) => acc + x.progress, 0) / d.length) * 100);
      return {
        headline: { value: `${avg}%`, caption: 'Average of daily goals' },
        pick: (i) => (d[i] ? { value: `${Math.round(d[i].progress * 100)}%`, caption: `${d[i].label} goal` } : undefined),
        render: (a) => (
          <ProgressRings key={`${cfg.seed}-${cfg.count}`} width={a.w} height={a.h} data={d} thickness={a.mini ? 9 : 16}
            selectable={!a.mini && on(cfg, 'select')} onSelect={a.onPick} effects={a.effects} gradient={a.gradient} />
        ),
      };
    },
  },
  {
    id: 'scatter', name: 'Scatter', component: 'ScatterChart', category: 'Correlation', blurb: 'Hundreds of points at 60 fps',
    unit: 'points', min: 20, max: 300, step: 20, initial: 120, color: palette[2],
    flags: [GRID, SELECT, ZOOM],
    build: (cfg) => {
      const r = rngFor('scatter', cfg);
      const d = Array.from({ length: cfg.count }, () => { const x = 8 + r() * 50; return { x, y: x * 0.45 - 6 + (r() - 0.5) * 18 }; });
      return {
        headline: { value: 'ρ 0.82', caption: 'Volatility vs return · 1Y' },
        pick: (i) => (d[i] ? { value: `${d[i].y >= 0 ? '+' : ''}${d[i].y.toFixed(1)}%`, caption: `Volatility ${d[i].x.toFixed(1)}%` } : undefined),
        render: (a) => (
          <ScatterChart key={cfg.seed} width={a.w} height={a.h} data={d} color={cfg.color} radius={a.mini ? 2.5 : 4}
            showGrid={!a.mini && on(cfg, 'grid')} font={axisFont(cfg, a)} formatY={(v) => `${v}%`}
            selectable={!a.mini && on(cfg, 'select')} onSelect={a.onPick} zoom={!a.mini && on(cfg, 'zoom')} effects={a.effects} gradient={a.gradient} />
        ),
      };
    },
  },
  {
    id: 'bubble', name: 'Bubble', component: 'BubbleChart', category: 'Correlation', blurb: 'A third dimension as size',
    unit: 'bubbles', min: 5, max: 40, step: 5, initial: 20, color: palette[3],
    flags: [GRID, SELECT, ZOOM],
    build: (cfg) => {
      const r = rngFor('bubble', cfg);
      const d = Array.from({ length: cfg.count }, () => ({ x: 10 + r() * 50, y: -5 + r() * 40, z: 50 + r() * r() * 3000 }));
      return {
        headline: { value: `${cfg.count} companies`, caption: 'P/E × growth × market cap' },
        pick: (i) => (d[i] ? { value: `$${commas(d[i].z, 0)}B`, caption: `P/E ${d[i].x.toFixed(0)} · growth ${d[i].y.toFixed(0)}%` } : undefined),
        render: (a) => (
          <BubbleChart key={cfg.seed} width={a.w} height={a.h} data={d} color={cfg.color} maxRadius={a.mini ? 12 : 22} minRadius={a.mini ? 2 : 4}
            showGrid={!a.mini && on(cfg, 'grid')} font={axisFont(cfg, a)} formatY={(v) => `${v}%`}
            selectable={!a.mini && on(cfg, 'select')} onSelect={a.onPick} zoom={!a.mini && on(cfg, 'zoom')} effects={a.effects} gradient={a.gradient} />
        ),
      };
    },
  },
  {
    id: 'radar', name: 'Radar', component: 'RadarChart', category: 'Correlation', blurb: 'Multi-axis profiles',
    unit: 'axes', min: 3, max: 8, step: 1, initial: 6, color: palette[1], noGradient: true,
    flags: [style('labels', 'Axis labels', true), style('compare', 'Compare to index', true, 'Adds a second series')],
    build: (cfg) => {
      const axes = ['Value', 'Growth', 'Momentum', 'Quality', 'Size', 'Yield', 'Volatility', 'ESG'].slice(0, cfg.count);
      const r = rngFor('radar', cfg);
      const s = colorsFrom(cfg.color, on(cfg, 'compare') ? 2 : 1).map((color) => ({ color, values: axes.map(() => 4 + Math.round(r() * 6)) }));
      return {
        headline: { value: `${cfg.count} factors`, caption: on(cfg, 'compare') ? 'Fund vs index exposure' : 'Fund factor exposure' },
        render: (a) => (
          <RadarChart key={`${cfg.seed}-${cfg.count}-${on(cfg, 'compare')}`} width={a.w} height={a.h} axes={axes} max={10} series={s}
            font={axisFont(cfg, a, 'labels')} labelColor={theme.sub} gridColor="rgba(255,255,255,0.12)" effects={a.effects} gradient={a.gradient} />
        ),
      };
    },
  },
  {
    id: 'candle', name: 'Candlestick', component: 'CandlestickChart · OHLCChart', category: 'Finance', blurb: 'OHLC with a crosshair',
    unit: 'candles', min: 10, max: 90, step: 10, initial: 40, color: theme.up, noGradient: true,
    flags: [style('ohlc', 'OHLC bars', false), GRID, { ...SCRUB, label: 'Crosshair' }, LONG, ZOOM],
    build: (cfg) => {
      const d = candlesOf(rngFor('candle', cfg), cfg.count, 64200);
      const last = d[d.length - 1];
      const Comp = on(cfg, 'ohlc') ? OHLCChart : CandlestickChart;
      return {
        headline: { value: usd(last?.close ?? 0), delta: pct(d[0]?.open ?? 0, last?.close ?? 0), caption: 'BTC-USD · 1H candles' },
        pick: (i) => {
          const c = d[i];
          return c ? { value: usd(c.close), delta: pct(c.open, c.close), caption: `O ${k(c.open)}  H ${k(c.high)}  L ${k(c.low)}` } : undefined;
        },
        render: (a) => (
          <Comp padding={a.mini ? MINI_PAD : undefined} width={a.w} height={a.h} data={d} positiveColor={cfg.color} negativeColor={theme.down} showGrid={!a.mini && on(cfg, 'grid')}
            font={axisFont(cfg, a)} formatY={(v) => `$${k(v)}`} interactive={!a.mini && on(cfg, 'interactive')}
            scrubActivation={on(cfg, 'longPress') ? 'longPress' : 'pan'} zoom={!a.mini && on(cfg, 'zoom')}
            onScrub={(c, i) => a.onPick(c ? i : null)} effects={a.effects} gradient={a.gradient} />
        ),
      };
    },
  },
  {
    id: 'heatmap', name: 'Heatmap', component: 'HeatmapChart', category: 'Finance', blurb: 'Matrix intensity, row-major',
    unit: 'weeks', min: 6, max: 26, step: 2, initial: 18, color: palette[5], noGradient: true,
    flags: [style('labels', 'Day labels', true), SELECT, { ...ZOOM, initial: false }],
    build: (cfg) => {
      const r = rngFor('heatmap', cfg);
      const cols = cfg.count;
      const m = DAYS.map((_, row) => Array.from({ length: cols }, () => Math.min(1, r() * (row >= 5 ? 0.6 : 1.1))));
      return {
        headline: { value: `${cols * 7} days`, caption: 'ETH-USD · On-chain activity' },
        pick: (i) => {
          const row = Math.floor(i / cols);
          const v = m[row]?.[i % cols];
          return v === undefined ? undefined : { value: `${commas(Math.round(v * 1200), 0)} txns`, caption: `${DAYS[row]} · week ${(i % cols) + 1}` };
        },
        render: (a) => (
          <HeatmapChart key={`${cfg.seed}-${cols}`} width={a.w} height={a.h} data={m} colors={[theme.chip, cfg.color]} padding={a.mini ? 0 : 4}
            rowLabels={on(cfg, 'labels') ? DAYS.map((d, i) => (i % 2 === 0 ? d : '')) : undefined} font={axisFont(cfg, a, 'labels')} labelColor={theme.sub}
            selectable={!a.mini && on(cfg, 'select')} onSelect={a.onPick} zoom={!a.mini && on(cfg, 'zoom')} effects={a.effects} gradient={a.gradient} />
        ),
      };
    },
  },
  {
    id: 'gauge', name: 'Gauge', component: 'GaugeChart', category: 'KPI', blurb: 'A single number, beautifully',
    unit: 'value', min: 0, max: 100, step: 5, initial: 62, color: palette[0], live: true,
    flags: [style('needle', 'Needle', true), style('value', 'Value label', true)],
    build: (cfg, tick) => {
      const v = tick ? Math.max(0, Math.min(100, cfg.count + Math.sin(tick * 0.9) * 9 + Math.cos(tick * 2.3) * 4)) : cfg.count;
      const mood = v >= 55 ? 'Greed' : v <= 45 ? 'Fear' : 'Neutral';
      const stops = cfg.gradient === 'none' ? colorsFrom(cfg.color, 3) : [cfg.color, cfg.color2];
      return {
        headline: { value: String(Math.round(v)), caption: `Fear & Greed · ${mood}` },
        render: (a) => (
          <GaugeChart width={a.w} height={a.h} value={v} gradient={stops} showNeedle={on(cfg, 'needle')} needleColor={theme.text}
            trackColor="rgba(255,255,255,0.08)" thickness={a.mini ? 9 : 16} valueFont={!a.mini && on(cfg, 'value') ? a.fonts.big : undefined}
            valueColor={theme.text} formatValue={(x) => String(Math.round(x))} effects={a.effects} />
        ),
      };
    },
  },
];

export const CATEGORIES: Category[] = ['Trends', 'Comparison', 'Part of whole', 'Correlation', 'Finance', 'KPI'];
/** Exported chart components (some defs cover two, like Donut & Pie). */
export const COMPONENT_COUNT = 18;

export const initialConfig = (def: ChartDef): ChartConfig => ({
  color: def.color,
  color2: palette[(Math.max(0, palette.indexOf(def.color as (typeof palette)[number])) + 1) % palette.length] ?? theme.accent,
  gradient: 'none',
  count: def.initial,
  seed: 0,
  flags: Object.fromEntries(def.flags.map((f) => [f.key, f.initial])),
  shadow: true,
  glow: false,
  shader: 'none',
  filter: 'none',
  live: false,
});

export const shadowFor = (color: string) => ({ dy: 3, blur: 6, color: `${color}55` });
export const effectsFor = (cfg: ChartConfig): ChartEffects => ({
  shadow: cfg.shadow ? shadowFor(cfg.color) : undefined,
  glow: cfg.glow ? 8 : undefined,
  shader: cfg.shader,
  colorFilter: cfg.filter,
});

/** Maps the playground's gradient controls to the library's `gradient` prop (GPU Linear/Radial/Sweep gradient shader). */
export const gradientFor = (cfg: ChartConfig, def: ChartDef): ChartGradient | undefined => {
  if (cfg.gradient === 'none' || def.noGradient) return undefined;
  const colors = [cfg.color, cfg.color2];
  if (cfg.gradient === 'linear') return { type: 'linear', colors, start: [0, 0], end: [1, 1] };
  if (cfg.gradient === 'radial') return { type: 'radial', colors, center: [0.5, 0.5], radius: 0.9 };
  return { type: 'sweep', colors: [cfg.color, cfg.color2, cfg.color] };
};

const styles = StyleSheet.create({
  rows: { justifyContent: 'space-around' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  ticker: { color: theme.text, fontSize: 16, fontWeight: '700', width: 70 },
  delta: { fontSize: 14, fontWeight: '700', width: 70, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
