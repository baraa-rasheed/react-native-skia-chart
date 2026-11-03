import React, { useEffect, useMemo } from 'react';
import {
  Blur,
  BlurMask,
  ColorMatrix,
  CornerPathEffect,
  DashPathEffect,
  Fill,
  Group,
  LinearGradient,
  Paint,
  RadialGradient,
  Rect,
  Shader,
  Shadow,
  Skia,
  SweepGradient,
  rect,
  useClock,
  vec,
  type SkRuntimeEffect,
} from 'react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

/** 4x5 colour matrices for the built-in colour-filter presets (GPU colour filter). */
export const COLOR_MATRICES = {
  none: null,
  grayscale: [
    0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0, 0, 0, 1, 0,
  ],
  sepia: [0.393, 0.769, 0.189, 0, 0, 0.349, 0.686, 0.168, 0, 0, 0.272, 0.534, 0.131, 0, 0, 0, 0, 0, 1, 0],
  invert: [-1, 0, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 0, 1, 0],
  saturate: [1.6, -0.3, -0.3, 0, 0, -0.3, 1.6, -0.3, 0, 0, -0.3, -0.3, 1.6, 0, 0, 0, 0, 0, 1, 0],
} as const;
export type ColorFilterPreset = keyof typeof COLOR_MATRICES;

export type ChartBlendMode =
  | 'srcOver'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'colorDodge'
  | 'colorBurn'
  | 'hardLight'
  | 'softLight'
  | 'difference'
  | 'exclusion'
  | 'plus'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

/** Built-in SkSL runtime shaders, composited over the chart with `srcATop` so they only tint drawn pixels. */
export type ShaderPreset = 'none' | 'shimmer' | 'aurora' | 'scanlines';

/**
 * GPU gradient applied to a chart's marks (lines, areas, bars, slices, dots…).
 * Coordinates are fractions of the chart size (0..1), so the same gradient works at any size.
 */
export interface ChartGradient {
  /** `'linear'` (default), `'radial'` or `'sweep'` (angular, great for gauges, rings and pies). */
  type?: 'linear' | 'radial' | 'sweep';
  /** Two or more colour stops. */
  colors: string[];
  /** Optional stop positions in 0..1, same length as `colors`. */
  positions?: number[];
  /** Linear start point, default `[0.5, 0]` (top). */
  start?: [number, number];
  /** Linear end point, default `[0.5, 1]` (bottom). */
  end?: [number, number];
  /** Radial / sweep centre, default `[0.5, 0.5]`. */
  center?: [number, number];
  /** Radial radius as a fraction of half the larger side, default `1`. */
  radius?: number;
  /**
   * `'tint'` (default) replaces the marks' colour with the gradient but keeps their alpha (`srcIn`),
   * so area fades and opacity are preserved. `'overlay'` blends the gradient on top (`srcATop`) at `opacity`.
   */
  mode?: 'tint' | 'overlay';
  /** Overlay opacity (only for `mode: 'overlay'`), default `0.6`. */
  opacity?: number;
}

const GradientShader = ({ g, width, height }: { g: ChartGradient; width: number; height: number }) => {
  const [cx, cy] = g.center ?? [0.5, 0.5];
  const c = vec(cx * width, cy * height);
  if (g.type === 'radial') {
    return (
      <RadialGradient
        c={c}
        r={((g.radius ?? 1) * Math.max(width, height)) / 2}
        colors={g.colors}
        positions={g.positions}
      />
    );
  }
  if (g.type === 'sweep') return <SweepGradient c={c} colors={g.colors} positions={g.positions} />;
  const [sx, sy] = g.start ?? [0.5, 0];
  const [ex, ey] = g.end ?? [0.5, 1];
  return (
    <LinearGradient
      start={vec(sx * width, sy * height)}
      end={vec(ex * width, ey * height)}
      colors={g.colors}
      positions={g.positions}
    />
  );
};

export interface ChartEffects {
  /** Drop shadow image filter on the whole chart layer. */
  shadow?: { dx?: number; dy?: number; blur?: number; color?: string } | boolean;
  /** Neon glow: a blurred copy (BlurMask) drawn under the chart. Value = sigma. */
  glow?: number;
  /** Gaussian blur image filter on the chart layer (e.g. for a "loading" state). */
  blur?: number;
  /** Colour filter preset or a custom 4x5 colour matrix. */
  colorFilter?: ColorFilterPreset | number[];
  /** Blend mode used when compositing the chart layer onto the canvas. */
  blendMode?: ChartBlendMode;
  /** Dashed strokes/fills: DashPathEffect intervals, e.g. [8, 4]. */
  dash?: number[];
  /** Round sharp path corners with CornerPathEffect (radius in px). */
  cornerRadius?: number;
  /** Clip-path reveal animation from left to right on mount/data change (ms, 0 = off). */
  clipReveal?: number;
  /** Animated SkSL runtime shader overlay. */
  shader?: ShaderPreset;
}

/**
 * Pixels a chart should keep clear around its marks so the drop shadow / glow is not cut off at the canvas edge.
 * Radial charts subtract this from their radius; axis charts already have room in their default padding.
 */
export const effectsInset = (e?: ChartEffects): number => {
  if (!e) return 0;
  const s = e.shadow === true ? {} : e.shadow || null;
  const shadow = s ? (s.blur ?? 8) * 2 + Math.max(Math.abs(s.dx ?? 0), Math.abs(s.dy ?? 6)) : 0;
  const glow = e.glow ? e.glow * 2 : 0;
  return Math.ceil(Math.max(shadow, glow));
};

