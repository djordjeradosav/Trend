import { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Easing,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { C, S, R } from '../../src/theme'

// ─── Static mock data ─────────────────────────────────────────────────────────

const TOP_MOVERS = [
  { pair: 'BTC/USDT', score: 84, trend: 'bullish'  as const, change: '+2.4%' },
  { pair: 'SOL/USDT', score: 91, trend: 'bullish'  as const, change: '+4.1%' },
  { pair: 'XAU/USD',  score: 72, trend: 'bullish'  as const, change: '+0.9%' },
  { pair: 'ETH/USDT', score: 43, trend: 'neutral'  as const, change: '-0.5%' },
  { pair: 'ADA/USDT', score: 21, trend: 'bearish'  as const, change: '-3.2%' },
]

const SESSIONS = [
  { name: 'Tokyo',    open: false },
  { name: 'London',  open: true  },
  { name: 'New York', open: true  },
  { name: 'Sydney',  open: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trendColor(t: 'bullish' | 'bearish' | 'neutral') {
  if (t === 'bullish') return C.green
  if (t === 'bearish') return C.red
  return C.amber
}

function scoreToLabel(s: number) {
  if (s >= 70) return 'Strong Bull'
  if (s >= 55) return 'Bullish'
  if (s <= 30) return 'Strong Bear'
  if (s <= 45) return 'Bearish'
  return 'Neutral'
}

// ─── Pulsing dot ─────────────────────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.9, duration: 750, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(scale, { toValue: 1,   duration: 750, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
      ])
    ).start()
  }, [])
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: 10, height: 10, borderRadius: 5,
        backgroundColor: color, opacity: 0.35, transform: [{ scale }] }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  )
}

// ─── Market Sessions ─────────────────────────────────────────────────────────

function SessionBar() {
  return (
    <View style={s.sessionBar}>
      {SESSIONS.map(sess => (
        <View key={sess.name} style={s.sessionItem}>
          <View style={[s.sessionDot, { backgroundColor: sess.open ? C.green : C.muted }]} />
          <Text style={[s.sessionName, { color: sess.open ? C.text : C.muted }]}>
            {sess.name}
          </Text>
        </View>
      ))}
    </View>
  )
}

// ─── Summary stats ────────────────────────────────────────────────────────────

function SummaryRow() {
  const bullCount = TOP_MOVERS.filter(m => m.trend === 'bullish').length
  const bearCount = TOP_MOVERS.filter(m => m.trend === 'bearish').length
  const avg = Math.round(TOP_MOVERS.reduce((a, m) => a + m.score, 0) / TOP_MOVERS.length)

  const stats = [
    { label: 'Bullish',  value: bullCount, color: C.green },
    { label: 'Bearish',  value: bearCount, color: C.red   },
    { label: 'Avg Score', value: avg,      color: C.blue  },
    { label: 'Pairs',    value: TOP_MOVERS.length, color: C.sub },
  ]

  return (
    <View style={s.summaryRow}>
      {stats.map(st => (
        <View key={st.label} style={s.summaryCard}>
          <Text style={[s.summaryValue, { color: st.color }]}>{st.value}</Text>
          <Text style={s.summaryLabel}>{st.label}</Text>
        </View>
      ))}
    </View>
  )
}

// ─── Pair row ─────────────────────────────────────────────────────────────────

