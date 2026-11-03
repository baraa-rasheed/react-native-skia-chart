---
id: example-app
title: Example app
---

`example/` is an Expo SDK 58 app that shows every chart and lets you customise it live, with a dark **aurora** look.

```sh
cd example
npm install
npx expo run:ios   # or run:android. Skia v3 needs a dev build.
```

![The example app](/img/readme/screens.png)

The app has two tabs, **Gallery** and **Showcase**, switched with a floating frosted tab bar. Tapping any chart opens its **Playground**.

## Gallery

- A large **Charts** title over an animated aurora (blurred Skia circles driven by `useClock`). The header blurs once the title collapses.
- A hero area chart that streams a new point every second. Same-length updates morph on the UI thread instead of redrawing.
- Every chart type as a live preview card, grouped by what it's for: **Trends**, **Comparison**, **Part of whole**, **Correlation**, **Finance** and **KPI**. Each card shows the component name. Cards reflect whatever you changed in the playground.
- Blocks fade in one after another (Reanimated `FadeInDown`). Data comes from a seeded PRNG, so charts look the same on every launch.

## Playground

One scroll view per chart, with:

- a **readout** (big value, change badge and caption) that follows scrubbing and selection, for example the open, high and low of the candle under your finger;
- the **chart** itself, with axis labels drawn from a Skia system font (`matchFont`);
- tabs for **Style** (colour swatches, None / Linear / Radial / Sweep gradient and end colour, plus chart-specific switches such as smooth curve, horizontal, 100% stacked, donut, centre label, needle and OHLC bars), **Data** (a −/+ stepper, **Randomize data** and, for line, area and gauge, **Live data**), **Gestures** (scrub, long-press to scrub, tap to select, pinch to zoom) and **Effects** (drop shadow, neon glow, an SkSL shader and a colour filter), plus **Reset to defaults**.

Gradients are hidden for the candlestick, heatmap, stacked charts and radar, where colour already carries meaning.

## Showcase

- **Finance**: portfolio balance that follows the scrubbed point, a range control (1D / 1W / 1M / 6M / 1Y), a watchlist of `Sparkline` rows that open their playground, and an allocation donut with a legend.
- **Fitness**: selectable activity rings with a legend, weekly steps as a bar chart and heart rate as an area chart.

The app resolves the library from `../src` via `metro.config.js`, so edits hot-reload.
