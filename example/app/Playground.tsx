import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ColorFilterPreset, ShaderPreset } from 'react-native-skia-chart';
import { CHARTS, effectsFor, gradientFor, type ChartDef, type GradientKind, type Summary } from './charts';
import { useChartFonts } from './fonts';
import { Segmented } from './Segmented';
import { useChartStore } from './store';
import { theme } from './theme';
import { Cell, DeltaPill, Glass, Icon, LinkCell, Section, Stacked, SwitchCell, Swatches } from './ui';

const GRADIENTS: readonly GradientKind[] = ['none', 'linear', 'radial', 'sweep'];
const SHADERS: readonly ShaderPreset[] = ['none', 'shimmer', 'aurora', 'scanlines'];
const FILTERS: readonly ColorFilterPreset[] = ['none', 'grayscale', 'sepia', 'invert', 'saturate'];
type Tab = 'Style' | 'Data' | 'Gestures' | 'Effects';
const CHART_H = 240;
const PAD = 16;

/** Big number + change pill, driven by scrubbing / selection. */
const Readout = ({ summary }: { summary: Summary }) => (
  <View style={styles.readout}>
    <View style={styles.valueRow}>
      <Text style={styles.value} numberOfLines={1}>{summary.value}</Text>
      {summary.delta !== undefined ? <DeltaPill delta={summary.delta} small /> : null}
    </View>
    <Text style={styles.caption} numberOfLines={1}>{summary.caption}</Text>
  </View>
);

