import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme';

type Props = { route: any };

export function SettingsScreen(_: Props) {
  return (
    <ScreenLayout title="Settings">
      <View style={styles.card}>
        <Text style={styles.text}>Put auth, notification, and scan preferences here.</Text>
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

