import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'wac-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = localStorage.getItem(THEME_STORAGE_KEY)
        if (stored === 'light' || stored === 'dark') {
            return stored
        }
        return 'light' // Default to light
    })

    useEffect(() => {
        localStorage.setItem(THEME_STORAGE_KEY, theme)

        // Swap PrimeReact theme stylesheet
        const themeLink = document.getElementById('theme-css') as HTMLLinkElement
        if (themeLink) {
            const themeName = theme === 'dark' ? 'lara-dark-indigo' : 'lara-light-indigo'
            themeLink.href = themeLink.href.replace(/lara-(light|dark)-indigo/, themeName)
        } else {
            // Find and update the theme in all stylesheets
            const links = document.querySelectorAll('link[rel="stylesheet"]')
            links.forEach(link => {
                const href = (link as HTMLLinkElement).href
                if (href.includes('lara-light-indigo') || href.includes('lara-dark-indigo')) {
                    const themeName = theme === 'dark' ? 'lara-dark-indigo' : 'lara-light-indigo';
                    (link as HTMLLinkElement).href = href.replace(/lara-(light|dark)-indigo/, themeName)
                }
            })
        }

        // Update body background for dark mode
        document.body.style.backgroundColor = theme === 'dark' ? '#1e1e1e' : '#ffffff'
        document.body.style.color = theme === 'dark' ? '#ffffff' : '#333333'
    }, [theme])

    const toggleTheme = () => {
        setThemeState(prev => prev === 'light' ? 'dark' : 'light')
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
