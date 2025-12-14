import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Profile, UserRole } from '../types'

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

    // Fetch or create user profile
    const fetchOrCreateProfile = async (authUser: User): Promise<Profile | null> => {
        if (!isConfigured) return null

        // Try to fetch existing profile
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle() // Use maybeSingle instead of single to avoid 406 error

        if (error) {
            console.error('Error fetching profile:', error)
            return null
        }

        // If profile exists, return it
        if (data) {
            console.log('Found existing profile:', data)
            return data as Profile
        }

        // Profile doesn't exist, create it
        console.log('Creating new profile for user:', authUser.id)
        const newProfile = {
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            avatar_url: authUser.user_metadata?.avatar_url || null,
            role: 'user' as UserRole
        }

        const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single()

        if (createError) {
            console.error('Error creating profile:', createError)
            // If it's a duplicate key error, try fetching again
            if (createError.code === '23505') {
                const { data: retryData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .maybeSingle()
                return retryData as Profile | null
            }
            return null
        }

        console.log('Created new profile:', createdProfile)
        return createdProfile as Profile
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
                    try {
                        const profile = await fetchOrCreateProfile(session.user)
                        if (mounted) setProfile(profile)
                    } catch (error) {
                        console.error('Failed to fetch/create profile:', error)
                        if (mounted) setProfile(null)
                    }
                } else {
                    setProfile(null)
                }

                if (mounted) setLoading(false)
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
