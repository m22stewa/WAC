import { ReactNode } from 'react'
import { Navbar } from './Navbar'
import { Toast } from 'primereact/toast'
import { useRef } from 'react'

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
                <p className="m-0">Whiskey Advent Calendar</p>
            </footer>
        </div>
    )
}
