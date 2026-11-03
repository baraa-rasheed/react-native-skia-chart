import React, { useMemo } from 'react';
import { EffectsLayer, effectsInset } from '../effects/EffectsLayer';
import { Canvas, Group, Path, Text, type SkFont } from 'react-native-skia';
import { useDerivedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import type { BaseChartProps, PieSlice } from '../types';
import { slicePath } from '../utils/path';
import { useEntryProgress } from '../hooks/useEntryProgress';
import {
  ChartFrame,
  ZoomGroup,
  useHighlight,
  useSelection,
  type SelectableProps,
  type ZoomableProps,
} from '../interaction';
import { GestureDetector } from 'react-native-gesture-handler';

/** Pie / donut. Selection index = slice index; the selected slice pops out. */
export interface PieChartProps extends Omit<BaseChartProps, 'padding'>, SelectableProps {
  data: PieSlice[];
  /** 0 for pie, 0..1 fraction of radius for donut. */
  innerRadius?: number;
  /** Gap between slices in degrees. */
  padAngle?: number;
  startAngle?: number;
  centerLabel?: string;
  centerLabelColor?: string;
  centerFont?: SkFont | null;
}

const Slice = ({
  cx,
  cy,
  r,
  inner,
  start,
  sweep,
  color,
  progress,
  startAngle,
  index,
  selected,
}: {
  cx: number;
  cy: number;
  r: number;
  inner: number;
  start: number;
  sweep: number;
  color: string;
  progress: SharedValue<number>;
  startAngle: number;
  index: number;
  selected: SharedValue<number>;
}) => {
  const opacity = useHighlight(selected, index, 0.4);
  const pop = useDerivedValue(() => withTiming(selected.value === index ? 1 : 0, { duration: 200 }));
  const mid = ((start + sweep / 2) * Math.PI) / 180;
  const transform = useDerivedValue(() => [
    { translateX: Math.cos(mid) * 8 * pop.value },
    { translateY: Math.sin(mid) * 8 * pop.value },
  ]);
  const path = useDerivedValue(() => {
    const p = progress.value;
    return slicePath(cx, cy, r, inner, startAngle + (start - startAngle) * p, Math.max(0.01, sweep * p));
  });
  return <Path path={path} color={color} opacity={opacity} transform={transform} />;
};

/** Pie / donut chart; slices sweep open on the UI thread. */
export const PieChart = (props: PieChartProps) => {
  const {
    effects,
    gradient,
    width,
    height,
    style,
    data,
    innerRadius = 0,
    padAngle = 0,
    startAngle = -90,
    animation,
    backgroundColor,
    centerLabel,
    centerLabelColor = '#222',
    centerFont,
    font,
  } = props;
  const size = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  // Leave room for the 8px pop-out of a selected slice and for the shadow / glow.
  const r = size / 2 - Math.max(10, effectsInset(effects));
  const inner = r * innerRadius;
  const slices = useMemo(() => {
    const total = data.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
    let acc = startAngle;
    return data.map((s) => {
      const sweep = (Math.max(0, s.value) / total) * 360;
      const out = {
        start: acc + padAngle / 2,
        sweep: Math.max(0.01, sweep - padAngle),
        color: s.color,
        label: s.label,
      };
      acc += sweep;
      return out;
    });
  }, [data, padAngle, startAngle]);
  const progress = useEntryProgress(animation ?? { duration: 900 }, [slices]);
  const starts = slices.map((s) => s.start);
  const sweeps = slices.map((s) => s.sweep);
  const { gesture, selected } = useSelection(props, (px, py) => {
    'worklet';
    const dx = px - cx;
    const dy = py - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > r + 8 || d < inner - 4) return -1;
    const a = (Math.atan2(dy, dx) * 180) / Math.PI;
    for (let i = 0; i < starts.length; i++) {
      const rel = (((a - (starts[i] as number)) % 360) + 360) % 360;
      if (rel <= (sweeps[i] as number)) return i;
    }
    return -1;
  });
  const cf = centerFont ?? font;
  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={[{ width, height, backgroundColor }, style]}>
        <EffectsLayer effects={effects} gradient={gradient} width={width} height={height}>
          <Group>
            {slices.map((s, i) => (
              <Slice
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                inner={inner}
                start={s.start}
                sweep={s.sweep}
                color={s.color}
                progress={progress}
                startAngle={startAngle}
                index={i}
                selected={selected}
              />
            ))}
          </Group>
          {cf && centerLabel ? (
            <Text
              x={cx - cf.measureText(centerLabel).width / 2}
              y={cy + cf.getSize() / 3}
              text={centerLabel}
              font={cf}
              color={centerLabelColor}
            />
          ) : null}
        </EffectsLayer>
      </Canvas>
    </GestureDetector>
  );
};

export type DonutChartProps = Omit<PieChartProps, 'innerRadius'> & { thickness?: number };
export const DonutChart = ({ thickness = 0.4, ...p }: DonutChartProps) => (
  <PieChart {...p} innerRadius={1 - thickness} />
);
