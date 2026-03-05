import { Link } from 'react-router-dom'
import { BrandLogo } from '../ui/BrandLogo'
import { useTheme } from '../../hooks/useTheme'

const linkClassName =
  'group inline-flex w-fit items-center text-[13.5px] text-pebble-text-secondary transition-colors duration-300 ease-out hover:text-pebble-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pebble-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'

function FooterLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className={linkClassName}>
      <span className="relative">
        {children}
        <span className="pointer-events-none absolute -bottom-[2px] left-0 h-px w-0 bg-pebble-accent/75 transition-all duration-300 ease-out group-hover:w-full" />
      </span>
    </Link>
  )
}

export function SiteFooter() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <footer className="relative mt-6 md:mt-8">
      <div className="relative overflow-hidden rounded-[28px] border border-pebble-border/34 bg-pebble-panel/78 px-5 pb-7 pt-8 shadow-[0_18px_46px_rgba(5,10,24,0.28)] backdrop-blur-xl md:px-8 md:pb-9 md:pt-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pebble-overlay/75 to-transparent" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-44 w-[56rem] -translate-x-1/2 rounded-full bg-pebble-accent/12 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-pebble-overlay/[0.06] via-transparent to-pebble-overlay/[0.02]" />

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -bottom-5 left-1/2 z-0 -translate-x-1/2 select-none whitespace-nowrap text-[clamp(4.5rem,17vw,14.5rem)] font-black leading-none tracking-[-0.04em] blur-[0.5px] ${
            isDark ? 'text-pebble-text-primary/[0.08]' : 'text-pebble-accent/[0.12]'
          }`}
          style={{
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0.92) 8%, rgba(0,0,0,0.52) 42%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.92) 8%, rgba(0,0,0,0.52) 42%, rgba(0,0,0,0) 100%)',
          }}
        >
          Pebble
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-3">
            <BrandLogo className="h-8 w-auto object-contain" />
            <p className="max-w-[24ch] text-[13.5px] leading-relaxed text-pebble-text-secondary">
              Elite coding practice with mentor-level guidance.
            </p>
            <p className="text-[12px] text-pebble-text-muted">
              © 2026 Pebble. All rights reserved.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Product</h3>
            <nav className="flex flex-col gap-2">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/problems">Problems</FooterLink>
              <FooterLink to="/session/1">Session</FooterLink>
              <FooterLink to="/dashboard">Insights</FooterLink>
            </nav>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Account</h3>
            <nav className="flex flex-col gap-2">
              <FooterLink to="/auth/login">Login</FooterLink>
              <FooterLink to="/auth/signup">Sign Up</FooterLink>
              <FooterLink to="/auth/forgot-password">Forgot Password</FooterLink>
            </nav>
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pebble-text-muted">Legal</h3>
            <nav className="flex flex-col gap-2">
              <FooterLink to="/legal/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/legal/terms">Terms of Service</FooterLink>
              <FooterLink to="/legal/cookies">Cookie Policy</FooterLink>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
