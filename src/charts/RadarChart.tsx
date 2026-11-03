import React, { useMemo } from 'react';
import { EffectsLayer, effectsInset } from '../effects/EffectsLayer';
import { Canvas, Group, Line, Path, Skia, Text, vec } from 'react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { BaseChartProps, RadarSeries } from '../types';
import { useEntryProgress } from '../hooks/useEntryProgress';

export interface RadarChartProps extends Omit<BaseChartProps, 'padding'> {
  axes: string[];
  series: RadarSeries[];
  /** Max value on each axis (default: max over data). */
  max?: number;
  rings?: number;
  gridColor?: string;
  labelColor?: string;
}

/** Radar / spider chart. Polygons scale out from the center. */
export const RadarChart = ({
  effects,
  gradient,
  width,
  height,
  style,
  axes,
  series,
  max,
  rings = 4,
  gridColor = 'rgba(128,128,128,0.3)',
  labelColor = '#666',
  font,
  animation,
  backgroundColor,
}: RadarChartProps) => {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - (font ? 28 : 8) - effectsInset(effects) / 2;
  const n = axes.length;
  const m = max ?? Math.max(1, ...series.flatMap((s) => s.values));
  const angle = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const { grid, polys } = useMemo(() => {
    const g = Array.from({ length: rings }, (_, k) => {
      const p = Skia.PathBuilder.Make();
      const rr = (r * (k + 1)) / rings;
      for (let i = 0; i < n; i++) {
        const x = cx + Math.cos(angle(i)) * rr;
        const y = cy + Math.sin(angle(i)) * rr;
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
      p.close();
      return p.detach();
    });
    const ps = series.map((s) => {
      const p = Skia.PathBuilder.Make();
      s.values.forEach((v, i) => {
        const rr = (Math.min(v, m) / m) * r;
        const x = cx + Math.cos(angle(i)) * rr;
        const y = cy + Math.sin(angle(i)) * rr;
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      });
      p.close();
      return p.detach();
    });
    return { grid: g, polys: ps };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, rings, r, cx, cy, n, m]);
  const progress = useEntryProgress(animation, [polys]);
  const transform = useDerivedValue(() => [
    { translateX: cx },
    { translateY: cy },
    { scale: progress.value },
    { translateX: -cx },
    { translateY: -cy },
  ]);
  return (
    <Canvas style={[{ width, height, backgroundColor }, style]}>
      <EffectsLayer effects={effects} gradient={gradient} width={width} height={height}>
        {grid.map((p, i) => (
          <Path key={`g${i}`} path={p} style="stroke" color={gridColor} strokeWidth={1} />
        ))}
        {axes.map((a, i) => {
          const x = cx + Math.cos(angle(i)) * r;
          const y = cy + Math.sin(angle(i)) * r;
          const lx = cx + Math.cos(angle(i)) * (r + 14);
          const ly = cy + Math.sin(angle(i)) * (r + 14);
          return (
            <Group key={`a${i}`}>
              <Line p1={vec(cx, cy)} p2={vec(x, y)} color={gridColor} strokeWidth={1} />
              {font ? (
                <Text
                  x={lx - font.measureText(a).width / 2}
                  y={ly + font.getSize() / 3}
                  text={a}
                  font={font}
                  color={labelColor}
                />
              ) : null}
            </Group>
          );
        })}
        <Group transform={transform}>
          {polys.map((p, i) => (
            <Group key={`p${i}`}>
              <Path path={p} color={series[i]!.color} opacity={series[i]!.fillOpacity ?? 0.25} />
              <Path path={p} color={series[i]!.color} style="stroke" strokeWidth={2} strokeJoin="round" />
            </Group>
          ))}
        </Group>
      </EffectsLayer>
    </Canvas>
  );
};
