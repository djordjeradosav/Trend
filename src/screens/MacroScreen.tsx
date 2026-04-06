import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme';

type Props = { route: any };

export function MacroScreen(_: Props) {
  return (
    <ScreenLayout title="Macro">
      <View style={styles.card}>
        <Text style={styles.text}>Macro indicators / heatmaps / rates overview goes here.</Text>
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
    lineHeight: 20,
  },
});

