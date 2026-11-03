/** Vibrant "aurora" palette: violet, teal, magenta, amber, mint, sky. */
export const palette = ['#8B7CFF', '#00E0C6', '#FF4FD8', '#FFB547', '#3DFF9A', '#3EA6FF'] as const;
export const aurora = ['#6D4BFF', '#00D9C0', '#FF3DCB', '#2E8BFF'] as const;
export const theme = {
  bg: '#05050C',
  text: '#F5F5FA',
  sub: '#8C8CA3',
  separator: 'rgba(255,255,255,0.09)',
  accent: '#A99BFF',
  /** Neutral cell colour used by the heatmap's low end. */
  chip: '#1A1A2B',
  /** iOS inset-grouped cell (dark, translucent so the aurora bleeds through). */
  cell: 'rgba(255,255,255,0.065)',
  /** Gallery tile surface. */
  card: 'rgba(255,255,255,0.045)',
  up: '#34E39A',
  down: '#FF5C7A',
  destructive: '#FF453A',
} as const;
