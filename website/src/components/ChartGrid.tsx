import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './ChartGrid.module.css';

// One tile per chart page in docs/charts. `slug` is both the doc id and the screenshot name.
export const CHARTS = [
  { slug: 'line', name: 'Line' },
  { slug: 'area', name: 'Area & Sparkline' },
  { slug: 'bar', name: 'Bar' },
  { slug: 'stacked-bar', name: 'Stacked bar' },
  { slug: 'histogram', name: 'Histogram' },
  { slug: 'stacked-area', name: 'Stacked area' },
  { slug: 'pie-donut', name: 'Pie & Donut' },
  { slug: 'scatter', name: 'Scatter' },
  { slug: 'bubble', name: 'Bubble' },
  { slug: 'radar', name: 'Radar' },
  { slug: 'candlestick', name: 'Candlestick & OHLC' },
  { slug: 'heatmap', name: 'Heatmap' },
  { slug: 'gauge', name: 'Gauge' },
  { slug: 'progress-rings', name: 'Progress rings' },
];

function Tile({ slug, name }: { slug: string; name: string }) {
  return (
    <Link to={`/docs/charts/${slug}`} className={styles.tile}>
      <img src={useBaseUrl(`/img/charts/${slug}.png`)} alt="" loading="lazy" />
      <span>{name}</span>
    </Link>
  );
}

export default function ChartGrid(): ReactNode {
  return (
    <div className={styles.grid}>
      {CHARTS.map((c) => <Tile key={c.slug} {...c} />)}
    </div>
  );
}
