import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Local workspace profile.
 *
 * The SmartCart backend exposes no authentication endpoints (no login, register,
 * session or password APIs). This context therefore stores a *display profile*
 * purely in this browser — it is never sent to the server and it does not grant
 * or restrict access to any API resource.
 */
const PROFILE_KEY = 'smartcart_workspace_profile'

export interface Profile {
  name: string
  role: string
  signedInAt: string
}

interface ProfileContextType {
  profile: Profile | null
  signIn: (name: string, role: string) => void
  signOut: () => void
  updateProfile: (patch: Partial<Pick<Profile, 'name' | 'role'>>) => void
}

function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Profile
    if (parsed && typeof parsed.name === 'string' && parsed.name.trim()) return parsed
    return null
  } catch {
    return null
  }
}

const ProfileContext = createContext<ProfileContextType | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile())

  const signIn = useCallback((name: string, role: string) => {
    const next: Profile = {
      name: name.trim(),
      role: role.trim() || 'Store operator',
      signedInAt: new Date().toISOString(),
    }
    setProfile(next)
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
    } catch {
      /* storage unavailable */
    }
  }, [])

  const signOut = useCallback(() => {
    setProfile(null)
    try {
      localStorage.removeItem(PROFILE_KEY)
    } catch {
      /* storage unavailable */
    }
  }, [])

  const updateProfile = useCallback((patch: Partial<Pick<Profile, 'name' | 'role'>>) => {
    setProfile((prev) => {
      if (!prev) return prev
      const next: Profile = { ...prev, ...patch }
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable */
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ profile, signIn, signOut, updateProfile }),
    [profile, signIn, signOut, updateProfile],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile(): ProfileContextType {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
