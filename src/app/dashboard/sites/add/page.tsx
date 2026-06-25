'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Loader2, ArrowLeft, Zap } from 'lucide-react'
import Link from 'next/link'

export default function AddSitePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [freq, setFreq] = useState('weekly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, display_name: name, scan_frequency: freq }),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Failed to add site')
      setLoading(false)
      return
    }

    const site = await res.json()

    // Trigger first scan
    await fetch(`/api/sites/${site.id}/scan`, { method: 'POST' })

    router.push(`/dashboard/sites/${site.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link href="/dashboard/sites" className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Sites
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Add New Site</h1>
        <p className="text-teal-400 mt-1">Enter a URL and we'll immediately run a full SEO audit.</p>
      </div>

      <div className="bg-teal-900/60 border border-teal-800/50 rounded-2xl p-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-teal-200 text-sm font-medium mb-2">Website URL *</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
              <input
                type="text" value={url} onChange={e => setUrl(e.target.value)} required
                placeholder="https://example.com"
                className="w-full bg-teal-950/60 border border-teal-700/50 text-white placeholder-teal-600 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-teal-200 text-sm font-medium mb-2">Display Name (optional)</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. My Company Website"
              className="w-full bg-teal-950/60 border border-teal-700/50 text-white placeholder-teal-600 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-teal-200 text-sm font-medium mb-2">Scan Frequency</label>
            <select value={freq} onChange={e => setFreq(e.target.value)}
              className="w-full bg-teal-950/60 border border-teal-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 transition-colors">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="manual">Manual only</option>
            </select>
          </div>

          <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-teal-300 text-sm font-medium mb-1">
              <Zap className="w-4 h-4 text-teal-400" />
              What happens next?
            </div>
            <p className="text-teal-400 text-sm">
              After you click "Add & Scan", we'll immediately crawl your site and run all 7 analysis modules. The full report will be ready in about 30–60 seconds.
            </p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Adding site and scanning…</>
              : <><Zap className="w-4 h-4" />Add Site & Run Scan</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}
