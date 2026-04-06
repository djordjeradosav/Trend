import * as React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme';

type Props = { navigation: any };

export function ScannerScreen({ navigation }: Props) {
  return (
    <ScreenLayout title="Scanner">
      <View style={styles.card}>
        <Text style={styles.text}>
          This is the Scanner page. Wire your scan controls + results list here.
        </Text>
        <Button
          title="Open example PairDetail"
          onPress={() => navigation.navigate('PairDetail', { pair: 'ETH/USDT' })}
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

