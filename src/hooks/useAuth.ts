import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User } from 'firebase/auth'
import { auth, provider } from '../firebase/config'

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = () => signInWithPopup(auth, provider)
  const signOut = () => fbSignOut(auth)

  return { user, loading, signIn, signOut }
}
