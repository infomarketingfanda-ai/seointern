'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  RefreshCw, MessageSquare, FileText, ExternalLink, Loader2,
  CheckCircle, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp,
  Globe, Shield, Zap, Bot, Code, Search, ArrowLeft
} from 'lucide-react'
import { scoreColor, scoreLabel } from '@/lib/scoring'
import type { Finding } from '@/types'

type ScanData = {
  site: Record<string, unknown>
  scan: Record<string, unknown> | null
  findings: Finding[]
}

const CATEGORY_META = [
  { key: 'technical',    label: 'Technical SEO',       icon: Globe,   weight: 25 },
  { key: 'content',      label: 'Content Quality',     icon: FileText, weight: 20 },
  { key: 'schema',       label: 'Schema & Structured', icon: Code,    weight: 15 },
  { key: 'performance',  label: 'Performance',         icon: Zap,     weight: 15 },
  { key: 'ai_readiness', label: 'AI Readiness',        icon: Bot,     weight: 15 },
  { key: 'security',     label: 'Security',            icon: Shield,  weight: 10 },
]

function SeverityIcon({ s }: { s: string }) {
  if (s === 'critical') return <XCircle className="w-4 h-4 text-red-400 shrink-0" />
  if (s === 'warning')  return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
  if (s === 'info')     return <Info className="w-4 h-4 text-blue-400 shrink-0" />
  return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
}

