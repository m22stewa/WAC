import { ReactNode } from 'react'
import { Navbar } from './Navbar'
import { Toast } from 'primereact/toast'
import { useRef } from 'react'
import wacIcon from '../../wac-icon.png'

interface AppLayoutProps {
    children: ReactNode
    showNavbar?: boolean
}

export function AppLayout({ children, showNavbar = true }: AppLayoutProps) {
    const toast = useRef<Toast>(null)

    return (
        <div className="min-h-screen">
            <Toast ref={toast} position="top-right" />

            {showNavbar && <Navbar />}

            <main className="p-4 max-w-screen-2xl mx-auto">
                {children}
            </main>

            <footer className="p-4 text-center text-color-secondary border-top-1 surface-border mt-4">
                <img src={wacIcon} alt="WAC" style={{ height: '2rem', width: 'auto', opacity: 0.6 }} />
            </footer>
        </div>
    )
}
