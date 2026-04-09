// App.tsx — TrendScannerAI
// Auth guard: shows Login/Signup while logged out, MainTabs when logged in.
import React from 'react'
import { StatusBar } from 'expo-status-bar'
import {
  NavigationContainer,
  DefaultTheme,
} from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'

import { colors, C } from './src/theme'

// ── Screens ─────────────────────────────────────────────────────────────────
import DashboardScreen     from './src/screens/DashboardScreen'
import { ScannerScreen }   from './src/screens/ScannerScreen'
import CalendarScreen      from './src/screens/CalendarScreen'
import { WatchlistScreen } from './src/screens/WatchlistScreen'
import { PairDetailScreen } from './src/screens/PairDetailScreen'
import SettingsScreen      from './src/screens/SettingsScreen'
import NewsScreen          from './src/screens/NewsScreen'
import MacroScreen         from './src/screens/MacroScreen'

// ── Auth screens ─────────────────────────────────────────────────────────────
import LoginScreen         from './src/auth/LoginScreen'
import SignupScreen        from './src/auth/SignupScreen'
import SplashScreen        from './src/auth/SplashScreen'
import { useAuthSession }  from './src/hooks/useAuthSession'

// ─── NAV THEME ───────────────────────────────────────────────────────────────
const NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: C.bg,
    card:        C.bg,
    text:        C.text,
    border:      C.border,
  },
}

// ─── CUSTOM TAB BAR ──────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }: any) {
  return (
    <View style={tb.bar}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name)
        }
        return (
          <TouchableOpacity key={route.key} style={tb.item} onPress={onPress}
            activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Text style={[tb.triangle, focused && tb.triangleActive]}>▼</Text>
            <Text style={[tb.label, focused && tb.labelActive]}>{route.name}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10, paddingTop: 10,
  },
  item:          { flex: 1, alignItems: 'center', gap: 4 },
  triangle:      { fontSize: 14, color: C.dim },
  triangleActive:{ color: C.blue },
  label:         { fontSize: 10, fontWeight: '600', color: C.muted },
  labelActive:   { color: C.blue },
})

// ─── NAVIGATORS ──────────────────────────────────────────────────────────────
const Tab       = createBottomTabNavigator()
const AuthStack = createStackNavigator()
const RootStack = createStackNavigator()

// Main app tabs (only reached when authenticated)
function MainTabs() {
  return (
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
  )
}

// Authenticated root: tabs + pair detail
function AppRoot() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main"       component={MainTabs}        />
      <RootStack.Screen name="PairDetail" component={PairDetailScreen} />
    </RootStack.Navigator>
  )
}

// Unauthenticated stack: login ↔ signup
function AuthRoot() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"  component={LoginScreen}  />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  )
}

// ─── ROOT COMPONENT ──────────────────────────────────────────────────────────
export default function App() {
  const { session, loading } = useAuthSession()

  // While AsyncStorage resolves the persisted session, show a branded splash
  if (loading) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen />
      </>
    )
  }

  return (
    <NavigationContainer theme={NavTheme}>
      <StatusBar style="light" />
      {session ? <AppRoot /> : <AuthRoot />}
    </NavigationContainer>
  )
}