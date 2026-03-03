// Polyfills required by amazon-cognito-identity-js (SRP auth) in browser
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _win = window as any
if (typeof _win['global'] === 'undefined') _win['global'] = window
if (typeof _win['Buffer'] === 'undefined') _win['Buffer'] = (globalThis as any)['Buffer']

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './providers/theme/ThemeProvider'
import { I18nProvider } from './i18n/I18nProvider'
import { AppErrorBoundary } from './components/app/AppErrorBoundary'
import { recoverPebbleStorageOnBoot } from './lib/safeStorage'

recoverPebbleStorageOnBoot()

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Missing root element')
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </BrowserRouter>
      </ThemeProvider>
    </I18nProvider>
  </StrictMode>,
)
