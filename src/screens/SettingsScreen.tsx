/**
 * SettingsScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-featured settings page for TrendScannerAI.
 * Theme aligned to the dark navy aesthetic across the app.
 *
 * Sections:
 *   1. Profile card
 *   2. Scan Preferences  (timeframe, auto-scan interval, pair limit)
 *   3. Alerts & Notifications
 *   4. Appearance        (theme toggle, accent color)
 *   5. Data & Privacy
 *   6. Account           (sign out, delete account)
 *   7. App info footer
 */

import React, { useState, useCallback } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:        '#0a0d14',
  bgDeep:    '#060810',
  surface:   '#111827',
  surfaceHi: '#1a2235',
  border:    '#1e2d45',
  borderDim: '#111c2e',
  text:      '#e2e8f0',
  sub:       '#94a3b8',
  muted:     '#4a6080',
  dim:       '#1e2d45',
  green:     '#22c55e',
  greenDim:  '#166534',
  red:       '#ef4444',
  amber:     '#f59e0b',
  blue:      '#3b82f6',
  purple:    '#a78bfa',
  cyan:      '#38bdf8',
  orange:    '#f97316',
};

// ─── ACCENT COLORS ────────────────────────────────────────────────────────────
const ACCENTS = [
  { label: 'Blue',   value: '#3b82f6' },
  { label: 'Green',  value: '#22c55e' },
  { label: 'Purple', value: '#a78bfa' },
  { label: 'Cyan',   value: '#38bdf8' },
  { label: 'Amber',  value: '#f59e0b' },
  { label: 'Orange', value: '#f97316' },
];

const SCAN_INTERVALS = ['5m', '15m', '30m', '1h', '4h'];
const TIMEFRAMES     = ['1m', '5m', '15m', '1h', '4h', '1D'];
const PAIR_LIMITS    = ['20', '50', '100', 'All'];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

