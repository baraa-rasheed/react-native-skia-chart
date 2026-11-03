import React, { useEffect } from 'react';
import { EffectsLayer, effectsInset } from '../effects/EffectsLayer';
import { Canvas, Group, Path } from 'react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { BaseChartProps, RingData } from '../types';
import { arcPath } from '../utils/path';
import {
  ChartFrame,
  ZoomGroup,
  useHighlight,
  useSelection,
  type SelectableProps,
  type ZoomableProps,
} from '../interaction';
import { GestureDetector } from 'react-native-gesture-handler';

/** Rings. Selection index = ring index (outer = 0). */
export interface ProgressRingsProps extends Omit<BaseChartProps, 'padding'>, SelectableProps {
  /** Outer → inner rings. `progress` in 0..1 (values >1 wrap visually up to 1). */
  data: RingData[];
  thickness?: number;
  gap?: number;
  trackOpacity?: number;
}

const Ring = ({
  cx,
  cy,
  r,
  thickness,
  ring,
  index,
  duration,
  trackOpacity,
  selected,
}: {
  cx: number;
  cy: number;
  r: number;
  thickness: number;
  ring: RingData;
  index: number;
  duration: number;
  trackOpacity: number;
  selected: SharedValue<number>;
}) => {
  const opacity = useHighlight(selected, index, 0.3);
  const sw = useDerivedValue(() =>
    withTiming(selected.value === index ? thickness * 1.2 : thickness, { duration: 200 }),
  );
  const end = useSharedValue(0);
  useEffect(() => {
    end.value = withDelay(
      index * 120,
      withTiming(Math.min(1, Math.max(0, ring.progress)), { duration, easing: Easing.out(Easing.exp) }),
    );
  }, [ring.progress, index, duration, end]);
  const path = arcPath(cx, cy, r, -90, 359.99);
  return (
    <Group opacity={opacity}>
      <Path
        path={path}
        style="stroke"
        strokeWidth={sw}
        color={ring.backgroundColor ?? ring.color}
        opacity={ring.backgroundColor ? 1 : trackOpacity}
      />
      <Path
        path={path}
        style="stroke"
        strokeWidth={sw}
        strokeCap="round"
        color={ring.color}
        start={0}
        end={end}
      />
    </Group>
  );
};

/** Apple-Activity-style concentric progress rings. */
export const ProgressRings = (props: ProgressRingsProps) => {
  const {
    effects,
    gradient,
    width,
    height,
    style,
    data,
    thickness = 18,
    gap = 4,
    trackOpacity = 0.2,
    animation,
    backgroundColor,
  } = props;
  const cx = width / 2;
  const cy = height / 2;
  const outer = Math.min(width, height) / 2 - thickness / 2 - effectsInset(effects);
  const n = data.length;
  const { gesture, selected } = useSelection(props, (px, py) => {
    'worklet';
    const d = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    const i = Math.round((outer - d) / (thickness + gap));
    return i >= 0 && i < n && Math.abs(outer - i * (thickness + gap) - d) <= thickness / 2 + gap ? i : -1;
  });
  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={[{ width, height, backgroundColor }, style]}>
        <EffectsLayer effects={effects} gradient={gradient} width={width} height={height}>
          {data.map((ring, i) => (
            <Ring
              key={i}
              cx={cx}
              cy={cy}
              r={outer - i * (thickness + gap)}
              thickness={thickness}
              ring={ring}
              index={i}
              duration={animation?.duration ?? 1000}
              trackOpacity={trackOpacity}
              selected={selected}
            />
          ))}
        </EffectsLayer>
      </Canvas>
    </GestureDetector>
  );
};

export type ProgressRingProps = Omit<ProgressRingsProps, 'data'> & RingData;
/** Single progress ring. */
export const ProgressRing = ({ progress, color, backgroundColor: bg, label, ...p }: ProgressRingProps) => (
  <ProgressRings {...p} data={[{ progress, color, backgroundColor: bg, label }]} />
);