function FindingCard({ f }: { f: Finding }) {
  const [open, setOpen] = useState(false)
  const severityBg: Record<string, string> = {
    critical: 'border-red-500/30 bg-red-500/5',
    warning:  'border-amber-500/30 bg-amber-500/5',
    info:     'border-blue-500/30 bg-blue-500/5',
    pass:     'border-emerald-500/20 bg-emerald-500/5',
  }
  if (f.severity === 'pass') return null

  return (
    <div className={`border rounded-xl overflow-hidden ${severityBg[f.severity]}`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors">
        <SeverityIcon s={f.severity} />
        <span className="flex-1 text-white text-sm font-medium">{f.title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-teal-500" /> : <ChevronDown className="w-4 h-4 text-teal-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
          <p className="text-teal-300 text-sm">{f.description}</p>
          {f.whyItMatters && (
            <div>
              <div className="text-teal-500 text-xs font-semibold uppercase tracking-wide mb-1">Why It Matters</div>
              <p className="text-teal-300 text-sm">{f.whyItMatters}</p>
            </div>
          )}
          {f.howToFix?.length > 0 && (
            <div>
              <div className="text-teal-500 text-xs font-semibold uppercase tracking-wide mb-2">How to Fix</div>
              <ol className="space-y-1.5">
                {f.howToFix.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-teal-200">
                    <span className="text-teal-500 font-mono shrink-0">{i + 1}.</span>
                    <span className={step.startsWith('<') || step.startsWith('User-agent') ? 'font-mono bg-teal-950/60 px-2 py-0.5 rounded text-teal-300 text-xs' : ''}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {f.affectedUrls?.length > 0 && (
            <div>
              <div className="text-teal-500 text-xs font-semibold uppercase tracking-wide mb-1">Affected URLs</div>
              <div className="space-y-1">
                {f.affectedUrls.slice(0, 5).map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 truncate">
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {u}
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 text-xs">
            <span className="bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded">Impact: {f.estimatedImpact}</span>
            <span className="bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded">Difficulty: {f.difficulty}</span>
            <span className="bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded">Time: {f.timeEstimate}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SiteReportPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [data, setData] = useState<ScanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [activeCategory, setActiveCategory] = useState('technical')

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/sites/${siteId}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [siteId])

  useEffect(() => { fetchData() }, [fetchData])

  // Poll while scan is running
  useEffect(() => {
    if (data?.scan && (data.scan.status === 'running' || data.scan.status === 'queued')) {
      const t = setInterval(() => fetchData(), 3000)
      return () => clearInterval(t)
    }
  }, [data, fetchData])

  async function triggerScan() {
    setScanning(true)
    await fetch(`/api/sites/${siteId}/scan`, { method: 'POST' })
    setTimeout(() => { fetchData(); setScanning(false) }, 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
    </div>
  )

  if (!data) return <div className="text-red-400">Site not found.</div>

  const { site, scan, findings } = data
  const isRunning = scan?.status === 'running' || scan?.status === 'queued'
  const overallScore = (scan?.overall_score as number) ?? null
  const catScores = (scan?.category_scores as Record<string, number>) ?? {}

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + breadcrumb */}
      <Link href="/dashboard/sites" className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> All Sites
      </Link>

      {/* Header */}
      <div className="bg-teal-900/60 border border-teal-800/50 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-teal-400 shrink-0" />
              <a href={site.url as string} target="_blank" rel="noopener noreferrer"
                className="text-teal-300 text-sm hover:text-teal-200 truncate flex items-center gap-1">
                {site.url as string} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <h1 className="text-2xl font-bold text-white">{site.display_name as string}</h1>
            {site.cms_detected && (
              <span className="inline-block mt-2 text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">
                {site.cms_detected as string}
              </span>
            )}
          </div>

          {/* Overall score */}
          {overallScore !== null && (
            <div className="shrink-0 text-center">
              <div className="text-5xl font-black" style={{ color: scoreColor(overallScore) }}>
                {overallScore}
              </div>
              <div className="text-sm text-teal-400 mt-1">{scoreLabel(overallScore)}</div>
            </div>
          )}
        </div>

        {/* Scan actions */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-teal-800/50">
          <button onClick={triggerScan} disabled={scanning || isRunning}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium">
            {isRunning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Scanning…</> :
              scanning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Starting…</> :
              <><RefreshCw className="w-3.5 h-3.5" />Re-scan</>
            }
          </button>
          <Link href={`/dashboard/sites/${siteId}/copilot`}
            className="flex items-center gap-2 bg-teal-800/50 hover:bg-teal-800 border border-teal-700/50 text-teal-300 text-sm px-4 py-2 rounded-xl transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> SEO Co-pilot
          </Link>
          <Link href={`/dashboard/sites/${siteId}/blog-topics`}
            className="flex items-center gap-2 bg-teal-800/50 hover:bg-teal-800 border border-teal-700/50 text-teal-300 text-sm px-4 py-2 rounded-xl transition-colors">
            <FileText className="w-3.5 h-3.5" /> Blog Topics
          </Link>
          {scan?.completed_at && (
            <span className="ml-auto text-teal-500 text-xs">
              Last scan: {new Date(scan.completed_at as string).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Scan running notice */}
      {isRunning && (
        <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-teal-400 animate-spin shrink-0" />
          <div>
            <div className="text-teal-300 font-medium text-sm">Scan in progress…</div>
            <div className="text-teal-500 text-xs mt-0.5">Crawling your site and running all 7 analysis modules. This takes about 30–60 seconds.</div>
          </div>
        </div>
      )}

      {/* No scan yet */}
      {!scan && !isRunning && (
        <div className="bg-teal-900/40 border border-teal-800/40 border-dashed rounded-2xl p-12 text-center">
          <Search className="w-10 h-10 text-teal-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No scan yet</h3>
          <p className="text-teal-400 text-sm mb-4">Run your first scan to get the full SEO audit report.</p>
          <button onClick={triggerScan}
            className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            Run First Scan
          </button>
        </div>
      )}

      {/* Category scores bar */}
      {overallScore !== null && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORY_META.map(({ key, label, icon: Icon }) => {
            const score = catScores[key] ?? null
            return (
              <button key={key} onClick={() => setActiveCategory(key)}
                className={`p-4 rounded-xl border text-left transition-all ${activeCategory === key
                  ? 'bg-teal-500/20 border-teal-500/50'
                  : 'bg-teal-900/40 border-teal-800/40 hover:border-teal-700/60'}`}>
                <Icon className={`w-4 h-4 mb-2 ${activeCategory === key ? 'text-teal-400' : 'text-teal-600'}`} />
                <div className="text-xs text-teal-400 mb-1 truncate">{label}</div>
                {score !== null
                  ? <div className="text-lg font-black" style={{ color: scoreColor(score) }}>{score}</div>
                  : <div className="text-teal-600 text-sm">—</div>
                }
              </button>
            )
          })}
        </div>
      )}

      {/* Findings for active category */}
      {findings.length > 0 && (
        <div>
          <h2 className="text-white font-semibold text-lg mb-4">
            {CATEGORY_META.find(c => c.key === activeCategory)?.label} — Findings
          </h2>
          <div className="space-y-2">
            {findings
              .filter(f => f.category === activeCategory)
              .sort((a, b) => {
                const order = { critical: 0, warning: 1, info: 2, pass: 3 }
                return order[a.severity] - order[b.severity]
              })
              .map(f => <FindingCard key={f.id} f={f} />)}
            {findings.filter(f => f.category === activeCategory).length === 0 && (
              <div className="text-center py-8 text-teal-500 text-sm">No findings in this category.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
