import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Divider } from 'primereact/divider'
import { Message } from 'primereact/message'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useAuth } from '../context'

type AuthMode = 'login' | 'signup'

export function Login() {
    const [mode, setMode] = useState<AuthMode>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [formLoading, setFormLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const { user, profile, loading, signInWithEmail, signUpWithEmail, signInWithProvider, isConfigured } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            console.log('User is logged in, redirecting to:', from)
            navigate(from, { replace: true })
        }
    }, [user, loading, from, navigate])

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        setFormLoading(true)

        try {
            if (mode === 'login') {
                const { error } = await signInWithEmail(email, password)
                if (error) throw error
                // Navigation will happen via useEffect when user/profile are set
            } else {
                const { error } = await signUpWithEmail(email, password, name)
                if (error) throw error
                // Show success message - user may need to confirm email
                setSuccess('Account created! Check your email to confirm, or try signing in if email confirmation is disabled.')
                setMode('login')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setFormLoading(false)
        }
    }

    const handleProviderAuth = async (provider: 'google' | 'apple' | 'facebook') => {
        setError(null)
        const { error } = await signInWithProvider(provider)
        if (error) {
            setError(error.message)
        }
    }

    // Show loading spinner while checking auth state
    if (loading) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            </div>
        )
    }

    // Don't render login form if already logged in (will redirect via useEffect)
    if (user) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            </div>
        )
    }

    if (!isConfigured) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen p-4">
                <Card className="w-full" style={{ maxWidth: '450px' }}>
                    <div className="text-center mb-4">
                        <span style={{ fontSize: '3rem' }}>🥃</span>
                        <h1 className="text-primary mt-2">Whiskey Advent Calendar</h1>
                    </div>

                    <Message severity="warn" text="Supabase is not configured yet." className="w-full mb-4" />

                    <div className="surface-100 p-4 border-round">
                        <h3 className="mt-0 text-primary">Setup Instructions</h3>
                        <ol className="line-height-3">
                            <li>Create a free account at <a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a></li>
                            <li>Create a new project</li>
                            <li>Copy your project URL and anon key from Settings → API</li>
                            <li>Create a <code>.env.local</code> file with your credentials</li>
                            <li>Restart the development server</li>
                        </ol>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex align-items-center justify-content-center min-h-screen p-4">
            <Card className="w-full" style={{ maxWidth: '420px' }}>
                <div className="text-center mb-4">
                    <span style={{ fontSize: '3rem' }}>🥃</span>
                    <h1 className="text-primary mt-2">Whiskey Advent Calendar</h1>
                    <p className="text-color-secondary">
                        {mode === 'login' ? 'Welcome back!' : 'Join the club'}
                    </p>
                </div>

                {error && (
                    <Message severity="error" text={error} className="w-full mb-3" />
                )}

                {success && (
                    <Message severity="success" text={success} className="w-full mb-3" />
                )}

                <form onSubmit={handleEmailAuth}>
                    {mode === 'signup' && (
                        <div className="field mb-3">
                            <label htmlFor="name" className="block mb-2">Name</label>
                            <InputText
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="w-full"
                                required
                            />
                        </div>
                    )}

                    <div className="field mb-3">
                        <label htmlFor="email" className="block mb-2">Email</label>
                        <InputText
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="field mb-4">
                        <label htmlFor="password" className="block mb-2">Password</label>
                        <Password
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full"
                            inputClassName="w-full"
                            feedback={mode === 'signup'}
                            toggleMask
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        label={mode === 'login' ? 'Sign In' : 'Create Account'}
                        icon={formLoading ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'}
                        className="w-full"
                        disabled={formLoading}
                    />
                </form>

                <Divider align="center">
                    <span className="text-color-secondary text-sm">or continue with</span>
                </Divider>

                <div className="flex gap-2 justify-content-center">
                    <Button
                        icon="pi pi-apple"
                        label="Apple"
                        className="p-button-outlined"
                        onClick={() => handleProviderAuth('apple')}
                    />
                    <Button
                        icon="pi pi-google"
                        label="Google"
                        className="p-button-outlined"
                        onClick={() => handleProviderAuth('google')}
                    />
                    <Button
                        icon="pi pi-facebook"
                        label="Facebook"
                        className="p-button-outlined"
                        onClick={() => handleProviderAuth('facebook')}
                    />
                </div>

                <div className="text-center mt-4 text-color-secondary">
                    {mode === 'login' ? (
                        <p className="m-0">
                            Don't have an account?{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); setSuccess(null); }} className="text-primary">
                                Sign up
                            </a>
                        </p>
                    ) : (
                        <p className="m-0">
                            Already have an account?{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setSuccess(null); }} className="text-primary">
                                Sign in
                            </a>
                        </p>
                    )}
                </div>
            </Card>
        </div>
    )
}
