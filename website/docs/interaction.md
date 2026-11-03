---
id: interaction
title: Animation & gestures
---

## Entry & morph animations

All charts animate in on mount. When `data` changes, paths morph on the UI thread with `SkPath.interpolate`. Line and area charts replay the entry animation only when the number of series or points changes. Same-length updates, such as live data, morph from the old values to the new ones.

```tsx
<LineChart data={data} animation={{ duration: 800, delay: 100 }} entry="draw" /> // 'draw' | 'grow' | 'none'
```

Set `animation={{ duration: 0 }}` to disable.

## Scrubbing

`LineChart`, `AreaChart` and `CandlestickChart` support press-and-drag scrubbing via `react-native-gesture-handler`. The cursor is positioned by a worklet; `onScrub` is called on the JS thread only when the index changes.

```tsx
const [pt, setPt] = useState<DataPoint | null>(null);
<LineChart data={data} interactive cursorColor="#999" onScrub={(p, i) => setPt(p)} />
```

Wrap your app in `GestureHandlerRootView`.

## Hooks

- `useEntryProgress(animation, deps)` — 0→1 shared value for custom entry effects.
- `usePathTransition(path, from, duration)` — morph between `SkPath`s on the UI thread.

## Touch interactions

Every chart where it makes sense responds to touch. Everything runs on the UI thread through Gesture Handler and Reanimated, and Skia draws it, so zoomed charts stay sharp.

| Interaction | Prop | Charts |
| --- | --- | --- |
| Scrub / crosshair (drag) | `interactive`, `onScrub` | Line, Area, Candlestick / OHLC |
| Long-press to start scrubbing | `scrubActivation="longPress"` | Line, Area, Candlestick / OHLC |
| Tap to select and highlight, tap again to clear; long-press also selects | `selectable`, `selectedIndex`, `onSelect` | Bar, Pie / Donut, Scatter, Bubble, Heatmap, Progress rings |
| Pinch to zoom, two-finger pan, double-tap to zoom in or reset | `zoom` (`true` or `{ min, max, doubleTap }`) | Line, Area, Candlestick, Bar, Scatter, Bubble, Stacked area, Heatmap |

When a mark is selected, the other marks dim. A selected pie slice pops out, a selected bubble or point grows, a selected heatmap cell gets an outline, and a selected ring gets thicker.

```tsx
const [sel, setSel] = useState<number | null>(null);

<BarChart width={340} height={220} data={data} selectable selectedIndex={sel} onSelect={setSel} zoom />
<Text>{sel == null ? 'Tap a bar' : `${data[sel].label}: ${data[sel].value}`}</Text>

// Inside a ScrollView or carousel: hold before scrubbing so horizontal swipes still page.
<LineChart width={340} height={200} data={prices} scrubActivation="longPress" onScrub={(p) => p && setPrice(p.y)} />
```

`selectedIndex` refers to the category slot for bars, the slice for pie charts, the point for scatter and bubble charts, the ring for progress rings (outer ring is 0), and `row * columns + column` for heatmaps.

### Native stack on iOS 26

On iOS 26, React Navigation's native stack turns on a full-screen back swipe by default. A finger moving right during a pinch or two-finger pan can start that swipe and pop the screen instead of zooming the chart. On screens with zoomable charts, keep the edge swipe and turn the full-screen one off:

```tsx
<Stack.Screen name="Chart" component={ChartScreen} options={{ fullScreenGestureEnabled: false }} />
```

You can build the same behaviour into your own Skia charts with the exported helpers `ChartFrame`, `ZoomGroup`, `useSelection`, `useHighlight` and `useToChart`.
