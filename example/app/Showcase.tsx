import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AreaChart, BarChart, DonutChart, LineChart, ProgressRings, Sparkline } from 'react-native-skia-chart';
import { commas, makeRng, prices, shadowFor, usd } from './charts';
import { useChartFonts } from './fonts';
import { Segmented } from './Segmented';
import { Stagger } from './Gallery';
import { palette, theme } from './theme';
import { DeltaPill } from './ui';

const RANGES = ['1D', '1W', '1M', '6M', '1Y'] as const;
const RANGE_POINTS = [24, 42, 60, 90, 120] as const;
/** Ticker rows → the playground each one opens. */
const WATCHLIST = [
  { ticker: 'AAPL', name: 'Apple Inc.', id: 'line', start: 182, seed: 11 },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', id: 'area', start: 118, seed: 23 },
  { ticker: 'BTC-USD', name: 'Bitcoin', id: 'candle', start: 64200, seed: 5 },
  { ticker: 'MSFT', name: 'Microsoft Corp.', id: 'bar', start: 415, seed: 42 },
] as const;
const HOLDINGS = [
  { label: 'Tech', value: 46, color: palette[0] },
  { label: 'Crypto', value: 18, color: palette[2] },
  { label: 'Energy', value: 14, color: palette[3] },
  { label: 'Bonds', value: 12, color: palette[1] },
  { label: 'Cash', value: 10, color: palette[5] },
];
const GOALS = [
  { label: 'Move', value: '486 / 600 kcal', progress: 0.81, color: '#FF4F7B' },
  { label: 'Exercise', value: '27 / 30 min', progress: 0.9, color: '#B6FF3D' },
  { label: 'Stand', value: '9 / 12 hrs', progress: 0.75, color: '#3DE8FF' },
];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Classic watchlist row: ticker + name, sparkline, price + change badge. */
const WatchRow = memo(function WatchRow({ ticker, name, start, seed, onPress }: { ticker: string; name: string; start: number; seed: number; onPress: () => void }) {
  const data = useMemo(() => prices(makeRng(seed), 32, start, 0.025, 0.001), [seed, start]);
  const last = data[data.length - 1] ?? 0;
  const delta = ((last - (data[0] ?? 0)) / (data[0] || 1)) * 100;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${ticker}, open playground`} onPress={onPress}
      style={({ pressed }) => [styles.watch, pressed && styles.pressed]}>
      <View style={styles.flex}>
        <Text style={styles.ticker}>{ticker}</Text>
        <Text style={styles.sub} numberOfLines={1}>{name}</Text>
      </View>
      <Sparkline width={76} height={32} data={data} color={delta >= 0 ? theme.up : theme.down} strokeWidth={1.8} />
      <View style={styles.watchRight}>
        <Text style={styles.price}>{commas(last)}</Text>
        <DeltaPill delta={delta} />
      </View>
    </Pressable>
  );
});

const Legend = ({ items }: { items: { label: string; value: string; color: string }[] }) => (
  <View style={styles.legend}>
    {items.map((it) => (
      <View key={it.label} style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: it.color }]} />
        <Text style={styles.legendLabel}>{it.label}</Text>
        <Text style={styles.legendValue}>{it.value}</Text>
      </View>
    ))}
  </View>
);

function Finance({ width, onOpen }: { width: number; onOpen: (id: string) => void }) {
  const fonts = useChartFonts();
  const [range, setRange] = useState<(typeof RANGES)[number]>('1M');
  const [active, setActive] = useState<number | null>(null);
  const [slice, setSlice] = useState<number | null>(null);
  const n = RANGE_POINTS[RANGES.indexOf(range)] ?? 60;
  const data = useMemo(() => prices(makeRng(77 + n), n, 118000, 0.014, 0.0032), [n]);
  const first = data[0] ?? 0;
  const shown = data[active ?? data.length - 1] ?? 0;
  const delta = shown - first;
  const onScrub = useCallback((p: unknown, i: number) => {
    setActive((a) => {
      const next = p ? i : null;
      if (next !== null && next !== a) void Haptics.selectionAsync();
      return next;
    });
  }, []);
  const total = HOLDINGS.reduce((a, h) => a + h.value, 0);
  const sel = slice !== null ? HOLDINGS[slice] : undefined;
  const donut = Math.min(170, width * 0.42);
  let k = 0;
  return (
    <>
      <Stagger i={k++}>
        <Text style={styles.caption}>{active === null ? 'Your portfolio' : `Point ${active + 1} of ${n}`}</Text>
        <Text style={styles.balance}>{usd(shown)}</Text>
        <Text style={[styles.change, { color: delta >= 0 ? theme.up : theme.down }]}>
          {`${delta >= 0 ? '▲' : '▼'} ${usd(Math.abs(delta))} (${((delta / first) * 100).toFixed(2)}%)`} <Text style={styles.sub}>{range}</Text>
        </Text>
      </Stagger>
      <Stagger i={k++}>
        <View style={styles.heroChart}>
          <LineChart width={width} height={210} data={data} color={palette[0]} strokeWidth={2.5} showGrid={false}
            gradient={{ type: 'linear', colors: [palette[0], palette[1]], start: [0, 0], end: [1, 0] }}
            effects={{ shadow: shadowFor(palette[0]) }} cursorColor="rgba(255,255,255,0.6)" onScrub={onScrub} />
        </View>
        <Segmented options={RANGES} value={range} onChange={(r) => { setActive(null); setRange(r); }} />
      </Stagger>
      <Stagger i={k++}>
        <Text style={styles.section}>Watchlist</Text>
        {WATCHLIST.map((w, i) => (
          <View key={w.ticker} style={i > 0 && styles.divider}>
            <WatchRow ticker={w.ticker} name={w.name} start={w.start} seed={w.seed} onPress={() => onOpen(w.id)} />
          </View>
        ))}
      </Stagger>
      <Stagger i={k++}>
        <Text style={styles.section}>Allocation</Text>
        <View style={styles.split}>
          <DonutChart width={donut} height={donut} data={HOLDINGS} thickness={0.3} padAngle={2} selectable onSelect={setSlice}
            centerLabel={`${Math.round(((sel?.value ?? HOLDINGS[0]!.value) / total) * 100)}%`} centerFont={fonts.value} centerLabelColor={theme.text}
            effects={{ shadow: { dy: 3, blur: 6, color: 'rgba(139,124,255,0.35)' } }} />
          <Legend items={HOLDINGS.map((h) => ({ label: h.label, value: usd((h.value / total) * 128420, 0), color: h.color }))} />
        </View>
      </Stagger>
    </>
  );
}

function Fitness({ width }: { width: number }) {
  const fonts = useChartFonts();
  const [goal, setGoal] = useState<number | null>(null);
  const steps = useMemo(() => { const r = makeRng(3); return DAYS.map(() => Math.round(5 + r() * 9)); }, []);
  const heart = useMemo(() => prices(makeRng(8), 60, 72, 0.06, 0), []);
  const ring = Math.min(170, width * 0.42);
  const g = goal !== null ? GOALS[goal] : undefined;
  let k = 0;
  return (
    <>
      <Stagger i={k++}>
        <Text style={styles.caption}>{g ? g.label : 'Activity'}</Text>
        <Text style={styles.balance}>{g ? `${Math.round(g.progress * 100)}%` : '82%'}</Text>
        <Text style={[styles.change, { color: theme.up }]}>{g ? g.value : '▲ 6% vs last week'}</Text>
      </Stagger>
      <Stagger i={k++}>
        <View style={[styles.split, styles.ringsBlock]}>
          <ProgressRings width={ring} height={ring} data={GOALS} thickness={16} gap={4} selectable onSelect={setGoal}
            effects={{ glow: 5 }} />
          <Legend items={GOALS} />
        </View>
      </Stagger>
      <Stagger i={k++}>
        <Text style={styles.section}>Steps</Text>
        <Text style={styles.sub}>{`${commas(steps.reduce((a, b) => a + b, 0) * 1000, 0)} this week`}</Text>
        <View style={styles.chartGap}>
          <BarChart width={width} height={180} data={steps} labels={DAYS} color={palette[4]} radius={8} font={fonts.axis} showGrid
            formatY={(v) => (v ? `${v}k` : "0")} selectable gradient={{ type: 'linear', colors: [palette[4], palette[1]] }}
            effects={{ shadow: shadowFor(palette[4]) }} />
        </View>
      </Stagger>
      <Stagger i={k++}>
        <Text style={styles.section}>Heart rate</Text>
        <Text style={styles.sub}>{`Resting ${Math.round(Math.min(...heart))} bpm · drag to inspect`}</Text>
        <View style={styles.chartGap}>
          <AreaChart width={width} height={170} data={heart} color={theme.down} font={fonts.axis} showGrid formatY={(v) => `${v.toFixed(0)}`}
            cursorColor="rgba(255,255,255,0.6)" effects={{ shadow: shadowFor(theme.down) }} />
        </View>
      </Stagger>
    </>
  );
}

export function Showcase({ width, onOpen }: { width: number; onOpen: (id: string) => void }) {
  const [screen, setScreen] = useState<'Finance' | 'Fitness'>('Finance');
  const full = width - 40;
  return (
    <>
      <View style={styles.switcher}>
        <Segmented options={['Finance', 'Fitness'] as const} value={screen} onChange={setScreen} />
      </View>
      {screen === 'Finance' ? <Finance key="f" width={full} onOpen={onOpen} /> : <Fitness key="h" width={full} />}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  switcher: { marginBottom: 20 },
  caption: { color: theme.sub, fontSize: 15, fontWeight: '600' },
  balance: { color: theme.text, fontSize: 40, fontWeight: '700', letterSpacing: -1, fontVariant: ['tabular-nums'], marginTop: 2 },
  change: { fontSize: 15, fontWeight: '600', marginTop: 2, fontVariant: ['tabular-nums'] },
  sub: { color: theme.sub, fontSize: 13, fontWeight: '500' },
  heroChart: { marginTop: 12, marginBottom: 12 },
  section: { color: theme.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4, marginTop: 30, marginBottom: 6 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
  watch: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  watchRight: { alignItems: 'flex-end', gap: 4 },
  ticker: { color: theme.text, fontSize: 18, fontWeight: '700' },
  price: { color: theme.text, fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  split: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 8 },
  ringsBlock: { marginTop: 20 },
  legend: { flex: 1, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: theme.text, fontSize: 15, fontWeight: '600', flex: 1 },
  legendValue: { color: theme.sub, fontSize: 13, fontVariant: ['tabular-nums'] },
  chartGap: { marginTop: 10 },
  pressed: { opacity: 0.7 },
});
