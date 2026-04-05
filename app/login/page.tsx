'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [showFallback, setShowFallback] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    setLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      email, password, redirect: false,
    })
    if (res?.ok) {
      router.push('/dashboard')
    } else {
      setError('Invalid email or password.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="font-display text-4xl tracking-widest mb-1" style={{ color: 'var(--gold)' }}>
            BURKE TRUCK
          </div>
          <div className="font-mono text-xs tracking-widest" style={{ color: 'var(--ink3)' }}>
            CEO COMMAND CENTER
          </div>
        </div>

        {/* Card */}
        <div className="rounded p-8" style={{ background: 'var(--plate)', border: '1px solid var(--line2)', borderTop: '3px solid var(--gold)' }}>

          {!showFallback ? (
            <>
              <p className="font-mono text-xs mb-6 text-center" style={{ color: 'var(--ink3)' }}>
                Sign in with your Burke Truck Google Workspace account
              </p>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="btn-gold w-full justify-center py-3 text-sm rounded"
                style={{ display: 'flex' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {loading ? 'Connecting…' : 'Sign in with Google'}
              </button>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowFallback(true)}
                  className="font-mono text-[10px] transition-colors"
                  style={{ color: 'var(--ink3)' }}
                  onMouseOver={e => (e.currentTarget.style.color = 'var(--ink2)')}
                  onMouseOut={e => (e.currentTarget.style.color = 'var(--ink3)')}
                >
                  Use email/password backup →
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="font-mono text-[10px] mb-5" style={{ color: 'var(--ink3)' }}>
                Backup authentication — use only if Google SSO is unavailable
              </p>
              <form onSubmit={handleCredentials} className="space-y-3">
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-wider block mb-1" style={{ color: 'var(--ink3)' }}>Email</label>
                  <input
                    className="field-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="dalton@burketruck.com"
                    required
                  />
                </div>
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-wider block mb-1" style={{ color: 'var(--ink3)' }}>Password</label>
                  <input
                    className="field-input"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && <p className="font-mono text-[10px]" style={{ color: 'var(--p1)' }}>{error}</p>}
                <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-2.5" style={{ display: 'flex' }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
              <div className="mt-4 text-center">
                <button onClick={() => setShowFallback(false)} className="font-mono text-[10px]" style={{ color: 'var(--ink3)' }}>
                  ← Back to Google Sign In
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-4 font-mono text-[10px]" style={{ color: 'var(--ink3)' }}>
          burketruck.com · CEO Operations Platform
        </p>
      </div>
    </div>
  )
}
