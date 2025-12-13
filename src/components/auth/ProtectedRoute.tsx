import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context'
import { ProgressSpinner } from 'primereact/progressspinner'

interface ProtectedRouteProps {
    children: React.ReactNode
    requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, profile, loading, isAdmin } = useAuth()
    const location = useLocation()

    // Show loading spinner while auth state is being determined
    // Also wait for profile if we need to check admin status
    if (loading || (user && !profile)) {
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
