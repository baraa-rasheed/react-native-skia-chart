/**
 * react-native-skia-chart: GPU charts for Expo / React Native (react-native-skia 3.8.0).
 *
 * Agents: read AGENTS.md (shipped with the package) or https://baraa-rasheed.github.io/react-native-skia-chart/docs/agents
 *   - `width` and `height` are required pixel numbers on every chart.
 *   - `gradient?: ChartGradient` and `effects?: ChartEffects` are optional on every chart.
 *   - Labels render only when a Skia `font` is passed.
 *
 * @example
 * import { LineChart } from 'react-native-skia-chart';
 * <LineChart data={[3, 7, 5, 9]} width={320} height={200} curve="monotone" interactive />
 */
// Skia API docs, examples & best practices: https://github.com/wcandillon/react-native-skia
// (installed from npm as react-native-skia)
export * from './types';
export { LineChart, AreaChart, Sparkline, normalize } from './charts/LineChart';
export type { LineChartProps, AreaChartProps, SparklineProps, LineSeries } from './charts/LineChart';
export { BarChart, StackedBarChart, Histogram } from './charts/BarChart';
export type { BarChartProps, StackedBarChartProps, HistogramProps } from './charts/BarChart';
export { PieChart, DonutChart } from './charts/PieChart';
export type { PieChartProps, DonutChartProps } from './charts/PieChart';
export { ScatterChart, BubbleChart } from './charts/ScatterChart';
export type { ScatterChartProps, BubbleChartProps } from './charts/ScatterChart';
export { RadarChart } from './charts/RadarChart';
export type { RadarChartProps } from './charts/RadarChart';
export { CandlestickChart, OHLCChart } from './charts/CandlestickChart';
export type { CandlestickChartProps, OHLCChartProps } from './charts/CandlestickChart';
export { HeatmapChart, lerpColor } from './charts/HeatmapChart';
export type { HeatmapChartProps } from './charts/HeatmapChart';
export { GaugeChart } from './charts/GaugeChart';
export type { GaugeChartProps } from './charts/GaugeChart';
export { ProgressRings, ProgressRing } from './charts/ProgressRings';
export type { ProgressRingsProps, ProgressRingProps } from './charts/ProgressRings';
export { StackedAreaChart } from './charts/StackedAreaChart';
export type { StackedAreaChartProps } from './charts/StackedAreaChart';
export { Grid } from './charts/Grid';
export type { GridProps } from './charts/Grid';
export { useEntryProgress } from './hooks/useEntryProgress';
export { usePathTransition } from './hooks/usePathTransition';
export { buildLinePath, buildAreaPath, buildBandPath, arcPath, slicePath } from './utils/path';
export { linearScale, extent, niceTicks } from './utils/scale';
export {
  ChartPathProvider,
  ChartPath,
  ChartDot,
  ChartYLabel,
  ChartXLabel,
  useChartData,
  monotoneCubicInterpolation,
} from './compat/AnimatedCharts';
export type { ChartData, ChartPathProps } from './compat/AnimatedCharts';
export { EffectsLayer, COLOR_MATRICES, effectsInset } from './effects/EffectsLayer';
export type {
  ChartEffects,
  ChartGradient,
  ChartBlendMode,
  ColorFilterPreset,
  ShaderPreset,
} from './effects/EffectsLayer';
export * from './interaction';
