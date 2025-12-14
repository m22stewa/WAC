import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
    children: React.ReactNode
    requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, profile, loading, isAdmin } = useAuth()
    const location = useLocation()
    const [hasTimedOut, setHasTimedOut] = useState(false)

    // Add a timeout to prevent infinite loading if profile creation fails
    useEffect(() => {
        if (user && !profile && !loading) {
            const timeout = setTimeout(() => {
                console.error('Profile loading timed out. User is authenticated but profile is missing.')
                setHasTimedOut(true)
            }, 5000) // 5 second timeout

            return () => clearTimeout(timeout)
        }
    }, [user, profile, loading])

    // Show loading spinner while auth state is being determined
    // Also wait for profile if we need to check admin status
    if (loading) {
        return (
            <div className="flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                <ProgressSpinner
                    style={{ width: '50px', height: '50px' }}
                    strokeWidth="4"
                    animationDuration=".5s"
                />
            </div>
        )
    }

    // If we have a user but no profile after timeout, show error
    if (user && !profile && hasTimedOut) {
        return (
            <div className="flex align-items-center justify-content-center flex-column gap-3" style={{ minHeight: '100vh', padding: '2rem' }}>
                <i className="pi pi-exclamation-triangle text-6xl text-orange-500" />
                <h2>Profile Loading Error</h2>
                <p className="text-center text-color-secondary max-w-30rem">
                    Your account is authenticated but your profile couldn't be loaded. 
                    Please contact an administrator or try signing out and back in.
                </p>
                <a href="/login" className="p-button p-component">
                    <span className="p-button-label">Back to Login</span>
                </a>
            </div>
        )
    }

    if (!user) {
        // Redirect to login, but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (requireAdmin && !isAdmin) {
        // User is logged in but not an admin
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}
