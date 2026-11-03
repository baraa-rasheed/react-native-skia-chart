<p align="center">
  <img src="website/static/img/logo.svg" width="96" alt="" />
</p>

<h1 align="center">react-native-skia-chart</h1>

<p align="center">
  GPU-rendered, animated charts for React Native and Expo, built on <a href="https://github.com/wcandillon/react-native-skia">React Native Skia</a> and Reanimated.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-skia-chart"><img src="https://img.shields.io/npm/v/react-native-skia-chart.svg" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license" /></a>
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey.svg" alt="iOS and Android" />
</p>

<p align="center">
  <a href="https://baraa-rasheed.github.io/react-native-skia-chart/"><b>Documentation</b></a> ·
  <a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/api">API reference</a> ·
  <a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/agents">Agent guide</a> ·
  <a href="example">Example app</a>
</p>

<p align="center">
  <img src="website/static/img/readme/screens.png" alt="The example app: chart gallery, candlestick and donut playgrounds, and finance and fitness showcase screens" />
</p>

## Overview

`react-native-skia-chart` draws every mark (lines, bars, slices, candles, cells) with Skia on the GPU. Entry animations, data transitions and gestures run on the UI thread with Reanimated worklets and Gesture Handler, so scrubbing and zooming don't re-render React on every frame.

- **15 chart types, 18 components:** line, area, sparkline, bar, stacked bar, histogram, stacked area, pie, donut, scatter, bubble, radar, candlestick, OHLC, heatmap, gauge and progress rings.
- **Touch:** scrub with a cursor or crosshair, tap or long-press to select, and pinch, pan or double-tap to zoom.
- **Styling:** linear, radial and sweep gradients, plus shadows, glow, blur, colour filters, blend modes, dashes and SkSL shaders through a single `effects` prop.
- **Predictable API:** pixel `width` and `height`, plain-array data and hex colours on every chart, with the same option names across chart types.

## See it in action

<table>
  <tr>
    <td align="center" width="25%"><img src="website/static/img/readme/scrub.gif" width="200" alt="Scrubbing a candlestick chart with a crosshair" /><br /><sub>Scrub with a crosshair</sub></td>
    <td align="center" width="25%"><img src="website/static/img/readme/customize.gif" width="200" alt="Changing colour, gradient, glow, shader and live data on a line chart" /><br /><sub>Gradients, glow, shaders, live data</sub></td>
    <td align="center" width="25%"><img src="website/static/img/readme/select.gif" width="200" alt="Tapping donut slices to select them" /><br /><sub>Tap to select</sub></td>
    <td align="center" width="25%"><img src="website/static/img/readme/showcase.gif" width="200" alt="Finance and fitness screens built with the library" /><br /><sub>Real-world screens</sub></td>
  </tr>
</table>

## Installation

```sh
npx expo install react-native-skia-chart react-native-skia react-native-reanimated react-native-worklets react-native-gesture-handler
```

| Peer dependency | Version |
| --- | --- |
| `react` | ≥ 19 |
| `react-native` | ≥ 0.79 |
| `react-native-skia` | ≥ 3.8 |
| `react-native-reanimated` | ≥ 4.0 |
| `react-native-worklets` | ≥ 0.7 |
| `react-native-gesture-handler` | ≥ 2.20 |

