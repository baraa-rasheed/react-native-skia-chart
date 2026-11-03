---
id: scatter
title: Scatter chart
sidebar_position: 8
---

Point clouds.

![Scatter chart in the example app](/img/charts/scatter.png)

*Screenshot from the [example app](../example-app). Run it to try every option live.*

## Usage

```tsx
import { ScatterChart } from 'react-native-skia-chart';

<ScatterChart width={w} height={220} data={points} radius={3} />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `{ x, y }[]` | `—` |  |
| `color` | `string` | `'#0984E3'` |  |
| `radius` | `number` | `4` |  |
| `opacity` | `number` | `0.85` |  |
| `showGrid` | `boolean` | `true` |  |
| `formatY` | `(v) => string` | `—` |  |

All charts also accept the shared props: `width`, `height`, `padding`, `style`, `backgroundColor`, `animation`, `font`, [`effects`](../effects) and [`gradient`](../gradients).

## Gradient

```tsx
<ScatterChart {...props} gradient={{ type: 'radial', colors: ['#00D2D3', '#7C5CFF'], center: [0.5, 0.5], radius: 1 }} />
```

## GPU notes

Points are batched into a single path, so thousands of dots stay at 60/120 fps.
