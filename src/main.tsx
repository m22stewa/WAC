import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

// PrimeReact imports - Light theme by default
import { PrimeReactProvider } from 'primereact/api'
import 'primereact/resources/themes/lara-light-indigo/theme.css'
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
