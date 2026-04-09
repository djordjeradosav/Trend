import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import { C } from '../theme'

export default function SplashScreen() {
  const pulse = useRef(new Animated.Value(0.6)).current
  const spin  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 900, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
      ])
    ).start()

    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1400, useNativeDriver: true, easing: Easing.linear })
    ).start()
  }, [])

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  return (
    <View style={s.root}>
      {/* Logo */}
      <Animated.View style={[s.logoCircle, { opacity: pulse }]}>
        <Text style={{ fontSize: 32 }}>📈</Text>
      </Animated.View>

      <Text style={s.name}>TrendScan</Text>
      <View style={s.badge}><Text style={s.badgeText}>AI</Text></View>

      {/* Spinner */}
      <Animated.View style={[s.ring, { transform: [{ rotate }] }]}>
        <View style={s.dot} />
      </Animated.View>

      <Text style={s.sub}>Loading your session…</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logoCircle: { width: 80, height: 80, borderRadius: 40,
                backgroundColor: C.greenBg, borderWidth: 2, borderColor: C.green,
                alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  name:       { fontSize: 30, fontWeight: '900', color: C.text, letterSpacing: -0.5 },
  badge:      { backgroundColor: 'rgba(34,197,94,0.2)', borderRadius: 6,
                paddingHorizontal: 10, paddingVertical: 4,
                borderWidth: 0.5, borderColor: C.green },
  badgeText:  { fontSize: 12, fontWeight: '900', color: C.green, letterSpacing: 1.2 },
  ring:       { width: 40, height: 40, borderRadius: 20, marginTop: 16,
                borderWidth: 2.5, borderColor: 'transparent',
                borderTopColor: C.green, alignItems: 'flex-start', justifyContent: 'flex-start' },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green,
                position: 'absolute', top: -4, left: 14 },
  sub:        { fontSize: 12, color: C.muted, marginTop: 4 },
})