import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Globe, TrendingUp, AlertTriangle, Plus, ArrowRight, RefreshCw } from 'lucide-react'
import { scoreColor, scoreLabel } from '@/lib/scoring'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('*, workspaces(*)').eq('id', user!.id).single()

  const { data: sites } = await supabase
    .from('sites')
    .select(`*, scans(overall_score, completed_at, status)`)
    .eq('workspace_id', profile?.workspace_id)
    .order('created_at', { ascending: false })

  const enrichedSites = (sites || []).map((site: Record<string, unknown>) => {
    const scanList = ((site.scans as Array<{overall_score: number; completed_at: string; status: string}>) || [])
      .filter(s => s.status === 'complete')
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    return { ...site, scans: undefined, latest_score: scanList[0]?.overall_score ?? null, prev_score: scanList[1]?.overall_score ?? null }
  })

  const totalSites = enrichedSites.length
  const scores = enrichedSites.filter(s => s.latest_score !== null).map(s => s.latest_score as number)
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const sitesBelowSeventy = scores.filter(s => s < 70).length

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-teal-400 mt-1">
            {(profile as Record<string, unknown>)?.full_name ? `Welcome back, ${(profile as Record<string, unknown>).full_name}` : 'Welcome back'} — here's your SEO portfolio overview.
          </p>
        </div>
        <Link href="/dashboard/sites/add"
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Site
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Sites Monitored', value: totalSites,        icon: Globe,         color: 'text-teal-400'  },
          { label: 'Avg Portfolio Score', value: `${avgScore}/100`, icon: TrendingUp, color: avgScore >= 70 ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'Sites Below 70',   value: sitesBelowSeventy, icon: AlertTriangle, color: sitesBelowSeventy > 0 ? 'text-red-400' : 'text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-teal-900/60 border border-teal-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-teal-400 text-sm">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Sites list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">Your Sites</h2>
          <Link href="/dashboard/sites" className="text-teal-400 hover:text-teal-300 text-sm flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {enrichedSites.length === 0 ? (
          <div className="bg-teal-900/40 border border-teal-800/40 border-dashed rounded-2xl p-16 text-center">
            <Globe className="w-10 h-10 text-teal-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No sites yet</h3>
            <p className="text-teal-400 text-sm mb-6">Add your first website to start auditing its SEO.</p>
            <Link href="/dashboard/sites/add"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add Your First Site
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {enrichedSites.map((site: Record<string, unknown>) => {
              const score = site.latest_score as number | null
              const prev = site.prev_score as number | null
              const change = score !== null && prev !== null ? score - prev : null
              return (
                <Link key={site.id as string} href={`/dashboard/sites/${site.id}`}
                  className="flex items-center gap-4 bg-teal-900/60 border border-teal-800/50 rounded-2xl p-5 hover:border-teal-500/40 hover:bg-teal-900/80 transition-all group card-glow">
                  {/* Score circle */}
                  <div className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: score ? `${scoreColor(score)}20` : '#1E293B' }}>
                    <span className="text-xl font-black" style={{ color: score ? scoreColor(score) : '#A0A0A0' }}>
                      {score ?? '—'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold truncate">{site.display_name as string}</div>
                    <div className="text-teal-400 text-sm truncate">{site.url as string}</div>
                  </div>

                  <div className="shrink-0 text-right">
                    {score !== null ? (
                      <div className="text-sm font-medium" style={{ color: scoreColor(score) }}>
                        {scoreLabel(score)}
                      </div>
                    ) : (
                      <div className="text-teal-500 text-sm">Not scanned</div>
                    )}
                    {change !== null && (
                      <div className={`text-xs ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{change} pts
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    <RefreshCw className="w-4 h-4 text-teal-600 group-hover:text-teal-400 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
