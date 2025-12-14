import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context'
import { ProgressSpinner } from 'primereact/progressspinner'

interface ProtectedRouteProps {
    children: React.ReactNode
    requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, loading, isAdmin } = useAuth()
    const location = useLocation()

    // Show loading spinner ONLY while checking authentication status
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

    // Not authenticated - redirect to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Require admin role but user is not admin
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