export function Playground({ id }: { id: string }) {
  const { configs, update, reset } = useChartStore();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const fonts = useChartFonts();
  const def = CHARTS.find((d) => d.id === id) as ChartDef;
  const cfg = configs[id];
  const [tab, setTab] = useState<Tab>('Style');
  const [picked, setPicked] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const live = !!(def.live && cfg?.live);

  useEffect(() => {
    if (!live) { setTick(0); return; }
    const t = setInterval(() => setTick((x) => x + 1), 900);
    return () => clearInterval(t);
  }, [live]);

  const set = useCallback((patch: Parameters<typeof update>[1]) => update(id, patch), [update, id]);
  const onPick = useCallback((i: number | null) => {
    setPicked((p) => {
      if (p !== i && i !== null) void Haptics.selectionAsync();
      return i;
    });
  }, []);
  const built = useMemo(() => (cfg ? def.build(cfg, tick) : null), [def, cfg, tick]);
  if (!cfg || !built) return null;

  const summary = (picked !== null && built.pick?.(picked)) || built.headline;
  const styleFlags = def.flags.filter((f) => f.group === 'style');
  const gestureFlags = def.flags.filter((f) => f.group === 'gesture');
  const tabs: Tab[] = gestureFlags.length ? ['Style', 'Data', 'Gestures', 'Effects'] : ['Style', 'Data', 'Effects'];
  const flagCell = (f: (typeof def.flags)[number]) => (
    <SwitchCell key={f.key} label={f.label} hint={f.hint} value={cfg.flags[f.key] ?? false} onChange={(v) => set({ flags: { [f.key]: v } })} />
  );

  return (
    // One scroll view for everything: readout, chart, tabs and controls scroll together.
    <ScrollView style={styles.flex} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
      <Readout summary={summary} />
      <View style={styles.chart}>
        {built.render({ w: width - PAD * 2, h: CHART_H, mini: false, effects: effectsFor(cfg), gradient: gradientFor(cfg, def), fonts, picked, onPick })}
      </View>
      <View style={styles.tabs}>
        <Segmented options={tabs} value={tab} onChange={setTab} />
      </View>
      {tab === 'Style' ? (
        <>
          <Section>
            <Stacked label="Colour"><Swatches value={cfg.color} onChange={(color) => set({ color })} /></Stacked>
            {def.noGradient ? null : (
              <Stacked label="Gradient">
                <Segmented options={GRADIENTS} labels={['None', 'Linear', 'Radial', 'Sweep']} value={cfg.gradient} onChange={(gradient) => set({ gradient })} />
              </Stacked>
            )}
            {cfg.gradient !== 'none' && !def.noGradient ? <Stacked label="End colour"><Swatches value={cfg.color2} onChange={(color2) => set({ color2 })} /></Stacked> : null}
          </Section>
          {styleFlags.length ? <Section>{styleFlags.map(flagCell)}</Section> : null}
        </>
      ) : null}

      {tab === 'Data' ? (
        <>
          <Section footer={`${def.min}–${def.max} ${def.unit}`}>
            <Cell label={def.unit === 'value' ? `Value ${cfg.count}` : `${cfg.count} ${def.unit}`}>
              <View style={styles.stepper}>
                <Glass label="Decrease" style={styles.stepBtn} disabled={cfg.count <= def.min} onPress={() => set({ count: Math.max(def.min, cfg.count - def.step) })}>
                  <Icon name="minus" fallback="−" />
                </Glass>
                <Glass label="Increase" style={styles.stepBtn} disabled={cfg.count >= def.max} onPress={() => set({ count: Math.min(def.max, cfg.count + def.step) })}>
                  <Icon name="plus" fallback="+" />
                </Glass>
              </View>
            </Cell>
            <LinkCell label="Randomize data" icon="shuffle" fallback="⤨" onPress={() => { setPicked(null); set({ seed: cfg.seed + 1 }); }} />
          </Section>
          {def.live ? (
            <Section footer="Same-length updates morph on the UI thread instead of redrawing.">
              <SwitchCell label="Live data" hint="Streams a new point every second" value={cfg.live} onChange={(v) => set({ live: v })} />
            </Section>
          ) : null}
        </>
      ) : null}

      {tab === 'Gestures' ? <Section footer="Gestures run on the UI thread with Reanimated and Gesture Handler.">{gestureFlags.map(flagCell)}</Section> : null}

      {tab === 'Effects' ? (
        <>
          <Section footer="Shaders and filters run as SkSL on the GPU.">
            <SwitchCell label="Drop shadow" hint="Coloured shadow image filter" value={cfg.shadow} onChange={(shadow) => set({ shadow })} />
            <SwitchCell label="Neon glow" hint="Blurred copy under the marks" value={cfg.glow} onChange={(glow) => set({ glow })} />
            <Stacked label="Shader">
              <Segmented options={SHADERS} labels={['None', 'Shimmer', 'Aurora', 'Scan']} value={cfg.shader} onChange={(shader) => set({ shader })} />
            </Stacked>
            <Stacked label="Colour filter">
              <Segmented options={FILTERS} labels={['None', 'Mono', 'Sepia', 'Invert', 'Vivid']} value={cfg.filter} onChange={(filter) => set({ filter })} />
            </Stacked>
          </Section>
          <Section>
            <Pressable accessibilityRole="button" onPress={() => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); setPicked(null); reset(id); }}
              style={({ pressed }) => pressed && styles.pressedCell}>
              <View style={styles.resetCell}><Text style={styles.destructive}>Reset to defaults</Text></View>
            </Pressable>
          </Section>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: PAD, paddingTop: 8 },
  readout: { minHeight: 58, justifyContent: 'center' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: { color: theme.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6, fontVariant: ['tabular-nums'], flexShrink: 1 },
  caption: { color: theme.sub, fontSize: 14, fontWeight: '500', marginTop: 1, fontVariant: ['tabular-nums'] },
  chart: { height: CHART_H, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  tabs: { paddingTop: 16, paddingBottom: 4 },
  stepper: { flexDirection: 'row', gap: 8 },
  stepBtn: { width: 48 },
  resetCell: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16 },
  destructive: { color: theme.destructive, fontSize: 17 },
  pressedCell: { backgroundColor: 'rgba(255,255,255,0.06)' },
});
