---
id: heatmap
title: Heatmap
sidebar_position: 12
---

Grid of cells coloured by value.

![Heatmap in the example app](/img/charts/heatmap.png)

*Screenshot from the [example app](../example-app). Run it to try every option live.*

## Usage

```tsx
import { HeatmapChart } from 'react-native-skia-chart';

<HeatmapChart width={w} height={160} data={matrix} colors={['#1E1E2A', '#7C5CFF']} />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `number[][]` | `—` | Rows × columns. |
| `colors` | `[low, high]` | `—` | Interpolated per cell. |
| `gap` | `number` | `2` |  |
| `radius` | `number` | `2` |  |
| `rowLabels` | `string[]` | `—` |  |
| `columnLabels` | `string[]` | `—` |  |
| `labelColor` | `string` | `—` |  |

All charts also accept the shared props: `width`, `height`, `padding`, `style`, `backgroundColor`, `animation`, `font`, [`effects`](../effects) and [`gradient`](../gradients).

## Gradient

```tsx
<HeatmapChart {...props} gradient={{ type: 'linear', colors: ['#7C5CFF', '#FF6B9A'], start: [0, 0.5], end: [1, 0.5], mode: 'overlay', opacity: 0.5 }} />
```

## GPU notes

In `tint` mode a gradient replaces the cell colours but keeps their per-cell alpha.
