'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">SEO Intern</span>
          </Link>
          <h1 className="text-white text-2xl font-bold mt-6">Welcome back</h1>
          <p className="text-teal-300 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-teal-800/50 backdrop-blur border border-teal-700/50 rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-teal-200 text-sm font-medium mb-2">Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@company.com"
                className="w-full bg-teal-900/60 border border-teal-600/50 text-white placeholder-teal-500 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-teal-200 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full bg-teal-900/60 border border-teal-600/50 text-white placeholder-teal-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-teal-400 transition-colors"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 hover:text-teal-300 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-teal-400 text-sm">Don't have an account? </span>
            <Link href="/auth/signup" className="text-teal-300 hover:text-white text-sm font-medium transition-colors">
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
