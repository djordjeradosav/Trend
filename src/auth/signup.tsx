import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { supabase } from '../../src/api/client'
import { C, S, R } from '../../src/theme'

WebBrowser.maybeCompleteAuthSession()

const VIP = [
  'radosavljevicdjordje01@gmail.com',
  'djolenosmile@gmail.com',
  'seriouslyabsurd01@gmail.com',
]

export default function Signup() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [pw,       setPw]       = useState('')
  const [pw2,      setPw2]      = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [message,  setMessage]  = useState<string | null>(null)

  async function handleSignup() {
    setError(null)
    setMessage(null)
    if (!email.trim() || !pw) { setError('Fill in all fields'); return }
    if (pw !== pw2)            { setError('Passwords do not match'); return }
    if (pw.length < 6)         { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password: pw,
    })

    if (err) { setLoading(false); setError(err.message); return }

    if (data.user) {
      await provisionUser(data.user.id, email.trim())
    }
    setLoading(false)
    setMessage('Check your email for a confirmation link.')
  }

  async function provisionUser(userId: string, userEmail: string) {
    const isVIP = VIP.includes(userEmail.toLowerCase())
    const trial = new Date(Date.now() + 7 * 86_400_000).toISOString()
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

  async function handleGoogleSignup() {
    setGoogleLoading(true)
    setError(null)
    try {
      const redirectTo = makeRedirectUri({ scheme: 'trendscan' })
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      })
      if (err) throw err
      if (!data?.url) throw new Error('No OAuth URL returned')

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url)
        const access_token  = url.searchParams.get('access_token')
        const refresh_token = url.searchParams.get('refresh_token')
        if (access_token && refresh_token) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token, refresh_token,
          })
          if (sessionErr) throw sessionErr
          // Provision trial for new Google users
          if (sessionData?.user) {
            await provisionUser(sessionData.user.id, sessionData.user.email ?? '')
          }
        }
      }
    } catch (e: any) {
      setError(e.message ?? 'Google sign-up failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  const fields = [
    { label: 'EMAIL',            val: email, set: setEmail, ph: 'you@example.com',
      type: 'email-address' as const, secure: false, icon: '✉', cap: 'none' as const },
    { label: 'PASSWORD',         val: pw,    set: setPw,    ph: 'At least 6 characters',
      type: 'default'       as const, secure: !showPw, icon: '🔒', cap: 'none' as const },
    { label: 'CONFIRM PASSWORD', val: pw2,   set: setPw2,   ph: 'Repeat password',
      type: 'default'       as const, secure: !showPw, icon: '🔒', cap: 'none' as const },
  ]

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={s.logoArea}>
            <View style={s.logoCircle}>
              <Text style={{ fontSize: 18 }}>📈</Text>
            </View>
            <Text style={s.appName}>TrendScan</Text>
            <View style={s.aiBadge}>
              <Text style={s.aiBadgeText}>AI</Text>
            </View>
          </View>

          <Text style={s.subtitle}>Create your account</Text>

          <View style={s.trialBadge}>
            <Text style={s.trialText}>✓ 7-day free trial · No card required</Text>
          </View>

          {/* Google button */}
          <TouchableOpacity
            style={[s.googleBtn, googleLoading && { opacity: 0.6 }]}
            onPress={handleGoogleSignup}
            disabled={googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading
              ? <ActivityIndicator color={C.text} size="small" />
              : <>
                  <Text style={s.googleIcon}>G</Text>
                  <Text style={s.googleBtnText}>Continue with Google</Text>
                </>}
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Fields */}
          {fields.map(f => (
            <View key={f.label} style={s.fieldGroup}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>{f.icon}</Text>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={f.val}
                  onChangeText={t => { f.set(t); setError(null) }}
                  placeholder={f.ph}
                  placeholderTextColor={C.muted}
                  autoCapitalize={f.cap}
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

          {error   && <Text style={s.errorText}>{error}</Text>}
          {message && <Text style={s.successText}>{message}</Text>}

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

          <View style={s.switchRow}>
            <Text style={s.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={{ color: C.green, fontWeight: '600' }}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  scroll:       { flexGrow: 1, justifyContent: 'center',
                  paddingHorizontal: S.xl, paddingVertical: S.xxl },
  logoArea:     { flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'center', gap: 8, marginBottom: S.sm },
  logoCircle:   { width: 36, height: 36, borderRadius: 18,
                  backgroundColor: C.greenBg, borderWidth: 1,
                  borderColor: C.green, alignItems: 'center',
                  justifyContent: 'center' },
  appName:      { fontSize: 24, fontWeight: '700', color: C.text },
  aiBadge:      { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 4,
                  paddingHorizontal: 7, paddingVertical: 2,
                  borderWidth: 0.5, borderColor: C.green },
  aiBadgeText:  { fontSize: 11, fontWeight: '700', color: C.green, letterSpacing: 0.5 },
  subtitle:     { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: S.sm },
  trialBadge:   { backgroundColor: C.greenBg, borderRadius: R.md, padding: S.sm,
                  alignItems: 'center', marginBottom: S.lg,
                  borderWidth: 0.5, borderColor: C.green + '60' },
  trialText:    { fontSize: 12, color: C.green, fontWeight: '500' },

  googleBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 10, backgroundColor: C.surface, borderRadius: R.md,
                  borderWidth: 0.5, borderColor: C.border,
                  height: 50, marginBottom: S.md },
  googleIcon:   { fontSize: 16, fontWeight: '900', color: '#4285F4' },
  googleBtnText:{ fontSize: 15, fontWeight: '600', color: C.text },

  dividerRow:   { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.md },
  dividerLine:  { flex: 1, height: 0.5, backgroundColor: C.border },
  dividerText:  { fontSize: 12, color: C.muted },

  fieldGroup:   { marginBottom: S.md },
  fieldLabel:   { fontSize: 10, fontWeight: '600', color: C.muted,
                  letterSpacing: 0.8, marginBottom: 6 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center',
                  backgroundColor: C.surface, borderRadius: R.md,
                  borderWidth: 0.5, borderColor: C.border,
                  paddingHorizontal: S.md, height: 48 },
  inputIcon:    { fontSize: 14, marginRight: 8, opacity: 0.6 },
  input:        { fontSize: 14, color: C.text },
  errorText:    { fontSize: 12, color: C.red, marginBottom: S.sm, textAlign: 'center' },
  successText:  { fontSize: 12, color: C.green, marginBottom: S.sm, textAlign: 'center' },
  btn:          { backgroundColor: C.green, borderRadius: R.md, height: 50,
                  alignItems: 'center', justifyContent: 'center',
                  marginTop: S.sm, marginBottom: S.lg },
  btnText:      { fontSize: 15, fontWeight: '700', color: '#000' },
  switchRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText:   { fontSize: 13, color: C.muted },
})