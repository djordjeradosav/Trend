import * as React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme';

type Props = { navigation: any };

export function DashboardScreen({ navigation }: Props) {
  return (
    <ScreenLayout title="Dashboard">
      <View style={styles.card}>
        <Text style={styles.label}>Quick links</Text>
        <View style={styles.row}>
          <Button title="Settings" onPress={() => navigation.navigate('Settings')} />
          <Button title="News" onPress={() => navigation.navigate('News')} />
          <Button title="Macro" onPress={() => navigation.navigate('Macro')} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Example detail page</Text>
        <Button
          title="Open BTC/USDT"
          onPress={() => navigation.navigate('PairDetail', { pair: 'BTC/USDT' })}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  label: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
});

