import { Routes, Route } from 'react-router-dom'
import { AuthProvider, ThemeProvider } from './context'
import { ProtectedRoute } from './components/auth'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { MyBottle } from './pages/MyBottle'
import { DayDetail } from './pages/DayDetail'
import { SettleUp } from './pages/SettleUp'
import { History } from './pages/History'
import { Announcements } from './pages/Announcements'
import { Profile } from './pages/Profile'
import { AuthCallback } from './pages/AuthCallback'
// Admin pages
import { EventManagement } from './pages/admin/EventManagement'
import { DayAssignment } from './pages/admin/DayAssignment'
import { MemberManagement } from './pages/admin/MemberManagement'
import { AnnouncementEditor } from './pages/admin/AnnouncementEditor'

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Protected routes */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/my-bottle" element={
                        <ProtectedRoute>
                            <MyBottle />
                        </ProtectedRoute>
                    } />

                    <Route path="/day/:dayNumber" element={
                        <ProtectedRoute>
                            <DayDetail />
                        </ProtectedRoute>
                    } />

                    <Route path="/settle-up" element={
                        <ProtectedRoute>
                            <SettleUp />
                        </ProtectedRoute>
                    } />

                    <Route path="/history" element={
                        <ProtectedRoute>
                            <History />
                        </ProtectedRoute>
                    } />

                    <Route path="/announcements" element={
                        <ProtectedRoute>
                            <Announcements />
                        </ProtectedRoute>
                    } />

                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    } />

                    {/* Admin routes */}
                    <Route path="/admin/events" element={
                        <ProtectedRoute requireAdmin>
                            <EventManagement />
                        </ProtectedRoute>
                    } />

                    <Route path="/admin/days" element={
                        <ProtectedRoute requireAdmin>
                            <DayAssignment />
                        </ProtectedRoute>
                    } />

                    <Route path="/admin/members" element={
                        <ProtectedRoute requireAdmin>
                            <MemberManagement />
                        </ProtectedRoute>
                    } />

                    <Route path="/admin/announcements" element={
                        <ProtectedRoute requireAdmin>
                            <AnnouncementEditor />
                        </ProtectedRoute>
                    } />
                </Routes>
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
