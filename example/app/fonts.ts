import { useMemo } from 'react';
import { Platform } from 'react-native';
import { matchFont, type SkFont } from 'react-native-skia';

const fontFamily = Platform.select({ ios: 'Helvetica Neue', default: 'sans-serif' });

export interface ChartFonts {
  /** Axis / tick labels. */
  axis: SkFont;
  /** Donut centre label. */
  value: SkFont;
  /** Gauge readout. */
  big: SkFont;
}

/** System fonts resolved by Skia (no font files to bundle). Charts only draw labels when given a font. */
export const useChartFonts = (): ChartFonts =>
  useMemo(
    () => ({
      axis: matchFont({ fontFamily, fontSize: 11, fontWeight: '500' }),
      value: matchFont({ fontFamily, fontSize: 24, fontWeight: '700' }),
      big: matchFont({ fontFamily, fontSize: 34, fontWeight: '700' }),
    }),
    [],
  );
