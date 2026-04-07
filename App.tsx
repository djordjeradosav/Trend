// App.tsx
import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  NavigationContainer,
  DefaultTheme,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

import { colors } from './src/theme';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import { WatchlistScreen } from './src/screens/WatchlistScreen';
import { PairDetailScreen } from './src/screens/PairDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import NewsScreen from './src/screens/NewsScreen';
import MacroScreen from './src/screens/MacroScreen';

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:      '#0a0f0a',
  surface: '#111a11',
  border:  '#1a2a1a',
  text:    '#e8f5e8',
  muted:   '#567856',
  dim:     '#2a3a2a',
  green:   '#22c55e',
  greenDim:'#166534',
  blue:    '#3b82f6',
};

// ─── CUSTOM HEADER ────────────────────────────────────────────────────────────
function TrendScanHeader() {
  return (
    <View style={hdr.bar}>
      {/* Logo */}
      <View style={hdr.logoRow}>
        <View style={hdr.logoIcon}>
          <Text style={hdr.logoSymbol}>◎</Text>
        </View>
        <Text style={hdr.logoTxt}>TrendScan</Text>
      </View>

      {/* Right actions */}
      <View style={hdr.rightRow}>
        <TouchableOpacity style={hdr.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {/* Bell — using emoji that matches the golden bell in your screenshot */}
          <Text style={hdr.bellIcon}>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity style={hdr.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={hdr.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const hdr = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon:  {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.greenDim,
    alignItems: 'center', justifyContent: 'center',
  },
  logoSymbol:{ fontSize: 18, color: C.green },
  logoTxt:   { fontSize: 20, fontWeight: '800', color: C.text },
  rightRow:  { flexDirection: 'row', gap: 8 },
  iconBtn:   {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  bellIcon:  { fontSize: 18 },
  menuIcon:  { fontSize: 18, color: C.muted },
});

// ─── CUSTOM TAB BAR ───────────────────────────────────────────────────────────
type TabId = 'Dashboard' | 'Macro' | 'Calendar' | 'News' | 'Settings';

const TAB_ITEMS: { id: TabId; label: string }[] = [
  { id: 'Dashboard', label: 'Dashboard' },
  { id: 'Macro',     label: 'Macro'     },
  { id: 'Calendar',  label: 'Calendar'  },
  { id: 'News',      label: 'News'      },
  { id: 'Settings',  label: 'Settings'  },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={tb.bar}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={tb.item}
            onPress={onPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            {/* Downward-pointing filled triangle — matches your screenshot */}
            <Text style={[tb.triangle, focused && tb.triangleActive]}>▼</Text>
            <Text style={[tb.label, focused && tb.labelActive]}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
  },
  item:          { flex: 1, alignItems: 'center', gap: 4 },
  triangle:      { fontSize: 14, color: C.dim },
  triangleActive:{ color: C.blue },
  label:         { fontSize: 10, fontWeight: '600', color: C.muted },
  labelActive:   { color: C.blue },
});

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: C.bg,
    card:        C.bg,
    text:        C.text,
    border:      C.border,
  },
};

function MainTabs() {
  return (
    <>
      <TrendScanHeader />
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Macro"     component={MacroScreen}     />
        <Tab.Screen name="Calendar"  component={CalendarScreen}  />
        <Tab.Screen name="News"      component={NewsScreen}      />
        <Tab.Screen name="Settings"  component={SettingsScreen}  />
      </Tab.Navigator>
    </>
  );
}

function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main"       component={MainTabs}       />
      <Stack.Screen name="PairDetail" component={PairDetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={NavTheme}>
      <StatusBar style="light" />
      <RootStack />
    </NavigationContainer>
  );
}