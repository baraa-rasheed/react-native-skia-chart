---
id: bubble
title: Bubble chart
sidebar_position: 9
---

Scatter with a third dimension mapped to radius.

![Bubble chart in the example app](/img/charts/bubble.png)

*Screenshot from the [example app](../example-app). Run it to try every option live.*

## Usage

```tsx
import { BubbleChart } from 'react-native-skia-chart';

<BubbleChart width={w} height={240} data={points} maxRadius={18} />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `{ x, y, z }[]` | `—` | `z` drives size. |
| `color` | `string` | `'#E17055'` |  |
| `minRadius` | `number` | `4` |  |
| `maxRadius` | `number` | `24` |  |
| `opacity` | `number` | `0.6` |  |
| `showGrid` | `boolean` | `true` |  |
| `formatY` | `(v) => string` | `—` |  |

All charts also accept the shared props: `width`, `height`, `padding`, `style`, `backgroundColor`, `animation`, `font`, [`effects`](../effects) and [`gradient`](../gradients).

## Gradient

```tsx
<BubbleChart {...props} gradient={{ type: 'radial', colors: ['#FFC048', '#FF6B9A'], center: [0.3, 0.3], radius: 1.2 }} />
```

## GPU notes

Combine with `effects={{ glow: 8 }}` for a neon look; the glow pass reuses the same gradient.
