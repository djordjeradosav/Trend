import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabase'
import type { Session, User } from '@supabase/supabase-js'

export function useAuthSession() {
  const [session, setSession]   = useState<Session | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    // 1. Grab the current session immediately (resolves quickly from AsyncStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 2. Subscribe to future auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    session,
    loading,
    user: session?.user ?? null as User | null,
  }
}