'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (err) { setError(err.message); setLoading(false) }
    else if (data.session) { router.push('/dashboard') }
    else setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-teal-900 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-teal-400" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">Check your email</h2>
          <p className="text-teal-300">We sent a confirmation link to <strong className="text-teal-200">{email}</strong>. Click it to activate your account.</p>
          <Link href="/auth/login" className="inline-block mt-6 text-teal-400 hover:text-white transition-colors text-sm">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">SEO Intern</span>
          </Link>
          <h1 className="text-white text-2xl font-bold mt-6">Create your account</h1>
          <p className="text-teal-300 mt-1">Free forever · No credit card needed</p>
        </div>

        <div className="bg-teal-800/50 backdrop-blur border border-teal-700/50 rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-teal-200 text-sm font-medium mb-2">Full name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="Jane Smith"
                className="w-full bg-teal-900/60 border border-teal-600/50 text-white placeholder-teal-500 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>
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
                  minLength={8} placeholder="At least 8 characters"
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
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</> : 'Create Free Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-teal-400 text-sm">Already have an account? </span>
            <Link href="/auth/login" className="text-teal-300 hover:text-white text-sm font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
