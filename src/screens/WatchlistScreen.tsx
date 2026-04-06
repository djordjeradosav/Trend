import * as React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme';

type Props = { navigation: any };

export function WatchlistScreen({ navigation }: Props) {
  return (
    <ScreenLayout title="Watchlist">
      <View style={styles.card}>
        <Text style={styles.text}>
          This is the Watchlist page. Show your lists and allow opening a pair detail.
        </Text>
        <Button
          title="Open SOL/USDT"
          onPress={() => navigation.navigate('PairDetail', { pair: 'SOL/USDT' })}
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
  },
  text: {
    color: colors.foreground,
    marginBottom: 12,
    lineHeight: 20,
  },
});

