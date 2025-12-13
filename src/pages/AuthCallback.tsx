import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ProgressSpinner } from 'primereact/progressspinner'

export function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        // Handle the OAuth callback
        const handleCallback = async () => {
            const { data, error } = await supabase.auth.getSession()

            if (error) {
                console.error('Auth callback error:', error)
                navigate('/login?error=auth_failed')
                return
            }

            if (data.session) {
                // Check if profile exists, create if not
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', data.session.user.id)
                    .single()

                if (!profile) {
                    // Create profile for new OAuth user
                    await supabase.from('profiles').insert({
                        id: data.session.user.id,
                        name: data.session.user.user_metadata?.name ||
                            data.session.user.user_metadata?.full_name ||
                            data.session.user.email?.split('@')[0],
                        email: data.session.user.email,
                        avatar_url: data.session.user.user_metadata?.avatar_url,
                        role: 'user'
                    })
                }

                navigate('/')
            } else {
                navigate('/login')
            }
        }

        handleCallback()
    }, [navigate])

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <ProgressSpinner />
            <p style={{ color: 'var(--wac-text-secondary)' }}>Completing sign in...</p>
        </div>
    )
}
