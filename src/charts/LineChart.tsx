import type { ChartGradient } from '../effects/EffectsLayer';
import React, { useMemo } from 'react';
import { EffectsLayer } from '../effects/EffectsLayer';
import { View } from 'react-native';
import { Canvas, Circle, Group, Line, LinearGradient, Path, vec } from 'react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChartFrame, ZoomGroup, useToChart, type ZoomableProps } from '../interaction';

import {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { BaseChartProps, CurveType, DataPoint, Point } from '../types';
import { resolvePadding } from '../utils/padding';
import { extent, linearScale, niceTicks } from '../utils/scale';
import { buildAreaPath, buildLinePath, flatten } from '../utils/path';
import { useEntryProgress } from '../hooks/useEntryProgress';
import { usePathTransition } from '../hooks/usePathTransition';
import { Grid } from './Grid';

export interface LineSeries {
  data: number[] | DataPoint[];
  color: string;
  strokeWidth?: number;
  /** Fill under the line with a vertical gradient (turns it into an area chart). */
  fill?: boolean;
  fillOpacity?: number;
}

export interface LineChartProps extends BaseChartProps, ZoomableProps {
  /** How scrubbing starts: `'pan'` (touch-and-drag, default) or `'longPress'` (hold ~300 ms first; best inside scroll views / carousels). */
  scrubActivation?: 'pan' | 'longPress';

  /** Single series shorthand. */
  data?: number[] | DataPoint[];
  /** Primary mark colour (hex). */
  color?: string;
  strokeWidth?: number;
  /** Multiple series (overrides `data`). */
  series?: LineSeries[];
  curve?: CurveType;
  fill?: boolean;
  /** Draw horizontal grid lines (axis labels also need `font`). */
  showGrid?: boolean;
  gridTicks?: number;
  /** Formats y-axis labels, e.g. `(v) => "$" + v.toFixed(0)`. */
  formatY?: (v: number) => string;
  /** Fixed y domain. */
  yDomain?: [number, number];
  /** Enable press-and-drag scrubbing cursor (first series). */
  interactive?: boolean;
  cursorColor?: string;
  /** Fires (JS thread) as the user scrubs. `null` when released. */
  onScrub?: (point: DataPoint | null, index: number) => void;
  /** 'draw' strokes the path in; 'grow' rises from the baseline. */
  entry?: 'draw' | 'grow' | 'none';
}

export const normalize = (data: number[] | DataPoint[]): DataPoint[] =>
  data.length > 0 && typeof data[0] === 'number'
    ? (data as number[]).map((y, x) => ({ x, y }))
    : (data as DataPoint[]);

interface SeriesGeom {
  line: Point[];
  raw: DataPoint[];
}

const SeriesPath = ({
  pts,
  baseline,
  curve,
  color,
  strokeWidth,
  fill,
  fillOpacity,
  top,
  entry,
  progress,
  duration,
}: {
  pts: Point[];
  baseline: number;
  curve: CurveType;
  color: string;
  strokeWidth: number;
  fill: boolean;
  fillOpacity: number;
  top: number;
  entry: 'draw' | 'grow' | 'none';
  progress: ReturnType<typeof useEntryProgress>;
  duration: number;
}) => {
  const line = useMemo(() => buildLinePath(pts, curve), [pts, curve]);
  const flat = useMemo(() => buildLinePath(flatten(pts, baseline), curve), [pts, baseline, curve]);
  const area = useMemo(() => buildAreaPath(pts, baseline, curve), [pts, baseline, curve]);
  const flatArea = useMemo(
    () => buildAreaPath(flatten(pts, baseline), baseline, curve),
    [pts, baseline, curve],
  );
  const morphLine = usePathTransition(line, entry === 'grow' ? flat : line, duration);
  const morphArea = usePathTransition(area, entry === 'grow' ? flatArea : area, duration);
  const end = useDerivedValue(() => (entry === 'draw' ? progress.value : 1));
  const areaOpacity = useDerivedValue(() => progress.value * fillOpacity);
  return (
    <Group>
      {fill ? (
        <Path path={morphArea} opacity={areaOpacity}>
          {/* GPU: gradient evaluated in a Graphite fragment shader (Skia v3). */}
          <LinearGradient start={vec(0, top)} end={vec(0, baseline)} colors={[color, `${color}00`]} />
        </Path>
      ) : null}
      <Path
        path={morphLine}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeJoin="round"
        strokeCap="round"
        color={color}
        start={0}
        end={end}
      />
    </Group>
  );
};

/** Animated line / multi-line chart with optional gradient fill and scrubbing cursor. */
export const LineChart = (props: LineChartProps) => {
  const {
    width,
    height,
    style,
    animation,
    font,
    backgroundColor,
    data,
    color = '#6C5CE7',
    strokeWidth = 2.5,
    series,
    curve = 'monotone',
    fill = false,
    showGrid = true,
    gridTicks = 4,
    formatY,
    yDomain,
    interactive = true,
    scrubActivation = 'pan',
    zoom,
    cursorColor = '#999',
    onScrub,
    entry = 'draw',
  } = props;
  const pad = resolvePadding(props.padding, 16);
  if (font) pad.left = Math.max(pad.left, 36);
  const allSeries: LineSeries[] = useMemo(
    () => series ?? (data ? [{ data, color, strokeWidth, fill }] : []),
    [series, data, color, strokeWidth, fill],
  );
  const { geoms, yScale, ticks, baseline } = useMemo(() => {
    const norm = allSeries.map((s) => normalize(s.data));
    const xs = norm.flat().map((p) => p.x);
    const ys = norm.flat().map((p) => p.y);
    const xd = extent(xs);
    const yd = yDomain ? { min: yDomain[0], max: yDomain[1] } : extent(ys);
    const xS = linearScale(xd, [pad.left, width - pad.right]);
    const yS = linearScale(yd, [height - pad.bottom, pad.top]);
    const g: SeriesGeom[] = norm.map((raw) => ({ raw, line: raw.map((p) => ({ x: xS(p.x), y: yS(p.y) })) }));
    return { geoms: g, yScale: yS, ticks: niceTicks(yd, gridTicks), baseline: height - pad.bottom };
  }, [allSeries, width, height, pad.left, pad.right, pad.top, pad.bottom, yDomain, gridTicks]);

  // Replay the entry animation only when the shape of the data changes (series / point count).
  // Same-length updates (live data, range tweaks) morph smoothly via usePathTransition instead of redrawing.
  const shape = geoms.map((g) => g.line.length).join(',');
  const progress = useEntryProgress(animation, [shape]);
  const duration = animation?.duration ?? 600;

  // ----- scrubbing (UI thread) -----
  const first = geoms[0];
  const pxs = useMemo(() => first?.line.map((p) => p.x) ?? [], [first]);
  const pys = useMemo(() => first?.line.map((p) => p.y) ?? [], [first]);
  const active = useSharedValue(0);
  const index = useSharedValue(-1);
  // Last scrubbed index: kept while the cursor fades out so it doesn't jump on release.
  const shown = useSharedValue(-1);
  const findIndex = (x: number) => {
    'worklet';
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < pxs.length; i++) {
      const d = Math.abs((pxs[i] as number) - x);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best;
  };
  const emit = (i: number) => {
    if (!onScrub) return;
    const raw = first?.raw[i];
    onScrub(i >= 0 && raw ? raw : null, i);
  };
  useAnimatedReaction(
    () => index.value,
    (i, prev) => {
      if (i !== prev && onScrub) runOnJS(emit)(i);
    },
  );
  const toChart = useToChart();
  const gesture = Gesture.Pan()
    .maxPointers(1)
    .activateAfterLongPress(scrubActivation === 'longPress' ? 300 : 0)
    .enabled(interactive && pxs.length > 0)
    .minDistance(0)
    .shouldCancelWhenOutside(false)
    .onStart((e) => {
      const i = findIndex(toChart(e.x, e.y)[0]);
      shown.value = i;
      index.value = i;
      active.value = withTiming(1, { duration: 120 });
    })
    .onUpdate((e) => {
      const i = findIndex(toChart(e.x, e.y)[0]);
      shown.value = i;
      index.value = i;
    })
    .onFinalize(() => {
      active.value = withTiming(0, { duration: 160 });
      index.value = -1;
    });
  const cx = useDerivedValue(() => (shown.value >= 0 ? (pxs[shown.value] ?? 0) : (pxs[pxs.length - 1] ?? 0)));
  const cy = useDerivedValue(() => (shown.value >= 0 ? (pys[shown.value] ?? 0) : (pys[pys.length - 1] ?? 0)));
  const p1 = useDerivedValue(() => vec(cx.value, pad.top));
  const p2 = useDerivedValue(() => vec(cx.value, height - pad.bottom));

  return (
    <ChartFrame zoom={zoom} width={width} height={height}>
      <View style={[{ width, height }, style]}>
        <GestureDetector gesture={gesture}>
          <Canvas style={{ width, height, backgroundColor }}>
            <ZoomGroup>
              {showGrid ? (
                <Grid
                  width={width}
                  height={height}
                  padding={pad}
                  yTicks={ticks}
                  yScale={yScale}
                  font={font}
                  formatY={formatY}
                />
              ) : null}
              <EffectsLayer effects={props.effects} gradient={props.gradient} width={width} height={height}>
                {geoms.map((g, i) => {
                  const s = allSeries[i]!;
                  return (
                    <SeriesPath
                      key={i}
                      pts={g.line}
                      baseline={baseline}
                      curve={curve}
                      color={s.color}
                      strokeWidth={s.strokeWidth ?? strokeWidth}
                      fill={s.fill ?? fill}
                      fillOpacity={s.fillOpacity ?? 0.35}
                      top={pad.top}
                      entry={entry}
                      progress={progress}
                      duration={duration}
                    />
                  );
                })}
                {interactive ? (
                  <Group opacity={active}>
                    <Line p1={p1} p2={p2} color={cursorColor} strokeWidth={1} />
                    <Circle cx={cx} cy={cy} r={8} color={`${allSeries[0]?.color ?? color}55`} />
                    <Circle cx={cx} cy={cy} r={4.5} color={allSeries[0]?.color ?? color} />
                  </Group>
                ) : null}
              </EffectsLayer>
            </ZoomGroup>
          </Canvas>
        </GestureDetector>
      </View>
    </ChartFrame>
  );
};

export type AreaChartProps = Omit<LineChartProps, 'fill'>;
/** Line chart with gradient fill. */
export const AreaChart = (props: AreaChartProps) => <LineChart entry="grow" {...props} fill />;

export interface SparklineProps {
  width: number;
  height: number;
  data: number[];
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
  gradient?: ChartGradient;
}
/** Minimal inline trend line: no grid, no gestures. */
export const Sparkline = ({ fill = false, ...p }: SparklineProps) => (
  <LineChart {...p} fill={fill} padding={3} showGrid={false} interactive={false} />
);
