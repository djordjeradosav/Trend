import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme';

type Props = { route: any };

export function PairDetailScreen({ route }: Props) {
  const pair = (route?.params?.pair as string | undefined) ?? 'Unknown';

  return (
    <ScreenLayout title="Pair Detail">
      <View style={styles.card}>
        <Text style={styles.label}>Pair</Text>
        <Text style={styles.value}>{pair}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Next</Text>
        <Text style={styles.value}>Add chart + indicators + alert actions here.</Text>
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
    color: colors.muted,
    fontSize: 12,
    marginBottom: 6,
  },
  value: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '700',
  },
});

