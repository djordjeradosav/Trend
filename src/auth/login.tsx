import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { supabase } from '../../src/api/client'
import { C, S, R } from '../../src/theme'

WebBrowser.maybeCompleteAuthSession()

export default function Login() {
  const router = useRouter()
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [forgotMode,  setForgotMode]  = useState(false)
  const [message,     setMessage]     = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)
    if (err) setError(err.message)
    // navigation handled by _layout.tsx auth guard
  }

  async function handleForgot() {
    if (!email.trim()) { setError('Enter your email first'); return }
    setLoading(true)
    setError(null)
    setMessage(null)
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim()
    )
    setLoading(false)
    if (err) setError(err.message)
    else     setMessage('Check your email for a reset link.')
  }

  async function handleGoogleLogin() {
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
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token, refresh_token,
          })
          if (sessionErr) throw sessionErr
        }
      }
    } catch (e: any) {
      setError(e.message ?? 'Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.logoArea}>
            <View style={s.logoCircle}>
              <Text style={s.logoIcon}>📈</Text>
            </View>
            <Text style={s.appName}>TrendScan</Text>
            <View style={s.aiBadge}>
              <Text style={s.aiBadgeText}>AI</Text>
            </View>
          </View>

          <Text style={s.subtitle}>
            {forgotMode ? 'Reset your password' : 'Sign in to your account'}
          </Text>

          {/* Google button — only in login mode */}
          {!forgotMode && (
            <>
              <TouchableOpacity
                style={[s.googleBtn, googleLoading && { opacity: 0.6 }]}
                onPress={handleGoogleLogin}
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
            </>
          )}

          {/* Email field */}
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
                autoComplete="email"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password field — only in login mode */}
          {!forgotMode && (
            <View style={s.fieldGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={s.fieldLabel}>PASSWORD</Text>
                <TouchableOpacity onPress={() => {
                  setForgotMode(true)
                  setError(null)
                  setMessage(null)
                }}>
                  <Text style={s.forgotLink}>Forgot password?</Text>
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
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 16 }}>{showPw ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Feedback */}
          {error   && <Text style={s.errorText}>{error}</Text>}
          {message && <Text style={s.successText}>{message}</Text>}

          {/* Primary CTA */}
          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.6 }]}
            onPress={forgotMode ? handleForgot : handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={s.btnText}>
                  {forgotMode ? 'Send reset link' : 'Sign in'}
                </Text>}
          </TouchableOpacity>

          {/* Toggle forgot / back */}
          {forgotMode ? (
            <TouchableOpacity style={s.switchRow} onPress={() => {
              setForgotMode(false)
              setError(null)
              setMessage(null)
            }}>
              <Text style={s.switchText}>
                ← <Text style={{ color: C.green }}>Back to sign in</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={s.switchRow}>
              <Text style={s.switchText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/auth/signup')}>
                <Text style={{ color: C.green, fontWeight: '600' }}>Sign up</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  scroll:      { flexGrow: 1, justifyContent: 'center',
                 paddingHorizontal: S.xl, paddingVertical: S.xxl },
  logoArea:    { flexDirection: 'row', alignItems: 'center',
                 justifyContent: 'center', gap: 8, marginBottom: S.sm },
  logoCircle:  { width: 36, height: 36, borderRadius: 18,
                 backgroundColor: C.greenBg, borderWidth: 1,
                 borderColor: C.green, alignItems: 'center',
                 justifyContent: 'center' },
  logoIcon:    { fontSize: 18 },
  appName:     { fontSize: 24, fontWeight: '700', color: C.text },
  aiBadge:     { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 4,
                 paddingHorizontal: 7, paddingVertical: 2, borderWidth: 0.5,
                 borderColor: C.green },
  aiBadgeText: { fontSize: 11, fontWeight: '700', color: C.green, letterSpacing: 0.5 },
  subtitle:    { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: S.xl },

  googleBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                 gap: 10, backgroundColor: C.surface, borderRadius: R.md,
                 borderWidth: 0.5, borderColor: C.border,
                 height: 50, marginBottom: S.md },
  googleIcon:  { fontSize: 16, fontWeight: '900', color: '#4285F4' },
  googleBtnText:{ fontSize: 15, fontWeight: '600', color: C.text },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginBottom: S.md },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: C.border },
  dividerText: { fontSize: 12, color: C.muted },

  fieldGroup:  { marginBottom: S.md },
  fieldLabel:  { fontSize: 10, fontWeight: '600', color: C.muted,
                 letterSpacing: 0.8, marginBottom: 6 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center',
                 backgroundColor: C.surface, borderRadius: R.md,
                 borderWidth: 0.5, borderColor: C.border,
                 paddingHorizontal: S.md, height: 48 },
  inputIcon:   { fontSize: 14, marginRight: 8, opacity: 0.6 },
  input:       { flex: 1, fontSize: 14, color: C.text },
  forgotLink:  { fontSize: 11, color: C.green },
  errorText:   { fontSize: 12, color: C.red, marginBottom: S.sm, textAlign: 'center' },
  successText: { fontSize: 12, color: C.green, marginBottom: S.sm, textAlign: 'center' },
  btn:         { backgroundColor: C.green, borderRadius: R.md,
                 height: 50, alignItems: 'center', justifyContent: 'center',
                 marginTop: S.sm, marginBottom: S.lg },
  btnText:     { fontSize: 15, fontWeight: '700', color: '#000' },
  switchRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText:  { fontSize: 13, color: C.muted },
})