function PairRow({ item }: { item: typeof TOP_MOVERS[0] }) {
  const color = trendColor(item.trend)
  const isPos = item.change.startsWith('+')
  return (
    <View style={s.pairRow}>
      {/* Score circle */}
      <View style={[s.scoreCircle, { borderColor: color + '50', backgroundColor: color + '12' }]}>
        <Text style={[s.scoreNum, { color }]}>{item.score}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={s.pairName}>{item.pair}</Text>
        <Text style={[s.pairLabel, { color }]}>{scoreToLabel(item.score)}</Text>
      </View>

      {/* Change */}
      <Text style={[s.pairChange, { color: isPos ? C.green : C.red }]}>
        {item.change}
      </Text>
    </View>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '1d'>('1h')

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Dashboard</Text>
            <Text style={s.headerSub}>Market overview</Text>
          </View>
          <View style={s.liveBadge}>
            <PulseDot color={C.green} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Sessions */}
        <SessionBar />

        {/* Summary cards */}
        <SummaryRow />

        {/* Timeframe selector */}
        <View style={s.tfRow}>
          {(['1h', '4h', '1d'] as const).map(tf => (
            <TouchableOpacity
              key={tf}
              style={[s.tfChip, timeframe === tf && s.tfChipActive]}
              onPress={() => setTimeframe(tf)}
            >
              <Text style={[s.tfText, timeframe === tf && s.tfTextActive]}>{tf}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top movers */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Top Movers</Text>
          <View style={s.divider} />
          {TOP_MOVERS.map(item => (
            <PairRow key={item.pair} item={item} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: S.lg, paddingBottom: 32, gap: S.md },

  header:      { flexDirection: 'row', justifyContent: 'space-between',
                 alignItems: 'flex-start', paddingTop: S.sm },
  headerTitle: { fontSize: 22, fontWeight: '700', color: C.text },
  headerSub:   { fontSize: 12, color: C.muted, marginTop: 2 },
  liveBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5,
                 backgroundColor: C.surface, borderRadius: R.sm,
                 borderWidth: 0.5, borderColor: C.green + '50',
                 paddingVertical: 5, paddingHorizontal: 9 },
  liveText:    { fontSize: 10, fontWeight: '700', color: C.green, letterSpacing: 1 },

  sessionBar:  { flexDirection: 'row', justifyContent: 'space-between',
                 backgroundColor: C.surface, borderRadius: R.md,
                 borderWidth: 0.5, borderColor: C.border,
                 paddingVertical: 10, paddingHorizontal: S.md },
  sessionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sessionDot:  { width: 6, height: 6, borderRadius: 3 },
  sessionName: { fontSize: 11, fontWeight: '500' },

  summaryRow:  { flexDirection: 'row', gap: S.sm },
  summaryCard: { flex: 1, backgroundColor: C.surface, borderRadius: R.md,
                 borderWidth: 0.5, borderColor: C.border,
                 paddingVertical: 12, alignItems: 'center' },
  summaryValue:{ fontSize: 20, fontWeight: '800' },
  summaryLabel:{ fontSize: 9, color: C.muted, marginTop: 2, textTransform: 'uppercase',
                 letterSpacing: 0.6 },

  tfRow:       { flexDirection: 'row', gap: S.sm },
  tfChip:      { paddingVertical: 6, paddingHorizontal: 14, borderRadius: R.sm,
                 backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border },
  tfChipActive:{ backgroundColor: C.green + '18', borderColor: C.green + '60' },
  tfText:      { fontSize: 12, fontWeight: '600', color: C.muted },
  tfTextActive:{ color: C.green },

  card:        { backgroundColor: C.surface, borderRadius: R.lg,
                 borderWidth: 0.5, borderColor: C.border, padding: S.md },
  cardTitle:   { fontSize: 12, fontWeight: '700', color: C.text,
                 textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: S.sm },
  divider:     { height: 0.5, backgroundColor: C.border, marginBottom: S.sm },

  pairRow:     { flexDirection: 'row', alignItems: 'center', gap: S.md,
                 paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: C.border + '60' },
  scoreCircle: { width: 44, height: 44, borderRadius: 22,
                 borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  scoreNum:    { fontSize: 15, fontWeight: '800' },
  pairName:    { fontSize: 14, fontWeight: '700', color: C.text },
  pairLabel:   { fontSize: 11, marginTop: 1 },
  pairChange:  { fontSize: 13, fontWeight: '700' },
})