import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User } from 'firebase/auth'
import { auth, provider } from '../firebase/config'
import { fetchPlayer, savePlayer, isAdminEmail } from '../firebase/db'
import type { Player } from '../types'

export function useAuth() {
  const [user, setUser]           = useState<User | null>(null)
  const [player, setPlayer]       = useState<Player | null | undefined>(undefined) // undefined = not yet fetched
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        let p = await fetchPlayer(u.uid)
        // Auto-create coach profile for admin emails
        if (!p && isAdminEmail(u.email)) {
          p = {
            uid: u.uid,
            displayName: u.displayName ?? 'Admin',
            email: u.email ?? '',
            photoURL: u.photoURL ?? undefined,
            role: 'coach',
            group: null,
            createdAt: Date.now(),
          }
          await savePlayer(p)
        }
        setPlayer(p)
      } else {
        setPlayer(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = () => signInWithPopup(auth, provider)
  const signOut = () => { fbSignOut(auth); setPlayer(null) }
  const refreshPlayer = async (knownPlayer?: Player) => {
    if (knownPlayer) { setPlayer(knownPlayer); return }
    if (user) {
      try { setPlayer(await fetchPlayer(user.uid)) }
      catch { /* ignore fetch errors, keep current player state */ }
    }
  }

  return { user, player, loading, signIn, signOut, refreshPlayer }
}
