/*
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

*/


import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';

// ─── Theme ───────────────────────────────────────────────────────────────────

const colors = {
  background: '#0a0b0f',
  card: '#111318',
  border: '#1e2130',
  primary: '#6c8ef5',
  foreground: '#e8eaf0',
  muted: '#3a3f55',
  mutedForeground: '#636880',
  bullish: '#22c55e',
  bearish: '#ef4444',
  neutral: '#f59e0b',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sentimentColor(avg: number) {
  if (avg >= 60) return colors.primary;
  if (avg <= 40) return colors.bearish;
  return colors.neutral;
}

function sentimentLabel(avg: number) {
  if (avg >= 60) return 'Risk-On';
  if (avg <= 40) return 'Risk-Off';
  return 'Mixed';
}

// ─── Live Dot ────────────────────────────────────────────────────────────────

function LiveDot({ color = colors.primary }: { color?: string }) {
  const pulse = React.useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.8, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: color, opacity: 0.4, transform: [{ scale: pulse }] }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  sub?: string;
  emoji: string;
}

function StatCard({ label, value, color, sub, emoji }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Text style={{ fontSize: 14 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

// ─── Price Ticker Strip ───────────────────────────────────────────────────────

const TICKERS = [
  { pair: 'BTC/USDT', price: '83,241', change: '+1.24%', bull: true },
  { pair: 'ETH/USDT', price: '3,142', change: '-0.47%', bull: false },
  { pair: 'SOL/USDT', price: '148.3', change: '+3.11%', bull: true },
  { pair: 'XAU/USD', price: '2,318', change: '+0.82%', bull: true },
  { pair: 'DXY', price: '104.2', change: '-0.21%', bull: false },
  { pair: 'US10Y', price: '4.41%', change: '+0.04', bull: false },
];

function PriceTickerStrip() {
  const offset = React.useRef(new Animated.Value(0)).current;
  const W = Dimensions.get('window').width;

  useEffect(() => {
    Animated.loop(
      Animated.timing(offset, { toValue: -W * 1.2, duration: 14000, useNativeDriver: true, easing: Easing.linear })
    ).start();
  }, []);

  const items = [...TICKERS, ...TICKERS];
  return (
    <View style={styles.tickerRow}>
      <Animated.View style={{ flexDirection: 'row', gap: 24, transform: [{ translateX: offset }] }}>
        {items.map((t, i) => (
          <View key={i} style={styles.tickerItem}>
            <Text style={styles.tickerPair}>{t.pair}</Text>
            <Text style={styles.tickerPrice}>{t.price}</Text>
            <Text style={[styles.tickerChange, { color: t.bull ? colors.bullish : colors.bearish }]}>{t.change}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ─── Market Session Bar ───────────────────────────────────────────────────────

const SESSIONS = [
  { name: 'TOKYO', status: 'closed' as const },
  { name: 'LONDON', status: 'open' as const },
  { name: 'NEW YORK', status: 'open' as const },
  { name: 'SYDNEY', status: 'closed' as const },
];

function MarketSessionBar() {
  return (
    <View style={styles.sessionBar}>
      {SESSIONS.map((s) => (
        <View key={s.name} style={styles.sessionItem}>
          <View style={[styles.sessionDot, { backgroundColor: s.status === 'open' ? colors.bullish : colors.muted }]} />
          <Text style={[styles.sessionName, { color: s.status === 'open' ? colors.foreground : colors.mutedForeground }]}>{s.name}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Heatmap Widget ───────────────────────────────────────────────────────────

const HEATMAP_PAIRS = [
  { pair: 'BTC', score: 82, trend: 'bullish' as const },
  { pair: 'ETH', score: 45, trend: 'neutral' as const },
  { pair: 'SOL', score: 91, trend: 'bullish' as const },
  { pair: 'BNB', score: 28, trend: 'bearish' as const },
  { pair: 'XRP', score: 67, trend: 'bullish' as const },
  { pair: 'ADA', score: 18, trend: 'bearish' as const },
  { pair: 'DOGE', score: 55, trend: 'neutral' as const },
  { pair: 'AVAX', score: 73, trend: 'bullish' as const },
  { pair: 'LINK', score: 38, trend: 'bearish' as const },
  { pair: 'MATIC', score: 61, trend: 'bullish' as const },
  { pair: 'DOT', score: 33, trend: 'bearish' as const },
  { pair: 'UNI', score: 50, trend: 'neutral' as const },
];

function heatColor(score: number) {
  if (score >= 70) return colors.bullish;
  if (score <= 30) return colors.bearish;
  return colors.neutral;
}

function HeatmapWidget() {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Market Heatmap</Text>
      <View style={styles.heatmapGrid}>
        {HEATMAP_PAIRS.map((p) => (
          <View key={p.pair} style={[styles.heatCell, { backgroundColor: heatColor(p.score) + '20', borderColor: heatColor(p.score) + '50' }]}>
            <Text style={[styles.heatPair, { color: heatColor(p.score) }]}>{p.pair}</Text>
            <Text style={[styles.heatScore, { color: heatColor(p.score) }]}>{p.score}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── AI Macro Desk ────────────────────────────────────────────────────────────

const MACRO_LINES = [
  { tag: 'DXY', text: 'Dollar Index weakening below 104.5 — risk assets gaining traction.' },
  { tag: 'RATES', text: 'US10Y yield holding at 4.41% as Fed rhetoric stays hawkish.' },
  { tag: 'CRYPTO', text: 'BTC dominance at 54.2% — altcoin rotation beginning.' },
  { tag: 'EQUITIES', text: 'S&P 500 futures pointing higher; tech sector leads.' },
];

function AIMacroDesk() {
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>AI Macro Desk</Text>
        <View style={styles.badgePrimary}><Text style={styles.badgePrimaryText}>LIVE</Text></View>
      </View>
      <View style={{ gap: 10, marginTop: 8 }}>
        {MACRO_LINES.map((l) => (
          <View key={l.tag} style={styles.macroLine}>
            <View style={styles.macroTag}><Text style={styles.macroTagText}>{l.tag}</Text></View>
            <Text style={styles.macroText}>{l.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Market Brief Card ────────────────────────────────────────────────────────

const BRIEF_ITEMS = [
  { time: '08:30', title: 'US Non-Farm Payrolls', impact: 'HIGH' },
  { time: '10:00', title: 'ISM Services PMI', impact: 'MED' },
  { time: '14:00', title: 'Fed Member Speech', impact: 'MED' },
  { time: '18:30', title: 'EIA Crude Oil Stocks', impact: 'LOW' },
];

const impactColor: Record<string, string> = { HIGH: colors.bearish, MED: colors.neutral, LOW: colors.mutedForeground };

function MarketBriefCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Today's Brief</Text>
      <View style={{ gap: 8, marginTop: 8 }}>
        {BRIEF_ITEMS.map((b) => (
          <View key={b.time} style={styles.briefRow}>
            <Text style={styles.briefTime}>{b.time}</Text>
            <Text style={styles.briefTitle} numberOfLines={1}>{b.title}</Text>
            <View style={[styles.impactBadge, { backgroundColor: impactColor[b.impact] + '20' }]}>
              <Text style={[styles.impactText, { color: impactColor[b.impact] }]}>{b.impact}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Capital Flow Widget ─────────────────────────────────────────────────────

const FLOWS = [
  { label: 'Crypto', pct: 64, color: colors.primary },
  { label: 'Equities', pct: 48, color: colors.bullish },
  { label: 'Commodities', pct: 31, color: colors.neutral },
  { label: 'Bonds', pct: 22, color: colors.bearish },
];

function CapitalFlowWidget() {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Capital Flow</Text>
      <View style={{ gap: 8, marginTop: 8 }}>
        {FLOWS.map((f) => (
          <View key={f.label} style={{ gap: 3 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.flowLabel}>{f.label}</Text>
              <Text style={[styles.flowPct, { color: f.color }]}>{f.pct}%</Text>
            </View>
            <View style={styles.flowBar}>
              <View style={[styles.flowFill, { width: `${f.pct}%` as any, backgroundColor: f.color }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── For You Panel ────────────────────────────────────────────────────────────

const FOR_YOU = [
  { pair: 'BTC/USDT', reason: 'Strong breakout above $83k with volume surge', score: 82, trend: 'bullish' as const },
  { pair: 'SOL/USDT', reason: 'Momentum building after pullback to 20EMA', score: 91, trend: 'bullish' as const },
  { pair: 'XRP/USDT', reason: 'Consolidating near resistance — watch for break', score: 67, trend: 'bullish' as const },
  { pair: 'ADA/USDT', reason: 'Bearish divergence on RSI; risk to downside', score: 18, trend: 'bearish' as const },
];

function ForYouPanel({ navigation }: { navigation: any }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>For You</Text>
      <View style={{ gap: 8, marginTop: 8 }}>
        {FOR_YOU.map((f) => (
          <TouchableOpacity key={f.pair} onPress={() => navigation.navigate('PairDetail', { pair: f.pair })} activeOpacity={0.75}>
            <View style={[styles.forYouRow, { borderColor: heatColor(f.score) + '40' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.forYouPair}>{f.pair}</Text>
                <Text style={styles.forYouReason} numberOfLines={2}>{f.reason}</Text>
              </View>
              <View style={[styles.forYouScore, { backgroundColor: heatColor(f.score) + '20' }]}>
                <Text style={[styles.forYouScoreText, { color: heatColor(f.score) }]}>{f.score}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Scan Button ──────────────────────────────────────────────────────────────

function ScanButton({ isScanning, onScan }: { isScanning: boolean; onScan: () => void }) {
  const spin = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isScanning) {
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.linear })).start();
    } else {
      spin.stopAnimation();
      spin.setValue(0);
    }
  }, [isScanning]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <TouchableOpacity onPress={onScan} disabled={isScanning} activeOpacity={0.8} style={[styles.scanBtn, isScanning && styles.scanBtnActive]}>
      <Animated.Text style={[styles.scanIcon, { transform: [{ rotate }] }]}>⚡</Animated.Text>
      <Text style={styles.scanBtnText}>{isScanning ? 'Scanning…' : 'Run Scan'}</Text>
    </TouchableOpacity>
  );
}

// ─── Timeframe Selector ───────────────────────────────────────────────────────

const TF_OPTIONS = ['1m', '5m', '15m', '1H', '4H', '1D'];

function TimeframeSelector({ selected, onChange }: { selected: string; onChange: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}>
      {TF_OPTIONS.map((tf) => (
        <TouchableOpacity key={tf} onPress={() => onChange(tf)} style={[styles.tfChip, selected === tf && styles.tfChipActive]}>
          <Text style={[styles.tfText, selected === tf && styles.tfTextActive]}>{tf}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Main Dashboard Screen ────────────────────────────────────────────────────

type Props = { navigation: any };

export function DashboardScreen({ navigation }: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const [timeframe, setTimeframe] = useState('1H');

  // Mock stats – replace with real hooks
  const stats = useMemo(() => ({
    total: 42, bullish: 18, bearish: 11, neutral: 13, avg: 63, strongBull: 7, strongBear: 4,
  }), []);

  const avg = stats.avg;
  const sc = sentimentColor(avg);
  const sl = sentimentLabel(avg);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 3000);
  };

  return (
    <ScreenLayout title="Dashboard">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        nestedScrollEnabled
      >
        {/* Price Ticker */}
        <PriceTickerStrip />

        {/* Market Sessions */}
        <MarketSessionBar />

        {/* Header row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Good Morning 👋</Text>
            <Text style={styles.greetingSub}>Here's your market overview</Text>
          </View>
          <View style={styles.sentimentBadge}>
            <LiveDot color={sc} />
            <Text style={[styles.sentimentText, { color: sc }]}>{sl}</Text>
            <Text style={styles.sentimentAvg}>{avg}</Text>
          </View>
        </View>

        {/* Timeframe + Scan */}
        <View style={styles.rowBetween}>
          <TimeframeSelector selected={timeframe} onChange={setTimeframe} />
          <ScanButton isScanning={isScanning} onScan={handleScan} />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Total Pairs" value={stats.total} color={colors.primary} sub="Monitored" emoji="📊" />
          <StatCard label="Bullish" value={stats.bullish} color={colors.bullish} sub={`${stats.strongBull} strong`} emoji="📈" />
          <StatCard label="Bearish" value={stats.bearish} color={colors.bearish} sub={`${stats.strongBear} strong`} emoji="📉" />
          <StatCard label="Neutral" value={stats.neutral} color={colors.neutral} sub="Consolidating" emoji="➖" />
          <StatCard label="Avg Score" value={avg} color={sc} sub={sl} emoji="⚡" />
          <StatCard label="Auto-Scan" value="ON" color={colors.bullish} sub="Every 15m" emoji="🔄" />
        </View>

        {/* Heatmap */}
        <HeatmapWidget />

        {/* AI Macro Desk */}
        <AIMacroDesk />

        {/* Market Brief */}
        <MarketBriefCard />

        {/* Capital Flow */}
        <CapitalFlowWidget />

        {/* For You */}
        <ForYouPanel navigation={navigation} />

        {/* Quick nav */}
        <View style={[styles.card, styles.rowBetween]}>
          {(['Settings', 'News', 'Macro'] as const).map((route) => (
            <TouchableOpacity key={route} style={styles.quickBtn} onPress={() => navigation.navigate(route)}>
              <Text style={styles.quickBtnText}>{route}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    gap: 10,
    paddingBottom: 32,
  },

  // Ticker
  tickerRow: {
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tickerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tickerPair: { fontSize: 10, fontFamily: 'Menlo', color: colors.mutedForeground, textTransform: 'uppercase' },
  tickerPrice: { fontSize: 11, fontFamily: 'Menlo', color: colors.foreground, fontWeight: '600' },
  tickerChange: { fontSize: 10, fontFamily: 'Menlo' },

  // Session bar
  sessionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sessionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sessionDot: { width: 6, height: 6, borderRadius: 3 },
  sessionName: { fontSize: 9, fontFamily: 'Menlo', letterSpacing: 0.5 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 18, fontWeight: '700', color: colors.foreground, letterSpacing: -0.3 },
  greetingSub: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  sentimentBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.card, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: 5, paddingHorizontal: 8,
  },
  sentimentText: { fontSize: 10, fontFamily: 'Menlo', fontWeight: '700' },
  sentimentAvg: { fontSize: 10, fontFamily: 'Menlo', color: colors.mutedForeground },

  // Scan btn
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primary + '20',
    borderWidth: 1, borderColor: colors.primary + '50',
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12,
  },
  scanBtnActive: { backgroundColor: colors.primary + '30' },
  scanIcon: { fontSize: 12 },
  scanBtnText: { fontSize: 11, fontFamily: 'Menlo', color: colors.primary, fontWeight: '700' },

  // TF chip
  tfChip: {
    borderRadius: 6, paddingVertical: 4, paddingHorizontal: 9,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  tfChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary + '70' },
  tfText: { fontSize: 10, fontFamily: 'Menlo', color: colors.mutedForeground },
  tfTextActive: { color: colors.primary, fontWeight: '700' },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  statCard: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.card, borderRadius: 10, borderWidth: 1,
    padding: 10, flexGrow: 1,
  },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 9, fontFamily: 'Menlo', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '800', fontFamily: 'Menlo' },
  statSub: { fontSize: 8, color: colors.mutedForeground, marginTop: 1 },

  // Card base
  card: {
    backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, padding: 12,
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: colors.foreground, textTransform: 'uppercase', letterSpacing: 0.8 },

  // Heatmap
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  heatCell: {
    width: '22%', aspectRatio: 1.3, borderRadius: 8,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  heatPair: { fontSize: 9, fontFamily: 'Menlo', fontWeight: '700' },
  heatScore: { fontSize: 12, fontFamily: 'Menlo', fontWeight: '800' },

  // Macro
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badgePrimary: { backgroundColor: colors.primary + '20', borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6 },
  badgePrimaryText: { fontSize: 9, fontFamily: 'Menlo', color: colors.primary, fontWeight: '700' },
  macroLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  macroTag: { backgroundColor: colors.primary + '15', borderRadius: 4, paddingVertical: 1, paddingHorizontal: 5, marginTop: 1 },
  macroTagText: { fontSize: 8, fontFamily: 'Menlo', color: colors.primary, fontWeight: '700' },
  macroText: { flex: 1, fontSize: 11, color: colors.foreground, lineHeight: 16 },

  // Brief
  briefRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  briefTime: { fontSize: 10, fontFamily: 'Menlo', color: colors.mutedForeground, width: 38 },
  briefTitle: { flex: 1, fontSize: 11, color: colors.foreground },
  impactBadge: { borderRadius: 4, paddingVertical: 2, paddingHorizontal: 5 },
  impactText: { fontSize: 8, fontFamily: 'Menlo', fontWeight: '700' },

  // Flow
  flowLabel: { fontSize: 10, color: colors.mutedForeground, fontFamily: 'Menlo' },
  flowPct: { fontSize: 10, fontFamily: 'Menlo', fontWeight: '700' },
  flowBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  flowFill: { height: 4, borderRadius: 2 },

  // For You
  forYouRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.background, borderRadius: 8,
    borderWidth: 1, padding: 9,
  },
  forYouPair: { fontSize: 12, fontWeight: '700', color: colors.foreground, fontFamily: 'Menlo' },
  forYouReason: { fontSize: 10, color: colors.mutedForeground, marginTop: 2, lineHeight: 14 },
  forYouScore: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  forYouScoreText: { fontSize: 14, fontWeight: '800', fontFamily: 'Menlo' },

  // Quick nav
  quickBtn: {
    flex: 1, backgroundColor: colors.primary + '15', borderRadius: 8,
    borderWidth: 1, borderColor: colors.primary + '30',
    paddingVertical: 10, alignItems: 'center',
  },
  quickBtnText: { fontSize: 11, fontWeight: '700', color: colors.primary, fontFamily: 'Menlo' },
});