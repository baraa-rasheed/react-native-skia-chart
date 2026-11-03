import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LogBox, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SymbolViewProps } from 'expo-symbols';
import { CHARTS } from './app/charts';
import { Aurora } from './app/Aurora';
import { Gallery } from './app/Gallery';
import { Playground } from './app/Playground';
import { Showcase } from './app/Showcase';
import { ChartStoreProvider } from './app/store';
import { theme } from './app/theme';
import { Icon } from './app/ui';

// Keep screen recordings of the demo free of the dev warning toast.
LogBox.ignoreAllLogs();

export type RootStackParamList = { Home: undefined; Playground: { id: string } };
const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: theme.accent, background: theme.bg, card: theme.bg, text: theme.text, border: theme.separator },
};

type TabKey = 'gallery' | 'showcase';
const TABS: { key: TabKey; label: string; title: string; icon: SymbolViewProps['name']; fallback: string }[] = [
  { key: 'gallery', label: 'Gallery', title: 'Charts', icon: 'square.grid.2x2', fallback: '▦' },
  { key: 'showcase', label: 'Showcase', title: 'Showcase', icon: 'sparkles', fallback: '✦' },
];

/** Floating frosted tab bar. */
const TabBar = ({ value, onChange }: { value: TabKey; onChange: (t: TabKey) => void }) => {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.tabBarWrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <BlurView intensity={60} tint="systemChromeMaterialDark" style={styles.tabBar}>
        {TABS.map((t) => {
          const on = t.key === value;
          return (
            <Pressable key={t.key} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={t.label}
              onPress={() => { if (!on) { void Haptics.selectionAsync(); onChange(t.key); } }}
              style={[styles.tab, on && styles.tabOn]}>
              <Icon name={t.icon} fallback={t.fallback} size={17} color={on ? theme.text : theme.sub} />
              <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
};

function HomeScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [tab, setTab] = useState<TabKey>('gallery');
  // Resting offset under the large title (negative, set by UIKit's automatic insets); learned from the first drag.
  const rest = useRef<number | null>(null);
  const onBeginDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (rest.current === null || y < rest.current) rest.current = y;
  };
  const open = useCallback((id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Playground', { id });
  }, [navigation]);
  useEffect(() => {
    navigation.setOptions({ title: TABS.find((t) => t.key === tab)?.title ?? 'Charts' });
  }, [navigation, tab]);
  // New tab starts at the top, with the large title expanded. Without a drag yet, we're still at the top.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const y = rest.current;
    if (y !== null) requestAnimationFrame(() => scrollRef.current?.scrollTo({ y, animated: false }));
  }, [tab]);
  const auroraH = Math.min(520, height * 0.6);

  return (
    <View style={styles.flex}>
      {/* The ScrollView must be the screen's first native subview: UIKit only links the large title to the
          first scroll view it finds, so anything rendered before it (like the aurora) stops the collapse. */}
      <ScrollView ref={scrollRef} onScrollBeginDrag={onBeginDrag} contentInsetAdjustmentBehavior="automatic" style={styles.flex}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 110 }]}>
        {/* Aurora lives inside the scroll content, pulled up behind the transparent large header. */}
        <View pointerEvents="none" style={[styles.aurora, { top: -(insets.top + 112), width, height: auroraH }]}>
          <Aurora width={width} height={auroraH} />
        </View>
        {tab === 'gallery' ? <Gallery key="g" width={width} onOpen={open} /> : <Showcase key="s" width={width} onOpen={open} />}
      </ScrollView>
      <TabBar value={tab} onChange={setTab} />
    </View>
  );
}

function PlaygroundScreen({ route }: NativeStackScreenProps<RootStackParamList, 'Playground'>) {
  return <Playground id={route.params.id} />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ChartStoreProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" />
            <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: theme.bg } }}>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{
                  title: 'Charts',
                  headerLargeTitle: true,
                  // Transparent large header so the aurora shows through; it blurs once collapsed.
                  headerTransparent: true,
                  headerBlurEffect: 'dark',
                  headerStyle: { backgroundColor: 'transparent' },
                  headerLargeTitleShadowVisible: false,
                  headerShadowVisible: false,
                  headerLargeStyle: { backgroundColor: 'transparent' },
                  headerTitleStyle: { color: theme.text },
                  headerLargeTitleStyle: { color: theme.text },
                }}
              />
              <Stack.Screen
                name="Playground"
                component={PlaygroundScreen}
                options={({ route }) => ({
                  title: CHARTS.find((d) => d.id === route.params.id)?.name ?? 'Chart',
                  headerBackTitle: 'Charts',
                  headerStyle: { backgroundColor: theme.bg },
                  headerShadowVisible: false,
                  headerTitleStyle: { color: theme.text },
                })}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ChartStoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: 'transparent' },
  body: { paddingHorizontal: 20, paddingTop: 4 },
  aurora: { position: 'absolute', left: 0 },
  tabBarWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  tabBar: { flexDirection: 'row', borderRadius: 30, overflow: 'hidden', padding: 5, gap: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.16)' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 25 },
  tabOn: { backgroundColor: 'rgba(255,255,255,0.12)' },
  tabLabel: { color: theme.sub, fontSize: 15, fontWeight: '600' },
  tabLabelOn: { color: theme.text },
});
