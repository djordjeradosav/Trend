import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../utils/supabase'
import { C, S, R } from '../theme'

const { width } = Dimensions.get('window')

type Props = { navigation: any }

export default function LoginScreen({ navigation }: Props) {
  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [showPw,        setShowPw]        = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [forgotMode,    setForgotMode]    = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [message,       setMessage]       = useState<string | null>(null)

  // ── Sign in with email + password ────────────────────────────────────────
  async function handleLogin() {
    if (!email.trim() || !password) { setError('Fill in all fields'); return }
    setLoading(true); setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)
    if (err) setError(err.message)
    // On success, onAuthStateChange in App.tsx will flip the root to MainTabs
  }

  // ── Password reset ────────────────────────────────────────────────────────
  async function handleForgot() {
    if (!email.trim()) { setError('Enter your email first'); return }
    setLoading(true); setError(null); setMessage(null)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim())
    setLoading(false)
    if (err) setError(err.message)
    else     setMessage('Check your inbox for a reset link.')
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── Logo ──────────────────────────────────────────────────────── */}
          <View style={s.logoArea}>
            <View style={s.logoCircle}>
              <Text style={{ fontSize: 18 }}>📈</Text>
            </View>
            <Text style={s.appName}>TrendScan</Text>
            <View style={s.aiBadge}>
              <Text style={s.aiBadgeText}>AI</Text>
            </View>
          </View>

          <Text style={s.subtitle}>
            {forgotMode ? 'Reset your password' : 'Sign in to your account'}
          </Text>

          {/* ── Email ─────────────────────────────────────────────────────── */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>EMAIL</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>✉</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={t => { setEmail(t); setError(null) }}
                placeholder="you@example.com"
                placeholderTextColor={C.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* ── Password (login mode only) ────────────────────────────────── */}
          {!forgotMode && (
            <View style={s.fieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={s.fieldLabel}>PASSWORD</Text>
                <TouchableOpacity onPress={() => { setForgotMode(true); setError(null); setMessage(null) }}>
                  <Text style={{ color: C.green, fontSize: 11 }}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>🔒</Text>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={password}
                  onChangeText={t => { setPassword(t); setError(null) }}
                  placeholder="••••••••"
                  placeholderTextColor={C.muted}
                  secureTextEntry={!showPw}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 16 }}>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Feedback ──────────────────────────────────────────────────── */}
          {error   && <Text style={s.errorText}>{error}</Text>}
          {message && <Text style={s.successText}>{message}</Text>}

          {/* ── Primary CTA ───────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.6 }]}
            onPress={forgotMode ? handleForgot : handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={s.btnText}>{forgotMode ? 'Send reset link' : 'Sign in'}</Text>}
          </TouchableOpacity>

          {/* ── Switch ────────────────────────────────────────────────────── */}
          {forgotMode ? (
            <TouchableOpacity style={s.switchRow}
              onPress={() => { setForgotMode(false); setError(null); setMessage(null) }}>
              <Text style={{ color: C.green, fontSize: 13, fontWeight: '600' }}>
                ← Back to sign in
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={s.switchRow}>
              <Text style={s.switchText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={{ color: C.green, fontWeight: '600' }}>Sign up free</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Divider + social hint ─────────────────────────────────────── */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>secure · encrypted · private</Text>
            <View style={s.dividerLine} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  scroll:       { flexGrow: 1, justifyContent: 'center',
                  paddingHorizontal: S.xl, paddingVertical: S.xxl },

  // Logo
  logoArea:     { flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'center', gap: 8, marginBottom: S.sm },
  logoCircle:   { width: 40, height: 40, borderRadius: 20,
                  backgroundColor: C.greenBg, borderWidth: 1.5,
                  borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  appName:      { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  aiBadge:      { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 5,
                  paddingHorizontal: 8, paddingVertical: 3,
                  borderWidth: 0.5, borderColor: C.green },
  aiBadgeText:  { fontSize: 11, fontWeight: '800', color: C.green, letterSpacing: 0.8 },
  subtitle:     { fontSize: 14, color: C.muted, textAlign: 'center',
                  marginBottom: S.xl, marginTop: S.xs },

  // Fields
  fieldGroup:   { marginBottom: S.md },
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: C.muted,
                  letterSpacing: 1.2, marginBottom: 6 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center',
                  backgroundColor: C.surface, borderRadius: R.md,
                  borderWidth: 1, borderColor: C.border,
                  paddingHorizontal: S.md, height: 52 },
  inputIcon:    { fontSize: 15, marginRight: 10, opacity: 0.5 },
  input:        { flex: 1, fontSize: 15, color: C.text },

  // Feedback
  errorText:    { fontSize: 12, color: C.red, marginBottom: S.sm,
                  textAlign: 'center', fontWeight: '500' },
  successText:  { fontSize: 12, color: C.green, marginBottom: S.sm,
                  textAlign: 'center', fontWeight: '500' },

  // Button
  btn:          { backgroundColor: C.green, borderRadius: R.md, height: 52,
                  alignItems: 'center', justifyContent: 'center',
                  marginTop: S.sm, marginBottom: S.lg },
  btnText:      { fontSize: 16, fontWeight: '800', color: '#000' },

  // Switch row
  switchRow:    { flexDirection: 'row', justifyContent: 'center',
                  alignItems: 'center', marginBottom: S.xl },
  switchText:   { fontSize: 13, color: C.muted },

  // Divider
  dividerRow:   { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.sm },
  dividerLine:  { flex: 1, height: 0.5, backgroundColor: C.border },
  dividerText:  { fontSize: 10, color: C.dim, letterSpacing: 0.5 },
})