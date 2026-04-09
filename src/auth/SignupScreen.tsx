import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../utils/supabase'
import { C, S, R } from '../theme'

/* VIP list — these users bypass the trial timer */
const VIP_EMAILS = [
  'radosavljevicdjordje01@gmail.com',
  'djolenosmile@gmail.com',
  'seriouslyabsurd01@gmail.com',
]

type Props = { navigation: any }

export default function SignupScreen({ navigation }: Props) {
  const [email,    setEmail]    = useState('')
  const [pw,       setPw]       = useState('')
  const [pw2,      setPw2]      = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [message,  setMessage]  = useState<string | null>(null)

  /* ── Provision user_access + user_settings rows ─────────────────────────── */
  async function provisionUser(userId: string, userEmail: string) {
    const isVIP  = VIP_EMAILS.includes(userEmail.toLowerCase())
    const trial  = new Date(Date.now() + 7 * 86_400_000).toISOString()

    await supabase.from('user_access').upsert({
      user_id:             userId,
      email:               userEmail.toLowerCase(),
      plan_type:           isVIP ? 'vip' : 'trial',
      subscription_status: 'active',
      trial_expires_at:    isVIP ? null : trial,
    }, { onConflict: 'user_id' })

    await supabase.from('user_settings').upsert(
      { user_id: userId },
      { onConflict: 'user_id' }
    )
  }

  /* ── Sign up ─────────────────────────────────────────────────────────────── */
  async function handleSignup() {
    setError(null); setMessage(null)
    if (!email.trim() || !pw)  { setError('Fill in all fields'); return }
    if (pw !== pw2)             { setError('Passwords do not match'); return }
    if (pw.length < 6)          { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password: pw,
    })
    if (err) { setLoading(false); setError(err.message); return }

    if (data.user) await provisionUser(data.user.id, email.trim())
    setLoading(false)
    setMessage('Check your email for a confirmation link.')
  }

  const fields = [
    { label: 'EMAIL',            val: email, set: setEmail,
      ph: 'you@example.com', type: 'email-address' as const, secure: false },
    { label: 'PASSWORD',         val: pw,    set: setPw,
      ph: 'At least 6 characters', type: 'default' as const, secure: !showPw },
    { label: 'CONFIRM PASSWORD', val: pw2,   set: setPw2,
      ph: 'Repeat password', type: 'default' as const, secure: !showPw },
  ]

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Logo ──────────────────────────────────────────────────── */}
          <View style={s.logoArea}>
            <View style={s.logoCircle}>
              <Text style={{ fontSize: 18 }}>📈</Text>
            </View>
            <Text style={s.appName}>TrendScan</Text>
            <View style={s.aiBadge}>
              <Text style={s.aiBadgeText}>AI</Text>
            </View>
          </View>

          <Text style={s.subtitle}>Create your free account</Text>

          <View style={s.trialBadge}>
            <Text style={s.trialText}>✓  7-day free trial · No card required</Text>
          </View>

          {/* ── Fields ────────────────────────────────────────────────── */}
          {fields.map(f => (
            <View key={f.label} style={s.fieldGroup}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>{f.label.startsWith('EMAIL') ? '✉' : '🔒'}</Text>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={f.val}
                  onChangeText={t => { f.set(t); setError(null) }}
                  placeholder={f.ph}
                  placeholderTextColor={C.muted}
                  autoCapitalize="none"
                  keyboardType={f.type}
                  secureTextEntry={f.secure}
                  returnKeyType="next"
                />
                {f.label === 'PASSWORD' && (
                  <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 16 }}>{showPw ? '🙈' : '👁'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {/* ── Feedback ──────────────────────────────────────────────── */}
          {error   && <Text style={s.errorText}>{error}</Text>}
          {message && <Text style={s.successText}>{message}</Text>}

          {/* ── Submit ────────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.6 }]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={s.btnText}>Create account</Text>}
          </TouchableOpacity>

          {/* ── Switch ────────────────────────────────────────────────── */}
          <View style={s.switchRow}>
            <Text style={s.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={{ color: C.green, fontWeight: '600' }}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  scroll:      { flexGrow: 1, justifyContent: 'center',
                 paddingHorizontal: S.xl, paddingVertical: S.xxl },
  logoArea:    { flexDirection: 'row', alignItems: 'center',
                 justifyContent: 'center', gap: 8, marginBottom: S.sm },
  logoCircle:  { width: 40, height: 40, borderRadius: 20,
                 backgroundColor: C.greenBg, borderWidth: 1.5,
                 borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  appName:     { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  aiBadge:     { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 5,
                 paddingHorizontal: 8, paddingVertical: 3,
                 borderWidth: 0.5, borderColor: C.green },
  aiBadgeText: { fontSize: 11, fontWeight: '800', color: C.green, letterSpacing: 0.8 },
  subtitle:    { fontSize: 14, color: C.muted, textAlign: 'center',
                 marginBottom: S.sm, marginTop: S.xs },
  trialBadge:  { backgroundColor: C.greenBg, borderRadius: R.md, padding: S.sm,
                 alignItems: 'center', marginBottom: S.lg,
                 borderWidth: 0.5, borderColor: C.green + '60' },
  trialText:   { fontSize: 12, color: C.green, fontWeight: '600' },
  fieldGroup:  { marginBottom: S.md },
  fieldLabel:  { fontSize: 10, fontWeight: '700', color: C.muted,
                 letterSpacing: 1.2, marginBottom: 6 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center',
                 backgroundColor: C.surface, borderRadius: R.md,
                 borderWidth: 1, borderColor: C.border,
                 paddingHorizontal: S.md, height: 52 },
  inputIcon:   { fontSize: 15, marginRight: 10, opacity: 0.5 },
  input:       { fontSize: 15, color: C.text },
  errorText:   { fontSize: 12, color: C.red, marginBottom: S.sm,
                 textAlign: 'center', fontWeight: '500' },
  successText: { fontSize: 12, color: C.green, marginBottom: S.sm,
                 textAlign: 'center', fontWeight: '500' },
  btn:         { backgroundColor: C.green, borderRadius: R.md, height: 52,
                 alignItems: 'center', justifyContent: 'center',
                 marginTop: S.sm, marginBottom: S.lg },
  btnText:     { fontSize: 16, fontWeight: '800', color: '#000' },
  switchRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText:  { fontSize: 13, color: C.muted },
})