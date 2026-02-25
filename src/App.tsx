import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { SessionPage } from './pages/SessionPage'
import { getUserProfile } from './utils/userProfile'

function RequireOnboarding({ children }: { children: ReactElement }) {
  if (typeof window === 'undefined') {
    return children
  }

  const params = new URLSearchParams(window.location.search)
  const skipGuard = params.get('skip') === '1'
  const profile = getUserProfile()

  if (skipGuard || profile) {
    return children
  }

  return <Navigate to="/onboarding" replace />
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          index
          element={
            <RequireOnboarding>
              <LandingPage />
            </RequireOnboarding>
          }
        />
        <Route
          path="/session/:sessionId"
          element={
            <RequireOnboarding>
              <SessionPage />
            </RequireOnboarding>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireOnboarding>
              <DashboardPage />
            </RequireOnboarding>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
