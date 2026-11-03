import React, { useMemo } from 'react';
import { EffectsLayer, effectsInset } from '../effects/EffectsLayer';
import { Canvas, Circle, Group } from 'react-native-skia';
import { useDerivedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import type { BaseChartProps, BubblePoint, ScatterPoint } from '../types';
import { resolvePadding } from '../utils/padding';
import { extent, linearScale, niceTicks } from '../utils/scale';
import { useEntryProgress } from '../hooks/useEntryProgress';
import { Grid } from './Grid';
import {
  ChartFrame,
  ZoomGroup,
  useHighlight,
  useSelection,
  type SelectableProps,
  type ZoomableProps,
} from '../interaction';
import { GestureDetector } from 'react-native-gesture-handler';

const Dot = ({
  x,
  y,
  r,
  color,
  opacity,
  progress,
  delay,
  index,
  selected,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  opacity: number;
  progress: SharedValue<number>;
  delay: number;
  index: number;
  selected: SharedValue<number>;
}) => {
  const hl = useHighlight(selected, index, 0.25);
  const grow = useDerivedValue(() => withTiming(selected.value === index ? 1.5 : 1, { duration: 200 }));
  const rr = useDerivedValue(
    () => r * grow.value * Math.min(1, Math.max(0, (progress.value - delay) / (1 - delay))),
  );
  const op = useDerivedValue(() => opacity * hl.value + (selected.value === index ? 1 - opacity : 0));
  return <Circle cx={x} cy={y} r={rr} color={color} opacity={op} />;
};

/** Scatter. Selection index = point index (nearest point to the touch). */
export interface ScatterChartProps extends BaseChartProps, SelectableProps, ZoomableProps {
  data: ScatterPoint[];
  /** Primary mark colour (hex). */
  color?: string;
  radius?: number;
  opacity?: number;
  /** Draw horizontal grid lines (axis labels also need `font`). */
  showGrid?: boolean;
  /** Formats y-axis labels, e.g. `(v) => "$" + v.toFixed(0)`. */
  formatY?: (v: number) => string;
}

/** Scatter plot: points pop in with a staggered scale. */
export const ScatterChart = ({
  data,
  color = '#0984E3',
  radius = 4,
  opacity = 0.85,
  showGrid = true,
  ...p
}: ScatterChartProps) => (
  <BubbleChart
    {...p}
    data={data.map((d) => ({ ...d, z: 1 }))}
    color={color}
    minRadius={radius}
    maxRadius={radius}
    opacity={opacity}
    showGrid={showGrid}
  />
);

/** Bubbles. Selection index = point index. */
export interface BubbleChartProps extends BaseChartProps, SelectableProps, ZoomableProps {
  data: BubblePoint[];
  /** Primary mark colour (hex). */
  color?: string;
  minRadius?: number;
  maxRadius?: number;
  opacity?: number;
  /** Draw horizontal grid lines (axis labels also need `font`). */
  showGrid?: boolean;
  /** Formats y-axis labels, e.g. `(v) => "$" + v.toFixed(0)`. */
  formatY?: (v: number) => string;
}

/** Bubble chart: third dimension `z` mapped to area. */
export const BubbleChart = (props: BubbleChartProps) => {
  const {
    effects,
    gradient,
    width,
    height,
    style,
    data,
    color = '#E17055',
    minRadius = 4,
    maxRadius = 24,
    opacity = 0.6,
    showGrid = true,
    font,
    formatY,
    animation,
    backgroundColor,
    padding,
  } = props;
  // Selected marks grow 1.5x, so keep that much room (plus shadow / glow) around the plot by default.
  const pad = resolvePadding(padding, Math.ceil(maxRadius * 1.5) + Math.max(4, effectsInset(effects)));
  if (font) pad.left = Math.max(pad.left, 36);
  const { dots, yS, ticks } = useMemo(() => {
    const xS = linearScale(extent(data.map((d) => d.x)), [pad.left, width - pad.right]);
    const yd = extent(data.map((d) => d.y));
    const ys = linearScale(yd, [height - pad.bottom, pad.top]);
    const zd = extent(data.map((d) => Math.sqrt(Math.max(0, d.z))));
    const zS = minRadius === maxRadius ? () => minRadius : linearScale(zd, [minRadius, maxRadius]);
    return {
      dots: data.map((d) => ({
        x: xS(d.x),
        y: ys(d.y),
        r: zS(Math.sqrt(Math.max(0, d.z))),
        color: d.color ?? color,
      })),
      yS: ys,
      ticks: niceTicks(yd, 4),
    };
  }, [data, width, height, pad.left, pad.right, pad.top, pad.bottom, minRadius, maxRadius, color]);
  const progress = useEntryProgress(animation ?? { duration: 800 }, [dots]);
  const xs = dots.map((d) => d.x);
  const ys = dots.map((d) => d.y);
  const rs = dots.map((d) => d.r);
  const { gesture, selected } = useSelection(props, (px, py) => {
    'worklet';
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < xs.length; i++) {
      const dx = (xs[i] as number) - px;
      const dy = (ys[i] as number) - py;
      const d = Math.sqrt(dx * dx + dy * dy) - (rs[i] as number);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return bd < 24 ? best : -1;
  });
  return (
    <ChartFrame zoom={props.zoom} width={width} height={height}>
      <GestureDetector gesture={gesture}>
        <Canvas style={[{ width, height, backgroundColor }, style]}>
          <ZoomGroup>
            {showGrid ? (
              <Grid
                width={width}
                height={height}
                padding={pad}
                yTicks={ticks}
                yScale={yS}
                font={font}
                formatY={formatY}
              />
            ) : null}
            <EffectsLayer effects={effects} gradient={gradient} width={width} height={height}>
              <Group>
                {dots.map((d, i) => (
                  <Dot
                    key={i}
                    {...d}
                    opacity={opacity}
                    progress={progress}
                    delay={(i / Math.max(1, dots.length)) * 0.5}
                    index={i}
                    selected={selected}
                  />
                ))}
              </Group>
            </EffectsLayer>
          </ZoomGroup>
        </Canvas>
      </GestureDetector>
    </ChartFrame>
  );
};
