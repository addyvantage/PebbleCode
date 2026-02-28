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
