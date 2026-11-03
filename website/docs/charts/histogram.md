---
id: histogram
title: Histogram
sidebar_position: 5
---

Bins raw values and renders them as bars.

![Histogram in the example app](/img/charts/histogram.png)

*Screenshot from the [example app](../example-app). Run it to try every option live.*

## Usage

```tsx
import { Histogram } from 'react-native-skia-chart';

<Histogram width={w} height={180} values={samples} bins={16} color="#FFC048" />
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `values` | `number[]` | `—` | Raw samples. |
| `bins` | `number` | `10` |  |
| `…BarChart props` |  |  | Except `data`, `series`, `labels`. |

All charts also accept the shared props: `width`, `height`, `padding`, `style`, `backgroundColor`, `animation`, `font`, [`effects`](../effects) and [`gradient`](../gradients).

## Gradient

```tsx
<Histogram {...props} gradient={{ type: 'linear', colors: ['#4CD97B', '#FFC048', '#FF5A5F'], start: [0, 0.5], end: [1, 0.5] }} />
```

## GPU notes

Binning is memoised on the JS thread; rendering is the same GPU bar path as BarChart.
