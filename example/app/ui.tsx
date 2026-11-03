import React from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { palette, theme } from './theme';

export const tap = () => void Haptics.selectionAsync();

/** SF Symbol on iOS, text glyph elsewhere. */
export const Icon = ({ name, fallback, size = 17, color = theme.text }: { name: SymbolViewProps['name']; fallback: string; size?: number; color?: string }) => (
  <SymbolView name={name} size={size} weight="semibold" tintColor={color} fallback={<Text style={[styles.glyph, { color, fontSize: size }]}>{fallback}</Text>} />
);

/** Frosted-glass capsule button (UIBlurEffect on iOS). */
export const Glass = ({ children, onPress, label, disabled, style }: {
  children: React.ReactNode; onPress: () => void; label: string; disabled?: boolean; style?: object;
}) => (
  <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} hitSlop={6}
    onPress={() => { tap(); onPress(); }}
    style={({ pressed }) => [styles.glassWrap, style, disabled && styles.disabled, pressed && styles.pressed]}>
    <BlurView intensity={40} tint="systemThinMaterialDark" style={styles.glass}>{children}</BlurView>
  </Pressable>
);

/** iOS inset-grouped section. Separators are inset; the rows themselves are not. */
export const Section = ({ title, footer, children }: { title?: string; footer?: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    {title ? <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text> : null}
    <View style={styles.group}>
      {React.Children.toArray(children).filter(Boolean).map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <View style={styles.sep} /> : null}
          {c}
        </React.Fragment>
      ))}
    </View>
    {footer ? <Text style={styles.footer}>{footer}</Text> : null}
  </View>
);

export const Cell = ({ label, hint, children }: { label: string; hint?: string; children?: React.ReactNode }) => (
  <View style={styles.cell}>
    <View style={styles.flex}>
      <Text style={styles.cellLabel}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
    {children}
  </View>
);
export const Stacked = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={styles.stacked}><Text style={styles.cellLabel}>{label}</Text>{children}</View>
);
export const SwitchCell = ({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) => (
  <Cell label={label} hint={hint}>
    <Switch value={value} onValueChange={(v) => { tap(); onChange(v); }} trackColor={{ true: theme.up }} accessibilityLabel={label} />
  </Cell>
);
export const LinkCell = ({ label, icon, fallback, color = theme.accent, onPress }: {
  label: string; icon: SymbolViewProps['name']; fallback: string; color?: string; onPress: () => void;
}) => (
  <Pressable accessibilityRole="button" onPress={() => { tap(); onPress(); }} style={({ pressed }) => pressed && styles.pressedCell}>
    <View style={styles.cell}>
      <Text style={[styles.cellLabel, { color }]}>{label}</Text>
      <Icon name={icon} fallback={fallback} color={color} />
    </View>
  </Pressable>
);

export const Swatches = ({ value, onChange }: { value: string; onChange: (c: string) => void }) => (
  <View style={styles.swatches}>
    {palette.map((c) => (
      <Pressable key={c} accessibilityRole="button" accessibilityLabel={`Colour ${c}`} accessibilityState={{ selected: c === value }}
        onPress={() => { tap(); onChange(c); }} style={[styles.swatchRing, c === value && { borderColor: c }]}>
        <View style={[styles.swatch, { backgroundColor: c }]} />
      </Pressable>
    ))}
  </View>
);

/** Stocks-app price-change badge. */
export const DeltaPill = ({ delta, small }: { delta: number; small?: boolean }) => {
  const up = delta >= 0;
  return (
    <View style={[styles.pill, small && styles.pillSmall, { backgroundColor: up ? theme.up : theme.down }]}>
      <Text style={[styles.pillText, small && styles.pillTextSmall]}>{`${up ? '+' : ''}${delta.toFixed(2)}%`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  glyph: { fontWeight: '600' },
  glassWrap: { borderRadius: 999, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },
  glass: { alignItems: 'center', justifyContent: 'center', minHeight: 34, backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)' },
  section: { marginTop: 18 },
  sectionTitle: { color: theme.sub, fontSize: 13, marginLeft: 16, marginBottom: 7 },
  footer: { color: theme.sub, fontSize: 13, marginLeft: 16, marginTop: 7 },
  group: { backgroundColor: theme.cell, borderRadius: 14, overflow: 'hidden' },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: theme.separator, marginLeft: 16 },
  cell: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stacked: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  cellLabel: { color: theme.text, fontSize: 17 },
  hint: { color: theme.sub, fontSize: 13, marginTop: 2 },
  swatches: { flexDirection: 'row', justifyContent: 'space-between' },
  swatchRing: { padding: 3, borderRadius: 999, borderWidth: 2, borderColor: 'transparent' },
  swatch: { width: 30, height: 30, borderRadius: 15 },
  pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, minWidth: 74, alignItems: 'flex-end' },
  pillSmall: { minWidth: 0, paddingHorizontal: 6, paddingVertical: 2 },
  pillText: { color: '#fff', fontWeight: '700', fontSize: 14, fontVariant: ['tabular-nums'] },
  pillTextSmall: { fontSize: 12 },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.6 },
  pressedCell: { backgroundColor: 'rgba(255,255,255,0.06)' },
});
