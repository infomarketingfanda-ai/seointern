import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Globe, RefreshCw, ExternalLink } from 'lucide-react'
import { scoreColor, scoreLabel } from '@/lib/scoring'

export default async function SitesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('workspace_id').eq('id', user!.id).single()
  const { data: sites } = await supabase
    .from('sites').select(`*, scans(overall_score, completed_at, status)`)
    .eq('workspace_id', profile?.workspace_id)
    .order('created_at', { ascending: false })

  const enriched = (sites || []).map((site: Record<string, unknown>) => {
    const list = ((site.scans as Array<{overall_score:number;completed_at:string;status:string}>) || [])
      .filter(s => s.status === 'complete')
      .sort((a,b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    return { ...site, scans: undefined, latest_score: list[0]?.overall_score ?? null }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Sites</h1>
          <p className="text-teal-400 mt-1">{enriched.length} site{enriched.length !== 1 ? 's' : ''} being monitored</p>
        </div>
        <Link href="/dashboard/sites/add"
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Site
        </Link>
      </div>

      {enriched.length === 0 ? (
        <div className="bg-teal-900/40 border border-teal-800/40 border-dashed rounded-2xl p-16 text-center">
          <Globe className="w-10 h-10 text-teal-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No sites yet</h3>
          <p className="text-teal-400 text-sm mb-6">Add your first site to start auditing.</p>
          <Link href="/dashboard/sites/add"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add First Site
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {enriched.map((site: Record<string, unknown>) => {
            const score = site.latest_score as number | null
            return (
              <Link key={site.id as string} href={`/dashboard/sites/${site.id}`}
                className="flex items-center gap-4 bg-teal-900/60 border border-teal-800/50 rounded-2xl p-5 hover:border-teal-500/40 transition-all group card-glow">
                <div className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: score ? `${scoreColor(score)}15` : '#0F2535' }}>
                  <span className="text-xl font-black" style={{ color: score ? scoreColor(score) : '#4B6B7A' }}>
                    {score ?? '—'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate">{site.display_name as string}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <a href={site.url as string} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-teal-400 text-sm truncate hover:text-teal-300 flex items-center gap-1">
                      {site.url as string} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  {site.cms_detected && (
                    <span className="text-xs text-teal-600 mt-1 inline-block">{site.cms_detected as string}</span>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {score !== null
                    ? <div className="text-sm font-medium" style={{ color: scoreColor(score) }}>{scoreLabel(score)}</div>
                    : <div className="text-teal-500 text-sm">Not scanned</div>
                  }
                  <div className="text-teal-600 text-xs mt-1 capitalize">{site.scan_frequency as string} scans</div>
                </div>
                <RefreshCw className="w-4 h-4 text-teal-600 group-hover:text-teal-400 transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