/** Section wrapper with a label */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      <Text style={sec.label}>{title}</Text>
      <View style={sec.card}>{children}</View>
    </View>
  );
}
const sec = StyleSheet.create({
  wrap:  { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.6, marginBottom: 8, paddingHorizontal: 2 },
  card:  { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
});

/** A standard row: icon + label + right element */
function Row({
  icon, label, sub, right, onPress, danger, last,
}: {
  icon: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const content = (
    <View style={[row.wrap, !last && row.divider]}>
      <View style={[row.iconWrap, danger && { backgroundColor: C.red + '18' }]}>
        <Text style={row.icon}>{icon}</Text>
      </View>
      <View style={row.text}>
        <Text style={[row.label, danger && { color: C.red }]}>{label}</Text>
        {sub ? <Text style={row.sub}>{sub}</Text> : null}
      </View>
      {right ?? (onPress ? <Text style={row.chevron}>›</Text> : null)}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}
const row = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  divider:  { borderBottomWidth: 1, borderBottomColor: C.borderDim },
  iconWrap: { width: 34, height: 34, borderRadius: 9, backgroundColor: C.surfaceHi, alignItems: 'center', justifyContent: 'center' },
  icon:     { fontSize: 16 },
  text:     { flex: 1 },
  label:    { fontSize: 14, fontWeight: '600', color: C.text },
  sub:      { fontSize: 11, color: C.muted, marginTop: 2 },
  chevron:  { fontSize: 20, color: C.muted, fontWeight: '300' },
});

/** A horizontal pill-selector (used for intervals, timeframes, etc.) */
function PillSelector({
  options, selected, onSelect, accent = C.blue,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  accent?: string;
}) {
  return (
    <View style={pills.row}>
      {options.map(o => {
        const on = o === selected;
        return (
          <TouchableOpacity
            key={o}
            style={[pills.pill, on && { backgroundColor: accent + '28', borderColor: accent }]}
            onPress={() => onSelect(o)}
          >
            <Text style={[pills.txt, { color: on ? accent : C.muted }]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const pills = StyleSheet.create({
  row:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  txt:  { fontSize: 11, fontWeight: '700' },
});

/** Inline pill selector row (used inside a Row component) */
function RowWithPills({
  icon, label, sub, options, selected, onSelect, accent, last,
}: {
  icon: string; label: string; sub?: string;
  options: string[]; selected: string; onSelect: (v: string) => void;
  accent?: string; last?: boolean;
}) {
  return (
    <View style={[rwp.wrap, !last && { borderBottomWidth: 1, borderBottomColor: C.borderDim }]}>
      <View style={rwp.top}>
        <View style={row.iconWrap}>
          <Text style={row.icon}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={row.label}>{label}</Text>
          {sub ? <Text style={row.sub}>{sub}</Text> : null}
        </View>
      </View>
      <View style={rwp.pillsWrap}>
        <PillSelector options={options} selected={selected} onSelect={onSelect} accent={accent} />
      </View>
    </View>
  );
}
const rwp = StyleSheet.create({
  wrap:      { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  top:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  pillsWrap: { paddingLeft: 48 },
});

// ─── PROFILE CARD ─────────────────────────────────────────────────────────────
function ProfileCard({ accent }: { accent: string }) {
  return (
    <View style={[pc.card, { borderColor: accent + '40' }]}>
      <View style={[pc.avatar, { backgroundColor: accent + '22', borderColor: accent + '60' }]}>
        <Text style={[pc.avatarTxt, { color: accent }]}>TS</Text>
      </View>
      <View style={pc.info}>
        <Text style={pc.name}>TrendScan User</Text>
        <Text style={pc.email}>user@trendscan.ai</Text>
        <View style={[pc.planBadge, { backgroundColor: accent + '18', borderColor: accent + '44' }]}>
          <View style={[pc.planDot, { backgroundColor: accent }]} />
          <Text style={[pc.planTxt, { color: accent }]}>PRO PLAN</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[pc.editBtn, { borderColor: accent + '50', backgroundColor: accent + '10' }]}
        onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon.')}
      >
        <Text style={[pc.editTxt, { color: accent }]}>Edit</Text>
      </TouchableOpacity>
    </View>
  );
}
const pc = StyleSheet.create({
  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  avatar:     { width: 52, height: 52, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontSize: 18, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  info:       { flex: 1, gap: 3 },
  name:       { fontSize: 16, fontWeight: '800', color: C.text },
  email:      { fontSize: 11, color: C.muted },
  planBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  planDot:    { width: 5, height: 5, borderRadius: 2.5 },
  planTxt:    { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  editBtn:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9, borderWidth: 1 },
  editTxt:    { fontSize: 12, fontWeight: '700' },
});

// ─── ACCENT PICKER ────────────────────────────────────────────────────────────
function AccentPicker({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  return (
    <View style={ap.row}>
      {ACCENTS.map(a => {
        const on = a.value === selected;
        return (
          <TouchableOpacity
            key={a.value}
            style={[ap.swatch, { backgroundColor: a.value + (on ? 'ff' : '30'), borderColor: on ? a.value : C.border }]}
            onPress={() => onSelect(a.value)}
          >
            {on && <Text style={ap.check}>✓</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const ap = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 10, paddingLeft: 48 },
  swatch:{ width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  check: { fontSize: 13, color: '#000', fontWeight: '900' },
});

// ─── APP INFO FOOTER ──────────────────────────────────────────────────────────
function AppInfoFooter({ accent }: { accent: string }) {
  return (
    <View style={af.wrap}>
      <View style={[af.logo, { borderColor: accent + '40' }]}>
        <Text style={[af.logoTxt, { color: accent }]}>TS</Text>
      </View>
      <Text style={af.name}>TrendScannerAI</Text>
      <Text style={af.version}>Version 1.0.0  ·  Build 42</Text>
      <Text style={af.copy}>© 2026 TrendScan Inc.  ·  All rights reserved</Text>
      <View style={af.links}>
        {['Privacy Policy', 'Terms of Service', 'Support'].map((l, i) => (
          <React.Fragment key={l}>
            {i > 0 && <Text style={af.dot}>·</Text>}
            <TouchableOpacity onPress={() => Alert.alert(l, 'Opens in browser.')}>
              <Text style={[af.link, { color: accent }]}>{l}</Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
const af = StyleSheet.create({
  wrap:    { alignItems: 'center', paddingVertical: 24, gap: 5 },
  logo:    { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 4, backgroundColor: C.surface },
  logoTxt: { fontSize: 15, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  name:    { fontSize: 14, fontWeight: '800', color: C.sub },
  version: { fontSize: 11, color: C.muted },
  copy:    { fontSize: 10, color: C.dim, marginTop: 2 },
  links:   { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  link:    { fontSize: 11, fontWeight: '600' },
  dot:     { fontSize: 10, color: C.dim },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
 
  // ── Appearance
  const [accent,         setAccent]         = useState(C.blue);
  const [compactMode,    setCompactMode]    = useState(false);
  const [showScoreBar,   setShowScoreBar]   = useState(true);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => Alert.alert('Signed out') },
    ]);
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Account deleted') },
      ]
    );
  }, []);

  const mkSwitch = (val: boolean, set: (v: boolean) => void) => (
    <Switch
      value={val}
      onValueChange={set}
      trackColor={{ false: C.border, true: accent + '88' }}
      thumbColor={val ? accent : C.muted}
      ios_backgroundColor={C.border}
    />
  );

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Settings</Text>
        <Text style={s.headerSub}>Manage your preferences</Text>
      </View>

      {/* ── BODY ────────────────────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.pad}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <View style={{ marginBottom: 20 }}>
          <Text style={sec.label}>PROFILE</Text>
          <ProfileCard accent={accent} />
        </View>

     
        {/* ── APPEARANCE ────────────────────────────────────────────── */}
        <Section title="APPEARANCE">
          <View style={[rwp.wrap, { borderBottomWidth: 1, borderBottomColor: C.borderDim }]}>
            <View style={rwp.top}>
              <View style={row.iconWrap}><Text style={row.icon}>🎨</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={row.label}>Accent Color</Text>
                <Text style={row.sub}>Highlight color used throughout the app</Text>
              </View>
            </View>
            <AccentPicker selected={accent} onSelect={setAccent} />
          </View>
          <Row
            icon="📐"
            label="Compact Mode"
            sub="Reduce card padding for more data density"
            right={mkSwitch(compactMode, setCompactMode)}
          />
          <Row
            icon="📊"
            label="Show Score Bar"
            sub="Display score progress bar on pair cards"
            right={mkSwitch(showScoreBar, setShowScoreBar)}
            last
          />
        </Section>

        {/* ── DATA & PRIVACY ────────────────────────────────────────── */}
        <Section title="DATA & PRIVACY">
         
          
          <Row
            icon="📤"
            label="Export My Data"
            sub="Download a copy of your scan history"
            onPress={() => Alert.alert('Export', 'Your data export will be emailed to you.')}
            last
          />
        </Section>

        {/* ── SUBSCRIPTION ──────────────────────────────────────────── */}
        <Section title="SUBSCRIPTION">
          <Row
            icon="⭐"
            label="Manage Plan"
            sub="PRO · Renews Apr 15, 2026"
            onPress={() => Alert.alert('Subscription', 'Opens plan management.')}
          />
          <Row
            icon="🧾"
            label="Billing History"
            sub="View past invoices and payments"
            onPress={() => Alert.alert('Billing', 'Opens billing portal.')}
            last
          />
        </Section>

        {/* ── SUPPORT ───────────────────────────────────────────────── */}
        <Section title="SUPPORT">
          <Row
            icon="💬"
            label="Contact Support"
            sub="Get help from our team"
            onPress={() => Alert.alert('Support', 'Opens support chat.')}
          />
          <Row
            icon="📖"
            label="Documentation"
            sub="Guides, FAQs, and API reference"
            onPress={() => Alert.alert('Docs', 'Opens documentation.')}
          />
          <Row
            icon="⭐"
            label="Rate the App"
            sub="Leave a review on the App Store"
            onPress={() => Alert.alert('Rate', 'Opens App Store.')}
            last
          />
        </Section>

        {/* ── ACCOUNT ───────────────────────────────────────────────── */}
        <Section title="ACCOUNT">
          <Row
            icon="🚪"
            label="Sign Out"
            sub="Sign out of your account"
            onPress={handleSignOut}
            danger
          />
          <Row
            icon="⚠️"
            label="Delete Account"
            sub="Permanently delete all your data"
            onPress={handleDeleteAccount}
            danger
            last
          />
        </Section>

        {/* Footer */}
        <AppInfoFooter accent={accent} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ROOT STYLES ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: C.muted, marginTop: 2 },
  scroll:      { flex: 1 },
  pad:         { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
});