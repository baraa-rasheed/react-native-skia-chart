import React, { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { AreaChart } from 'react-native-skia-chart';
import { CATEGORIES, CHARTS, COMPONENT_COUNT, effectsFor, gradientFor, makeRng, prices, type ChartConfig, type ChartDef } from './charts';
import { useChartFonts, type ChartFonts } from './fonts';
import { useChartStore } from './store';
import { palette, theme } from './theme';
import { Icon } from './ui';

const TILE_CHART = 92;
/** Full-width tiles get a taller preview so radial charts don't look tiny. */
const WIDE_CHART = 140;
const noop = () => {};

/** Staggered entrance: each block fades up slightly after the previous one. */
export const Stagger = ({ i, children }: { i: number; children: React.ReactNode }) => (
  <Animated.View entering={FadeInDown.delay(60 + i * 45).duration(460)}>{children}</Animated.View>
);

const LiveDot = () => {
  const o = useSharedValue(1);
  useEffect(() => { o.value = withRepeat(withTiming(0.25, { duration: 700 }), -1, true); }, [o]);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.dot, s]} />;
};

/** Streaming hero chart: same-length updates morph on the UI thread. */
const HeroChart = ({ width }: { width: number }) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const n = 48;
  const data = useMemo(() => prices(makeRng(9), n + tick, 100, 0.03, 0.002).slice(-n), [tick]);
  return (
    <AreaChart width={width} height={150} data={data} interactive={false} padding={{ top: 12, bottom: 4, left: 0, right: 6 }} showGrid={false}
      color={palette[0]} gradient={{ type: 'linear', colors: [palette[0], palette[1]], start: [0, 0], end: [1, 0] }}
      effects={{ glow: 6, shadow: { dy: 4, blur: 10, color: `${palette[0]}66` } }} />
  );
};

const Tile = memo(function Tile({ def, cfg, width, wide, fonts, onOpen }: { def: ChartDef; cfg: ChartConfig; width: number; wide: boolean; fonts: ChartFonts; onOpen: () => void }) {
  const built = useMemo(() => def.build(cfg, 0), [def, cfg]);
  const w = width - 24;
  const h = wide ? WIDE_CHART : TILE_CHART;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${def.name} chart`} onPress={onOpen}
      style={({ pressed }) => [styles.tile, { width }, pressed && styles.pressed]}>
      <View style={styles.tileHead}>
        <Text style={styles.tileTitle} numberOfLines={1}>{def.name}</Text>
        <Icon name="chevron.right" fallback="›" size={11} color={theme.sub} />
      </View>
      <Text style={styles.tileBlurb} numberOfLines={1}>{def.blurb}</Text>
      {/* Tiles are previews: no gestures, so the whole card stays one tap target. */}
      <View pointerEvents="none" style={[styles.tileChart, { height: h }]}>
        {built.render({ w, h, mini: true, effects: effectsFor(cfg), gradient: gradientFor(cfg, def), fonts, picked: null, onPick: noop })}
      </View>
      <Text style={styles.tileComponent} numberOfLines={1}>{`<${def.component.split(' · ')[0]} />`}</Text>
    </Pressable>
  );
});

export function Gallery({ width, onOpen }: { width: number; onOpen: (id: string) => void }) {
  const { configs } = useChartStore();
  const fonts = useChartFonts();
  const full = width - 40;
  const tileW = (full - 12) / 2;
  let k = 0;
  return (
    <>
      <Stagger i={k++}>
        <View style={styles.pkg}>
          <Text style={styles.pkgText}>npm i react-native-skia-chart</Text>
        </View>
        <Text style={styles.tagline}>GPU-accelerated charts for React Native, drawn with Skia and animated on the UI thread.</Text>
      </Stagger>
      <Stagger i={k++}>
        <View style={styles.hero}>
          <View style={styles.liveRow}><LiveDot /><Text style={styles.liveText}>Live · updates every second</Text></View>
          <HeroChart width={full} />
        </View>
      </Stagger>
      <Stagger i={k++}>
        <View style={styles.stats}>
          {[[String(COMPONENT_COUNT), 'chart types'], ['60 fps', 'gestures'], ['SkSL', 'GPU effects']].map(([v, l]) => (
            <View key={l} style={styles.stat}>
              <Text style={styles.statValue}>{v}</Text>
              <Text style={styles.statLabel}>{l}</Text>
            </View>
          ))}
        </View>
      </Stagger>
      {CATEGORIES.map((cat) => {
        const defs = CHARTS.filter((d) => d.category === cat);
        return (
          <Stagger key={cat} i={k++}>
            <View style={styles.sectionHead}>
              <Text style={styles.section}>{cat}</Text>
              <Text style={styles.count}>{defs.length}</Text>
            </View>
            <View style={styles.grid}>
              {defs.map((def, i) => {
                const cfg = configs[def.id];
                // An odd one out at the end of a category spans the full row.
                const wide = i === defs.length - 1 && defs.length % 2 === 1;
                return cfg ? <Tile key={def.id} def={def} cfg={cfg} width={wide ? full : tileW} wide={wide} fonts={fonts} onOpen={() => onOpen(def.id)} /> : null;
              })}
            </View>
          </Stagger>
        );
      })}
      <Text style={styles.footer}>Tap any chart to customise it and see the code.</Text>
    </>
  );
}

const styles = StyleSheet.create({
  pkg: { alignSelf: 'flex-start', backgroundColor: 'rgba(169,155,255,0.14)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(169,155,255,0.35)' },
  pkgText: { color: theme.accent, fontFamily: 'Menlo', fontSize: 13 },
  tagline: { color: theme.text, opacity: 0.86, fontSize: 17, lineHeight: 23, marginTop: 12 },
  hero: { marginTop: 18 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.up },
  liveText: { color: theme.sub, fontSize: 13, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { flex: 1, backgroundColor: theme.card, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.separator },
  statValue: { color: theme.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  statLabel: { color: theme.sub, fontSize: 12, fontWeight: '600', marginTop: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 30, marginBottom: 12 },
  section: { color: theme.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  count: { color: theme.sub, fontSize: 15, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { backgroundColor: theme.card, borderRadius: 18, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.separator },
  tileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  tileTitle: { color: theme.text, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  tileBlurb: { color: theme.sub, fontSize: 12, marginTop: 2 },
  tileChart: { marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  tileComponent: { color: theme.accent, opacity: 0.8, fontFamily: 'Menlo', fontSize: 11, marginTop: 10 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  footer: { color: theme.sub, fontSize: 13, textAlign: 'center', marginTop: 28 },
});
