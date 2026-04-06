import * as React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme';

type Props = { navigation: any };

export function AlertsScreen({ navigation }: Props) {
  return (
    <ScreenLayout title="Alerts">
      <View style={styles.card}>
        <Text style={styles.text}>
          This is the Alerts page. Your saved alerts + alert creation UI can live here.
        </Text>
        <Button title="News" onPress={() => navigation.navigate('News')} />
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

