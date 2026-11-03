---
id: pie-donut
title: Pie & Donut
sidebar_position: 7
---

Pie and donut charts with pad angles and a centre label.

![Pie & Donut in the example app](/img/charts/pie-donut.png)

*Screenshot from the [example app](../example-app). Run it to try every option live.*

## Usage

```tsx
import { PieChart, DonutChart } from 'react-native-skia-chart';

<DonutChart width={220} height={220} data={slices} thickness={0.32} padAngle={2} centerLabel="$4.2k" />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `data` | `{ value, color, label? }[]` | `—` |  |
| `innerRadius` | `number (0..1)` | `0` | > 0 makes a donut. |
| `padAngle` | `number (deg)` | `0` |  |
| `startAngle` | `number (deg)` | `-90` |  |
| `centerLabel` | `string` | `—` |  |
| `centerLabelColor` | `string` | `—` |  |
| `centerFont` | `SkFont` | `—` |  |
| `DonutChart: thickness` | `number (0..1)` | `0.4` |  |

All charts also accept the shared props: `width`, `height`, `padding`, `style`, `backgroundColor`, `animation`, `font`, [`effects`](../effects) and [`gradient`](../gradients).

## Gradient

```tsx
<PieChart {...props} gradient={{ type: 'sweep', colors: ['#7C5CFF', '#00D2D3', '#7C5CFF'] } // or type: 'radial'} />
```

## GPU notes

A `sweep` gradient follows the circle; `radial` shades from the centre out. Both are single GPU shaders.
