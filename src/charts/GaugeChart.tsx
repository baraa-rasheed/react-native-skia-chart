import React, { useEffect } from 'react';
import { EffectsLayer, effectsInset } from '../effects/EffectsLayer';
import { Canvas, Circle, Group, Line, Path, SweepGradient, Text, vec, type SkFont } from 'react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import type { BaseChartProps } from '../types';
import type { ChartGradient } from '../effects/EffectsLayer';
import { arcPath } from '../utils/path';

export interface GaugeChartProps extends Omit<BaseChartProps, 'padding' | 'gradient'> {
  value: number;
  min?: number;
  max?: number;
  /** Total sweep of the dial in degrees (default 240). */
  sweep?: number;
  thickness?: number;
  /** Primary mark colour (hex). */
  color?: string;
  /**
   * Gradient along the arc (overrides `color`). Pass colour stops, or a `ChartGradient` to also set `positions`.
   * The gauge always uses a sweep gradient that follows the dial; the track stays untinted.
   */
  gradient?: string[] | ChartGradient;
  trackColor?: string;
  showNeedle?: boolean;
  needleColor?: string;
  formatValue?: (v: number) => string;
  valueFont?: SkFont | null;
  valueColor?: string;
}

/** Speedometer-style gauge. Value changes animate the arc and needle on the UI thread. */
export const GaugeChart = ({
  effects,
  width,
  height,
  style,
  value,
  min = 0,
  max = 100,
  sweep = 240,
  thickness = 16,
  color = '#6C5CE7',
  gradient,
  trackColor = 'rgba(128,128,128,0.2)',
  showNeedle = true,
  needleColor = '#333',
  formatValue = (v) => `${Math.round(v)}`,
  valueFont,
  valueColor = '#222',
  font,
  animation,
  backgroundColor,
}: GaugeChartProps) => {
  const cx = width / 2;
  const cy = height / 2 + (sweep <= 180 ? height / 4 : 0);
  const r = Math.min(width, sweep <= 180 ? height * 1.5 : height) / 2 - thickness - effectsInset(effects) / 2;
  const start = 90 + (360 - sweep) / 2;
  const target = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(target, { duration: animation?.duration ?? 900, easing: Easing.out(Easing.cubic) });
  }, [target, animation?.duration, t]);
  const track = arcPath(cx, cy, r, start, sweep);
  const angle = useDerivedValue(() => ((start + sweep * t.value) * Math.PI) / 180);
  const tip = useDerivedValue(() =>
    vec(cx + Math.cos(angle.value) * (r - thickness), cy + Math.sin(angle.value) * (r - thickness)),
  );
  const stops = Array.isArray(gradient) ? { colors: gradient, positions: undefined } : gradient;
  const f = valueFont ?? font;
  const label = formatValue(value);
  return (
    <Canvas style={[{ width, height, backgroundColor }, style]}>
      <EffectsLayer effects={effects} width={width} height={height}>
        <Path path={track} style="stroke" strokeWidth={thickness} strokeCap="round" color={trackColor} />
        <Path
          path={track}
          style="stroke"
          strokeWidth={thickness}
          strokeCap="round"
          color={color}
          start={0}
          end={t}
        >
          {stops && stops.colors.length >= 2 ? (
            <SweepGradient
              c={vec(cx, cy)}
              colors={stops.colors}
              positions={stops.positions}
              start={start}
              end={start + sweep}
            />
          ) : null}
        </Path>
        {showNeedle ? (
          <Group>
            <Line p1={vec(cx, cy)} p2={tip} color={needleColor} strokeWidth={3} strokeCap="round" />
            <Circle cx={cx} cy={cy} r={6} color={needleColor} />
          </Group>
        ) : null}
        {f ? (
          <Text
            x={cx - f.measureText(label).width / 2}
            y={cy + r * 0.55}
            text={label}
            font={f}
            color={valueColor}
          />
        ) : null}
      </EffectsLayer>
    </Canvas>
  );
};
