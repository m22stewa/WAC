import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

// PrimeReact imports - Mira theme
import { PrimeReactProvider } from 'primereact/api'
import 'primereact/resources/themes/mira/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <PrimeReactProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </PrimeReactProvider>
    </React.StrictMode>
)
