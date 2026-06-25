'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, FileText, Sparkles, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

type Topic = {
  id: string; title: string; relevance_score: number; source: string
  reasoning: string; difficulty: string; suggested_outline: string[]; status: string
}

const STATUS_COLORS: Record<string, string> = {
  suggested: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  planned:   'bg-blue-500/20 text-blue-300 border-blue-500/30',
  writing:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  published: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  skipped:   'bg-gray-500/20 text-gray-400 border-gray-500/30',
}
const STATUSES = ['suggested', 'planned', 'writing', 'published', 'skipped']

export default function BlogTopicsPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchTopics = useCallback(async () => {
    const res = await fetch(`/api/sites/${siteId}/blog-topics`)
    if (res.ok) setTopics(await res.json())
    setLoading(false)
  }, [siteId])

  useEffect(() => { fetchTopics() }, [fetchTopics])

  async function generateTopics() {
    setGenerating(true)
    const res = await fetch(`/api/sites/${siteId}/blog-topics`, { method: 'POST' })
    if (res.ok) await fetchTopics()
    setGenerating(false)
  }

  async function updateStatus(topicId: string, status: string) {
    await fetch(`/api/sites/${siteId}/blog-topics`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId, status }),
    })
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, status } : t))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-teal-500 animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/sites/${siteId}`} className="text-teal-400 hover:text-teal-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Blog Topic Intelligence</h1>
          <p className="text-teal-400 text-sm mt-0.5">AI-generated content ideas based on your site's niche and SEO gaps.</p>
        </div>
        <button onClick={generateTopics} disabled={generating}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4" />Generate New Topics</>}
        </button>
      </div>

      {topics.length === 0 ? (
        <div className="bg-teal-900/40 border border-teal-800/40 border-dashed rounded-2xl p-16 text-center">
          <FileText className="w-10 h-10 text-teal-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No topics yet</h3>
          <p className="text-teal-400 text-sm mb-6">Generate AI-powered blog topic ideas based on your site's niche and SEO data.</p>
          <button onClick={generateTopics} disabled={generating}
            className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            Generate Topics
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map(topic => (
            <div key={topic.id} className="bg-teal-900/60 border border-teal-800/50 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                {/* Score */}
                <div className="shrink-0 w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <span className="text-teal-400 font-black text-lg">{topic.relevance_score}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{topic.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-teal-500 text-xs">{topic.source}</span>
                    <span className="text-teal-700">·</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      topic.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                      topic.difficulty === 'hard' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                      'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>{topic.difficulty}</span>
                  </div>
                </div>

                {/* Status selector */}
                <select
                  value={topic.status}
                  onChange={e => updateStatus(topic.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded-lg border bg-transparent cursor-pointer ${STATUS_COLORS[topic.status] || STATUS_COLORS.suggested}`}>
                  {STATUSES.map(s => <option key={s} value={s} className="bg-teal-900 text-white">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>

                <button onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
                  className="text-teal-500 hover:text-teal-300 transition-colors">
                  {expanded === topic.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {expanded === topic.id && (
                <div className="px-5 pb-5 border-t border-teal-800/50 pt-4 space-y-4">
                  <div>
                    <div className="text-teal-500 text-xs font-semibold uppercase tracking-wide mb-1">Why Write This</div>
                    <p className="text-teal-300 text-sm">{topic.reasoning}</p>
                  </div>
                  {topic.suggested_outline?.length > 0 && (
                    <div>
                      <div className="text-teal-500 text-xs font-semibold uppercase tracking-wide mb-2">Suggested Outline</div>
                      <ol className="space-y-1">
                        {topic.suggested_outline.map((section: string, i: number) => (
                          <li key={i} className="flex gap-2 text-sm text-teal-200">
                            <span className="text-teal-600 font-mono shrink-0">{i + 1}.</span>
                            {section}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