The library needs a [development build](https://docs.expo.dev/develop/development-builds/introduction/); it doesn't run in Expo Go. Wrap your app in `GestureHandlerRootView` so charts can receive touches. The example app builds with Android `minSdkVersion` 26.

## Quick start

```tsx
import { useState } from 'react';
import { Platform, Text, View, useWindowDimensions } from 'react-native';
import { matchFont } from 'react-native-skia';
import { LineChart } from 'react-native-skia-chart';

// Axis labels are drawn only when you pass a Skia font.
const font = matchFont({ fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }), fontSize: 11 });

export function PriceChart({ prices }: { prices: number[] }) {
  const { width } = useWindowDimensions();
  const [price, setPrice] = useState<number | null>(null);

  return (
    <View>
      <Text>{price === null ? 'Drag to inspect' : `$${price.toFixed(2)}`}</Text>
      <LineChart
        data={prices}
        width={width - 32}
        height={220}
        font={font}
        formatY={(v) => `$${v.toFixed(0)}`}
        gradient={{ type: 'linear', colors: ['#8B7CFF', '#00E0C6'], start: [0, 0], end: [1, 0] }}
        onScrub={(point) => setPrice(point ? point.y : null)}
      />
    </View>
  );
}
```

Each chart renders its own Skia `Canvas`, so don't wrap charts in another `Canvas`.

## Charts

Every image below is a screenshot from the [example app](example). Select a chart to open its documentation.

<table>
  <tr>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/line"><img src="website/static/img/charts/line.png" width="260" alt="Line chart" /></a><br /><b>Line</b><br /><sub><code>LineChart</code></sub></td>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/area"><img src="website/static/img/charts/area.png" width="260" alt="Area & Sparkline chart" /></a><br /><b>Area &amp; Sparkline</b><br /><sub><code>AreaChart · Sparkline</code></sub></td>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/bar"><img src="website/static/img/charts/bar.png" width="260" alt="Bar chart" /></a><br /><b>Bar</b><br /><sub><code>BarChart</code></sub></td>
  </tr>
  <tr>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/stacked-bar"><img src="website/static/img/charts/stacked-bar.png" width="260" alt="Stacked bar chart" /></a><br /><b>Stacked bar</b><br /><sub><code>StackedBarChart</code></sub></td>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/histogram"><img src="website/static/img/charts/histogram.png" width="260" alt="Histogram chart" /></a><br /><b>Histogram</b><br /><sub><code>Histogram</code></sub></td>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/stacked-area"><img src="website/static/img/charts/stacked-area.png" width="260" alt="Stacked area chart" /></a><br /><b>Stacked area</b><br /><sub><code>StackedAreaChart</code></sub></td>
  </tr>
  <tr>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/pie-donut"><img src="website/static/img/charts/pie-donut.png" width="260" alt="Pie & Donut chart" /></a><br /><b>Pie &amp; Donut</b><br /><sub><code>PieChart · DonutChart</code></sub></td>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/scatter"><img src="website/static/img/charts/scatter.png" width="260" alt="Scatter chart" /></a><br /><b>Scatter</b><br /><sub><code>ScatterChart</code></sub></td>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/bubble"><img src="website/static/img/charts/bubble.png" width="260" alt="Bubble chart" /></a><br /><b>Bubble</b><br /><sub><code>BubbleChart</code></sub></td>
  </tr>
  <tr>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/radar"><img src="website/static/img/charts/radar.png" width="260" alt="Radar chart" /></a><br /><b>Radar</b><br /><sub><code>RadarChart</code></sub></td>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/candlestick"><img src="website/static/img/charts/candlestick.png" width="260" alt="Candlestick & OHLC chart" /></a><br /><b>Candlestick &amp; OHLC</b><br /><sub><code>CandlestickChart · OHLCChart</code></sub></td>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/heatmap"><img src="website/static/img/charts/heatmap.png" width="260" alt="Heatmap chart" /></a><br /><b>Heatmap</b><br /><sub><code>HeatmapChart</code></sub></td>
  </tr>
  <tr>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/gauge"><img src="website/static/img/charts/gauge.png" width="260" alt="Gauge chart" /></a><br /><b>Gauge</b><br /><sub><code>GaugeChart</code></sub></td>
    <td align="center" width="33%"><a href="https://baraa-rasheed.github.io/react-native-skia-chart/docs/charts/progress-rings"><img src="website/static/img/charts/progress-rings.png" width="260" alt="Progress rings chart" /></a><br /><b>Progress rings</b><br /><sub><code>ProgressRings · ProgressRing</code></sub></td>
  </tr>
</table>

## API

The tables below cover the most-used props. See the [API reference](https://baraa-rasheed.github.io/react-native-skia-chart/docs/api) for the full list.

### Common props

Shared by every chart unless noted.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `number` | required | Canvas width in pixels. Use `useWindowDimensions()` or `onLayout`; percentages aren't supported. |
| `height` | `number` | required | Canvas height in pixels. |
| `padding` | `number \| Partial<Padding>` | `16` | Inner padding. Not available on Pie/Donut, Progress rings, Radar and Gauge. |
| `animation` | `{ duration?, delay? }` | chart-specific | Entry and update animation in ms. `{ duration: 0 }` disables it. |
| `font` | `SkFont \| null` | none | Skia font for axis, centre and value labels. Without it, labels are skipped. |
| `gradient` | `ChartGradient` | none | GPU gradient applied to the marks. `GaugeChart` also accepts plain colour stops and always draws a sweep along the dial. |
| `effects` | `ChartEffects` | none | Shadow, glow, blur, filters and shaders. Not available on `Sparkline`. |
| `backgroundColor` | `string` | transparent | Canvas background. |
| `style` | `StyleProp<ViewStyle>` | none | Style for the canvas view, for margins and positioning. |

Charts with axes (line, area, bar, stacked bar, histogram, stacked area, scatter, bubble, candlestick) also accept `showGrid` (default `true`) and `formatY(value) => string`. On dark backgrounds, set `centerLabelColor` (Pie/Donut), `valueColor` and `needleColor` (Gauge) and `labelColor` (Radar, Heatmap): their defaults are dark.

### Interaction

| Prop | Charts | Default | Description |
| --- | --- | --- | --- |
| `interactive` | Line, Area, Candlestick, OHLC | `true` | Drag to move a cursor or crosshair. |
| `onScrub` | Line, Area, Candlestick, OHLC | none | `(point \| null, index) => void`, called on the JS thread when the index changes and with `null` on release. |
| `scrubActivation` | Line, Area, Candlestick, OHLC | `'pan'` | Use `'longPress'` inside scroll views so swipes still scroll. |
| `selectable` | Bar, Stacked bar, Histogram, Pie, Donut, Scatter, Bubble, Heatmap, Progress rings | `false` | Tap a mark to select it, tap again to clear. Other marks dim. |
| `selectedIndex` / `onSelect` | Same as `selectable` | none | Controlled selection. `onSelect(index \| null)` runs on the JS thread. |
| `zoom` | Line, Area, Candlestick, OHLC, Bar, Stacked bar, Histogram, Stacked area, Scatter, Bubble, Heatmap | off | `true` or `{ min, max, doubleTap }`. Pinch to zoom, two-finger pan, double-tap to toggle 2x. |

On iOS 26, React Navigation's native stack enables a full-screen back swipe that can interrupt pinch and pan. See [Native stack on iOS 26](https://baraa-rasheed.github.io/react-native-skia-chart/docs/interaction) for the one-line fix.

### Gradient

`gradient?: ChartGradient`. [Gradient docs](https://baraa-rasheed.github.io/react-native-skia-chart/docs/gradients).

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `'linear' \| 'radial' \| 'sweep'` | `'linear'` | Gradient shape. |
| `colors` | `string[]` | required | Two or more colour stops. |
| `positions` | `number[]` | even | Stop positions from 0 to 1. |
| `start` / `end` | `[x, y]` | `[0.5, 0]` / `[0.5, 1]` | Linear direction, as fractions of the chart size. |
| `center` / `radius` | `[x, y]` / `number` | `[0.5, 0.5]` / `1` | Radial and sweep centre; radial radius. |
| `mode` | `'tint' \| 'overlay'` | `'tint'` | `tint` recolours the marks and keeps their alpha; `overlay` blends on top at `opacity`. |

### Effects

`effects?: ChartEffects`. Every option is optional and they combine freely. [Effects docs](https://baraa-rasheed.github.io/react-native-skia-chart/docs/effects).

| Field | Type | Description |
| --- | --- | --- |
| `shadow` | `boolean \| { dx, dy, blur, color }` | Drop shadow on the chart layer. |
| `glow` | `number` | Neon glow; the value is the blur sigma. |
| `blur` | `number` | Gaussian blur, for example for a loading state. |
| `colorFilter` | `'none' \| 'grayscale' \| 'sepia' \| 'invert' \| 'saturate' \| number[]` | Preset or a custom 4×5 colour matrix. |
| `blendMode` | `ChartBlendMode` | Blend mode used to composite the chart layer. |
| `dash` | `number[]` | Dash intervals for strokes and fills, for example `[8, 4]`. |
| `cornerRadius` | `number` | Rounds sharp path corners. |
| `clipReveal` | `number` | Left-to-right reveal on mount and data change, in ms. |
| `shader` | `'none' \| 'shimmer' \| 'aurora' \| 'scanlines'` | Animated SkSL shader overlay. |

### Chart-specific props

| Component | Data | Key props (defaults) |
| --- | --- | --- |
| `LineChart` | `data: number[] \| {x, y}[]` or `series: LineSeries[]` | `color`, `strokeWidth` (2.5), `curve` (`'monotone'`, `'linear'`, `'step'`), `fill`, `gridTicks` (4), `yDomain`, `cursorColor`, `entry` (`'draw'`, `'grow'`, `'none'`) |
| `AreaChart` | Same as `LineChart` | All `LineChart` props; the fill is always on. |
| `Sparkline` | `data: number[]` | `color`, `strokeWidth`, `fill`, `gradient`. No axes, gestures or effects. |
| `BarChart` | `data: number[]` or `series: BarSeries[]` | `color`, `horizontal`, `stacked`, `labels`, `barWidthRatio` (0.7), `radius` (4), `stagger` (0.4) |
| `StackedBarChart` | `series: BarSeries[]` | All `BarChart` props. |
| `Histogram` | `values: number[]` | `bins` (10) plus `BarChart` props. |
| `StackedAreaChart` | `series: { data, color, label? }[]` | `percent`, `curve`, `fillOpacity` (0.85) |
| `PieChart` / `DonutChart` | `data: { value, color, label? }[]` | `innerRadius` (Pie), `thickness` (Donut, 0.4), `padAngle`, `startAngle` (-90), `centerLabel`, `centerFont`, `centerLabelColor` |
| `ScatterChart` | `data: { x, y, color? }[]` | `color`, `radius` (4), `opacity` (0.85) |
| `BubbleChart` | `data: { x, y, z, color? }[]` | `color`, `minRadius` (4), `maxRadius` (24), `opacity` (0.6) |
| `RadarChart` | `axes: string[]`, `series: { values, color }[]` | `max`, `rings` (4), `gridColor`, `labelColor` |
| `CandlestickChart` / `OHLCChart` | `data: { x, open, high, low, close }[]` | `positiveColor`, `negativeColor`; `onScrub` receives the candle. |
| `HeatmapChart` | `data: number[][]` (row-major) | `colors` (2 or 3 stops), `gap` (2), `radius` (2), `rowLabels`, `columnLabels`, `labelColor` |
| `GaugeChart` | `value: number` | `min` (0), `max` (100), `sweep` (240), `thickness` (16), `color`, `gradient` (colour stops), `trackColor`, `showNeedle`, `needleColor`, `formatValue`, `valueFont`, `valueColor` |
| `ProgressRings` / `ProgressRing` | `data: { progress, color }[]` / `progress`, `color` | `thickness` (18), `gap` (4), `trackOpacity` (0.2). `progress` is 0 to 1. |

For custom charts, the package also exports `ChartFrame`, `ZoomGroup`, `useSelection`, `useHighlight`, `useEntryProgress`, `usePathTransition`, the path builders and scale helpers. Coming from `@rainbow-me/react-native-animated-charts`? See the [migration guide](https://baraa-rasheed.github.io/react-native-skia-chart/docs/migration).

## Example app

[`example/`](example) is an Expo app that shows every chart:

- **Gallery:** every chart type as a live preview, grouped by purpose.
- **Playground:** tap a chart to scrub, select and zoom it, and change its colours, gradient, data, gestures and GPU effects.
- **Showcase:** finance and fitness screens built from the same components.

```sh
cd example && npm install && npx expo run:ios   # or run:android
```

## Using with AI coding agents

- [`AGENTS.md`](AGENTS.md) covers which chart to pick, the rules and a canonical snippet. It ships in the npm package at `node_modules/react-native-skia-chart/AGENTS.md`; point your agent at it or copy it into your project's own `AGENTS.md`.
- [`llms.txt`](https://baraa-rasheed.github.io/react-native-skia-chart/llms.txt) and the [agent guide](https://baraa-rasheed.github.io/react-native-skia-chart/docs/agents) are published with the documentation.
- [`example/recipes/agent-recipes.tsx`](example/recipes/agent-recipes.tsx) contains type-checked recipes for the most common charts, compiled under strict TypeScript with the example app.

## License

[MIT](LICENSE) © Baraa Rasheed
