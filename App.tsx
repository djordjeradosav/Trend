// App.tsx
import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { colors } from './src/theme';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { WatchlistScreen } from './src/screens/WatchlistScreen';
import { PairDetailScreen } from './src/screens/PairDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { NewsScreen } from './src/screens/NewsScreen';
import { MacroScreen } from './src/screens/MacroScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Mirror the MobileTabBar tabs exactly:
// Dashboard, Scanner, Calendar, Alerts, Watchlist
function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen} />
    </Tab.Navigator>
  );
}

function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        headerTitleStyle: { color: colors.foreground },
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="PairDetail" component={PairDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="News" component={NewsScreen} />
      <Stack.Screen name="Macro" component={MacroScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <RootStack />
    </NavigationContainer>
  );
}