import { useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menubar } from 'primereact/menubar'
import { Button } from 'primereact/button'
import { Avatar } from 'primereact/avatar'
import { Menu } from 'primereact/menu'
import { useAuth, useTheme } from '../../context'
import { MenuItem } from 'primereact/menuitem'
import wacIcon from '../../wac-icon.png'

export function Navbar() {
    const { user, profile, isAdmin, signOut } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    const userMenuRef = useRef<Menu>(null)

    const mainMenuItems: MenuItem[] = [
        {
            label: 'Dashboard',
            command: () => navigate('/'),
            className: location.pathname === '/' ? 'p-menuitem-active' : ''
        },
        {
            label: 'My Bottle',
            command: () => navigate('/my-bottle')
        },
        {
            label: 'Settle Up',
            command: () => navigate('/settle-up')
        },
        {
            label: 'History',
            command: () => navigate('/history')
        },
        {
            label: 'Announcements',
            command: () => navigate('/announcements')
        }
    ]

    // Add admin menu items
    if (isAdmin) {
        mainMenuItems.push({
            label: 'Admin',
            items: [
                {
                    label: 'Manage Events',
                    command: () => navigate('/admin/events')
                },
                {
                    label: 'Day Assignment',
                    command: () => navigate('/admin/days')
                },
                {
                    label: 'Manage Bottles',
                    command: () => navigate('/admin/bottles')
                },
                {
                    label: 'Members',
                    command: () => navigate('/admin/members')
                },
                {
                    label: 'Post Announcement',
                    command: () => navigate('/admin/announcements')
                },
                {
                    label: 'Export Data',
                    command: () => navigate('/admin/export')
                }
            ]
        })
    }

    const userMenuItems: MenuItem[] = [
        {
            label: 'Profile',
            command: () => navigate('/profile')
        },
        {
            label: theme === 'light' ? 'Dark Mode' : 'Light Mode',
            command: toggleTheme
        },
        {
            separator: true
        },
        {
            label: 'Sign Out',
            command: async () => {
                await signOut()
                navigate('/login')
            }
        }
    ]

    const start = (
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={wacIcon} alt="WAC" style={{ height: '2.5rem', width: 'auto' }} />
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
