import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
    isAdmin: boolean
    isConfigured: boolean
    signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>
    signInWithProvider: (provider: 'google' | 'apple' | 'facebook') => Promise<{ error: AuthError | null }>
    signOut: () => Promise<void>
    updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const isConfigured = isSupabaseConfigured()
    
    // Track ongoing profile fetch to prevent duplicates
    const profileFetchPromise = useRef<Promise<Profile | null> | null>(null)
    const lastFetchedUserId = useRef<string | null>(null)

    // Fetch or create user profile
    const fetchOrCreateProfile = async (authUser: User): Promise<Profile | null> => {
        if (!isConfigured) {
            console.log('Supabase not configured, skipping profile fetch')
            return null
        }

        // If we already have a fetch in progress for this user, return it
        if (profileFetchPromise.current && lastFetchedUserId.current === authUser.id) {
            console.log('🔄 Reusing existing profile fetch for user:', authUser.id)
            return profileFetchPromise.current
        }

        console.log('🔍 fetchOrCreateProfile called for user:', authUser.id)
        lastFetchedUserId.current = authUser.id

        // Create the fetch promise
        const fetchPromise = (async () => {
            // Try to fetch existing profile (no timeout - let it complete naturally)
            console.log('📋 Attempting to fetch existing profile...')
            
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle() // Use maybeSingle instead of single to avoid 406 error

            if (error) {
                console.error('❌ Error fetching profile:', error)
                console.error('   Error code:', error.code)
                console.error('   Error message:', error.message)
                // Profile fetch failed - this shouldn't happen with fixed RLS
                // The trigger should have created the profile
                // If profile doesn't exist, something is wrong - but don't try to create it here
                // The database trigger will handle it
                console.warn('⚠️ Profile not found - database trigger should have created it')
                profileFetchPromise.current = null
                return null
            }

            // If profile exists, return it
            if (data) {
                console.log('✅ Found existing profile:', data)
                profileFetchPromise.current = null
                return data as Profile
            }

            // Profile doesn't exist - trigger should have created it
            // This shouldn't happen, but if it does, wait a moment and try again
            console.log('⏳ Profile not found, waiting for trigger to create it...')
            await new Promise(resolve => setTimeout(resolve, 500))
            
            const { data: retryData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle()
            
            if (retryData) {
                console.log('✅ Found profile on retry:', retryData)
                profileFetchPromise.current = null
                return retryData as Profile
            }

            console.error('❌ Profile still not found after retry - trigger may have failed')
            profileFetchPromise.current = null
            return null
        })()

        profileFetchPromise.current = fetchPromise
        return fetchPromise
    }

    // Initialize auth state
    useEffect(() => {
        if (!isConfigured) {
            setLoading(false)
            return
        }

        let mounted = true

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!mounted) return

            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                try {
                    const profile = await fetchOrCreateProfile(session.user)
                    if (mounted) setProfile(profile)
                } catch (error) {
                    console.error('Failed to fetch/create profile:', error)
                    if (mounted) setProfile(null)
                }
            }

            if (mounted) setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return

                console.log('Auth state changed:', event)
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    // Don't set loading to false until profile fetch completes
                    try {
                        const profile = await fetchOrCreateProfile(session.user)
                        if (mounted) {
                            setProfile(profile)
                            setLoading(false)
                        }
                    } catch (error) {
                        console.error('Failed to fetch/create profile:', error)
                        if (mounted) {
                            setProfile(null)
                            setLoading(false)
                        }
                    }
                } else {
                    if (mounted) {
                        setProfile(null)
                        setLoading(false)
                    }
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [isConfigured])

    // Sign in with email/password
    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        return { error }
    }

    // Sign up with email/password
    const signUpWithEmail = async (email: string, password: string, name: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        })
        return { error }
    }

    // Sign in with OAuth provider
    const signInWithProvider = async (provider: 'google' | 'apple' | 'facebook') => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
        return { error }
    }

    // Sign out
    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setSession(null)
    }

    // Update profile
    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) {
            return { error: new Error('No user logged in') }
        }

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)

        if (!error) {
            setProfile(prev => prev ? { ...prev, ...updates } : null)
        }

        return { error: error ? new Error(error.message) : null }
    }

    const value: AuthContextType = {
        user,
        profile,
        session,
        loading,
        isAdmin: profile?.role === 'admin',
        isConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithProvider,
        signOut,
        updateProfile
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
