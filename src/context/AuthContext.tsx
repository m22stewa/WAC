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
    
    // Track last fetched user to prevent duplicate profile fetches
    const lastFetchedUserId = useRef<string | null>(null)

    // Fetch user profile - completely non-blocking
    const fetchProfile = async (authUser: User): Promise<void> => {
        if (!isConfigured) {
            console.log('Supabase not configured, skipping profile fetch')
            return
        }

        // Prevent duplicate fetches for same user
        if (lastFetchedUserId.current === authUser.id) {
            console.log('Profile already fetched for user:', authUser.id)
            return
        }

        lastFetchedUserId.current = authUser.id
        console.log('Fetching profile for user:', authUser.id)

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (error) {
                console.error('Error fetching profile:', error.message)
                // Profile will remain null - app will still function
                return
            }

            if (data) {
                console.log('Profile loaded successfully')
                setProfile(data as Profile)
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err)
            // Profile will remain null - app will still function
        }
    }

    // Initialize auth state
    useEffect(() => {
        if (!isConfigured) {
            setLoading(false)
            return
        }

        let mounted = true

        // Get initial session - this should be very fast
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return

            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false) // Stop loading immediately after auth check

            // Fetch profile in background - completely non-blocking
            if (session?.user) {
                fetchProfile(session.user)
            }
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!mounted) return

                console.log('Auth state changed:', event)
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    // Fetch profile in background - non-blocking
                    fetchProfile(session.user)
                } else {
                    setProfile(null)
                    lastFetchedUserId.current = null
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
