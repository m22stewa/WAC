import { useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menubar } from 'primereact/menubar'
import { Button } from 'primereact/button'
import { Avatar } from 'primereact/avatar'
import { Menu } from 'primereact/menu'
import { useAuth, useTheme } from '../../context'
import { MenuItem } from 'primereact/menuitem'

export function Navbar() {
    const { user, profile, isAdmin, signOut } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    const userMenuRef = useRef<Menu>(null)

    const mainMenuItems: MenuItem[] = [
        {
            label: 'Dashboard',
            icon: 'pi pi-home',
            command: () => navigate('/'),
            className: location.pathname === '/' ? 'p-menuitem-active' : ''
        },
        {
            label: 'My Bottle',
            icon: 'pi pi-star',
            command: () => navigate('/my-bottle')
        },
        {
            label: 'Settle Up',
            icon: 'pi pi-wallet',
            command: () => navigate('/settle-up')
        },
        {
            label: 'History',
            icon: 'pi pi-clock',
            command: () => navigate('/history')
        },
        {
            label: 'Announcements',
            icon: 'pi pi-megaphone',
            command: () => navigate('/announcements')
        }
    ]

    // Add admin menu items
    if (isAdmin) {
        mainMenuItems.push({
            label: 'Admin',
            icon: 'pi pi-cog',
            items: [
                {
                    label: 'Manage Events',
                    icon: 'pi pi-calendar',
                    command: () => navigate('/admin/events')
                },
                {
                    label: 'Day Assignment',
                    icon: 'pi pi-th-large',
                    command: () => navigate('/admin/days')
                },
                {
                    label: 'Manage Bottles',
                    icon: 'pi pi-box',
                    command: () => navigate('/admin/bottles')
                },
                {
                    label: 'Members',
                    icon: 'pi pi-users',
                    command: () => navigate('/admin/members')
                },
                {
                    label: 'Post Announcement',
                    icon: 'pi pi-send',
                    command: () => navigate('/admin/announcements')
                }
            ]
        })
    }

    const userMenuItems: MenuItem[] = [
        {
            label: 'Profile',
            icon: 'pi pi-user',
            command: () => navigate('/profile')
        },
        {
            label: theme === 'light' ? 'Dark Mode' : 'Light Mode',
            icon: theme === 'light' ? 'pi pi-moon' : 'pi pi-sun',
            command: toggleTheme
        },
        {
            separator: true
        },
        {
            label: 'Sign Out',
            icon: 'pi pi-sign-out',
            command: async () => {
                await signOut()
                navigate('/login')
            }
        }
    ]

    const start = (
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🥃</span>
            <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary-color)' }}>WAC</span>
        </Link>
    )

    const end = user ? (
        <div className="flex align-items-center gap-2">
            <Menu model={userMenuItems} popup ref={userMenuRef} />

            <Button
                className="p-button-text"
                onClick={(e) => userMenuRef.current?.toggle(e)}
            >
                <Avatar
                    image={profile?.avatar_url || undefined}
                    icon={!profile?.avatar_url ? 'pi pi-user' : undefined}
                    shape="circle"
                    size="normal"
                />
                <span className="ml-2 hidden md:inline">{profile?.name || 'User'}</span>
                <i className="pi pi-chevron-down ml-2" style={{ fontSize: '0.75rem' }} />
            </Button>
        </div>
    ) : (
        <Button
            label="Sign In"
            icon="pi pi-sign-in"
            className="p-button-outlined"
            onClick={() => navigate('/login')}
        />
    )

    return (
        <Menubar model={mainMenuItems} start={start} end={end} />
    )
}