const SHADERS: Record<Exclude<ShaderPreset, 'none'>, string> = {
  shimmer: `uniform float t; uniform float2 size;
half4 main(float2 p){ float x = p.x / size.x - fract(t * 0.35) * 2.0 + 0.5; float a = smoothstep(0.25, 0.0, abs(x)) * 0.65; return half4(a, a, a, a); }`,
  aurora: `uniform float t; uniform float2 size;
half4 main(float2 p){ float2 uv = p / size; float r = 0.5 + 0.5 * sin(t + uv.x * 6.0); float g = 0.5 + 0.5 * sin(t * 1.3 + uv.y * 5.0 + 2.0); float b = 0.5 + 0.5 * sin(t * 0.7 + (uv.x + uv.y) * 4.0 + 4.0); return half4(r, g, b, 1.0) * 0.55; }`,
  scanlines: `uniform float t; uniform float2 size;
half4 main(float2 p){ float l = step(0.5, fract((p.y + t * 20.0) / 4.0)) * 0.35; return half4(0.0, 0.0, 0.0, l); }`,
};
const compiled: Partial<Record<string, SkRuntimeEffect | null>> = {};
const getEffect = (k: Exclude<ShaderPreset, 'none'>): SkRuntimeEffect | null => {
  if (!(k in compiled)) compiled[k] = Skia.RuntimeEffect.Make(SHADERS[k]);
  return compiled[k] ?? null;
};

const ShaderOverlay = ({
  preset,
  width,
  height,
}: {
  preset: Exclude<ShaderPreset, 'none'>;
  width: number;
  height: number;
}) => {
  const source = getEffect(preset);
  const clock = useClock();
  const uniforms = useDerivedValue(() => ({ t: clock.value / 1000, size: [width, height] }));
  if (!source) return null;
  return (
    <Fill blendMode="srcATop">
      <Shader source={source} uniforms={uniforms} />
    </Fill>
  );
};

/**
 * Wraps chart content inside a `<Canvas>` and applies optional Skia effects.
 * Everything here runs on the GPU (Graphite): image filters, colour filters, blend modes, path effects,
 * clipping and the offscreen layer (`<Group layer>` = saveLayer into a GPU render target).
 */
export const EffectsLayer = ({
  effects,
  gradient,
  width,
  height,
  children,
  revealKey,
}: {
  effects?: ChartEffects;
  gradient?: ChartGradient;
  width: number;
  height: number;
  children: React.ReactNode;
  revealKey?: unknown;
}) => {
  const e = effects ?? {};
  const reveal = useSharedValue(e.clipReveal ? 0 : 1);
  useEffect(() => {
    if (!e.clipReveal) {
      reveal.value = 1;
      return;
    }
    reveal.value = 0;
    reveal.value = withTiming(1, { duration: e.clipReveal, easing: Easing.out(Easing.cubic) });
  }, [e.clipReveal, revealKey, reveal]);
  const clip = useDerivedValue(() => rect(0, 0, width * reveal.value, height));

  const shadow = e.shadow === true ? {} : e.shadow || null;
  const matrix = typeof e.colorFilter === 'string' ? COLOR_MATRICES[e.colorFilter] : (e.colorFilter ?? null);
  const needsLayer = !!(
    shadow ||
    e.blur ||
    matrix ||
    e.blendMode ||
    (e.shader && e.shader !== 'none') ||
    (gradient && gradient.colors.length >= 2)
  );
  const layer = useMemo(
    () =>
      needsLayer ? (
        <Paint blendMode={e.blendMode}>
          {e.blur ? <Blur blur={e.blur} /> : null}
          {shadow ? (
            <Shadow
              dx={shadow.dx ?? 0}
              dy={shadow.dy ?? 6}
              blur={shadow.blur ?? 8}
              color={shadow.color ?? 'rgba(0,0,0,0.35)'}
            />
          ) : null}
          {matrix ? <ColorMatrix matrix={[...matrix]} /> : null}
        </Paint>
      ) : undefined,
    [needsLayer, e.blendMode, e.blur, shadow?.dx, shadow?.dy, shadow?.blur, shadow?.color, matrix],
  );

  const pathEffects = (
    <>
      {e.dash && e.dash.length >= 2 ? <DashPathEffect intervals={e.dash} /> : null}
      {e.cornerRadius ? <CornerPathEffect r={e.cornerRadius} /> : null}
    </>
  );

  return (
    <Group clip={e.clipReveal ? clip : undefined}>
      <Group layer={layer}>
        {e.glow ? (
          <Group opacity={0.9}>
            <BlurMask blur={e.glow} style="normal" />
            {pathEffects}
            {children}
          </Group>
        ) : null}
        <Group>
          {pathEffects}
          {children}
        </Group>
        {gradient && gradient.colors.length >= 2 ? (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            blendMode={gradient.mode === 'overlay' ? 'srcATop' : 'srcIn'}
            opacity={gradient.mode === 'overlay' ? (gradient.opacity ?? 0.6) : 1}
          >
            <GradientShader g={gradient} width={width} height={height} />
          </Rect>
        ) : null}
        {e.shader && e.shader !== 'none' ? (
          <ShaderOverlay preset={e.shader} width={width} height={height} />
        ) : null}
      </Group>
    </Group>
  );
};
