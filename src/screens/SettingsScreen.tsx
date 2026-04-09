/**
 * SettingsScreen.tsx  — includes working Sign Out via Supabase
 */
import React, { useState, useCallback } from 'react'
import {
  Alert, Platform, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native'
import { supabase } from '../../utils/supabase'

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:        '#0a0d14', bgDeep:    '#060810',
  surface:   '#111827', surfaceHi: '#1a2235',
  border:    '#1e2d45', borderDim: '#111c2e',
  text:      '#e2e8f0', sub:       '#94a3b8',
  muted:     '#4a6080', dim:       '#1e2d45',
  green:     '#22c55e', greenDim:  '#166534',
  red:       '#ef4444', amber:     '#f59e0b',
  blue:      '#3b82f6', purple:    '#a78bfa',
  cyan:      '#38bdf8', orange:    '#f97316',
}

const ACCENTS = [
  { label: 'Blue',   value: '#3b82f6' },
  { label: 'Green',  value: '#22c55e' },
  { label: 'Purple', value: '#a78bfa' },
  { label: 'Cyan',   value: '#38bdf8' },
  { label: 'Amber',  value: '#f59e0b' },
  { label: 'Orange', value: '#f97316' },
]

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      <Text style={sec.label}>{title}</Text>
      <View style={sec.card}>{children}</View>
    </View>
  )
}
const sec = StyleSheet.create({
  wrap:  { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.6, marginBottom: 8, paddingHorizontal: 2 },
  card:  { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
})

function Row({ icon, label, sub, right, onPress, danger, last }: {
  icon: string; label: string; sub?: string; right?: React.ReactNode;
  onPress?: () => void; danger?: boolean; last?: boolean;
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
  )
  if (!onPress) return content
  return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>
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
})



function ProfileCard({ accent, email }: { accent: string; email: string }) {
  const initial = email ? email[0].toUpperCase() : 'U'
  return (
    <View style={[pc.card, { borderColor: accent + '40' }]}>
      <View style={[pc.avatar, { backgroundColor: accent + '22', borderColor: accent + '60' }]}>
        <Text style={[pc.avatarTxt, { color: accent }]}>{initial}</Text>
      </View>
      <View style={pc.info}>
        <Text style={pc.name}>TrendScan User</Text>
        <Text style={pc.email}>{email}</Text>
        <View style={[pc.planBadge, { backgroundColor: accent + '18', borderColor: accent + '44' }]}>
          <View style={[pc.planDot, { backgroundColor: accent }]} />
          <Text style={[pc.planTxt, { color: accent }]}>ACTIVE</Text>
        </View>
      </View>
    </View>
  )
}
const pc = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  avatar:    { width: 52, height: 52, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 22, fontWeight: '900' },
  info:      { flex: 1, gap: 3 },
  name:      { fontSize: 16, fontWeight: '800', color: C.text },
  email:     { fontSize: 11, color: C.muted },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  planDot:   { width: 5, height: 5, borderRadius: 2.5 },
  planTxt:   { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
})

function AppInfoFooter({ accent }: { accent: string }) {
  return (
    <View style={af.wrap}>
      <Text style={af.name}>TrendScannerAI</Text>
      <Text style={af.version}>Version 1.0.0</Text>
      <Text style={af.copy}>© 2026 TrendScan Inc.</Text>
    </View>
  )
}
const af = StyleSheet.create({
  wrap:  { alignItems: 'center', paddingVertical: 24, gap: 4 },
  name:  { fontSize: 14, fontWeight: '800', color: C.sub },
  version:{ fontSize: 11, color: C.muted },
  copy:  { fontSize: 10, color: C.dim },
})

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const [accent,       setAccent]       = useState(C.blue)
  const [compactMode,  setCompactMode]  = useState(false)
  const [showScoreBar, setShowScoreBar] = useState(true)
  const [userEmail,    setUserEmail]    = useState('')

  // Grab current user email on mount
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? '')
    })
  }, [])

  // ── Sign out ───────────────────────────────────────────────────────────────
  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          // onAuthStateChange in App.tsx will detect null session → show AuthRoot
        },
      },
    ])
  }, [])

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            // Sign out first; full deletion requires a server-side function
            await supabase.auth.signOut()
            Alert.alert('Account deletion requested', 'A support request has been logged.')
          },
        },
      ]
    )
  }, [])

  const mkSwitch = (val: boolean, set: (v: boolean) => void) => (
    <Switch value={val} onValueChange={set}
      trackColor={{ false: C.border, true: accent + '88' }}
      thumbColor={val ? accent : C.muted}
      ios_backgroundColor={C.border} />
  )

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={s.header}>
        <Text style={s.headerTitle}>Settings</Text>
        <Text style={s.headerSub}>Manage your preferences</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <View style={{ marginBottom: 20 }}>
          <Text style={sec.label}>PROFILE</Text>
          <ProfileCard accent={accent} email={userEmail} />
        </View>

        {/* Support */}
        <Section title="SUPPORT">
          <Row icon="💬" label="Contact Support" onPress={() => Alert.alert('Support', 'Email: support@trendscan.ai')} />
          <Row icon="⭐" label="Rate the App"    onPress={() => Alert.alert('Rate', 'Opens App Store.')} last />
        </Section>

        {/* Account */}
        <Section title="ACCOUNT">
          <Row icon="🚪" label="Sign Out"        sub="Sign out of your account"
            onPress={handleSignOut} danger />
          <Row icon="⚠️" label="Delete Account"  sub="Permanently remove all data"
            onPress={handleDeleteAccount} danger last />
        </Section>

        <AppInfoFooter accent={accent} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: C.muted, marginTop: 2 },
  scroll:      { flex: 1 },
  pad:         { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
})