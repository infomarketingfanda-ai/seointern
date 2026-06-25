import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FolderOpen, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'
import { scoreColor, scoreLabel } from '@/lib/scoring'

const CATEGORIES = ['technical','content','schema','performance','ai_readiness','security']
const CAT_LABELS: Record<string,string> = {
  technical:'Technical', content:'Content', schema:'Schema',
  performance:'Performance', ai_readiness:'AI Ready', security:'Security'
}

export default async function PortfolioPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('workspace_id').eq('id', user!.id).single()

  const { data: sites } = await supabase
    .from('sites').select(`*, scans(overall_score,category_scores,completed_at,status)`)
    .eq('workspace_id', profile?.workspace_id)

  const enriched = (sites || []).map((site: Record<string, unknown>) => {
    const list = ((site.scans as Array<{overall_score:number;category_scores:Record<string,number>;completed_at:string;status:string}>) || [])
      .filter(s => s.status === 'complete')
      .sort((a,b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    return { ...site, scans: undefined, latest: list[0] ?? null }
  }).filter((s: Record<string, unknown>) => s.latest !== null)

  const avgScore = enriched.length
    ? Math.round(enriched.reduce((a: number, s: Record<string, unknown>) => a + ((s.latest as Record<string,unknown>)?.overall_score as number || 0), 0) / enriched.length)
    : 0

  const belowSeventy = enriched.filter((s: Record<string, unknown>) => ((s.latest as Record<string,unknown>)?.overall_score as number || 0) < 70).length

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Portfolio View</h1>
        <p className="text-teal-400 mt-1">Side-by-side comparison of all your monitored sites.</p>
      </div>

      {/* Portfolio stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-teal-900/60 border border-teal-800/50 rounded-2xl p-6">
          <div className="text-teal-400 text-sm mb-2">Total Sites</div>
          <div className="text-3xl font-black text-white">{enriched.length}</div>
        </div>
        <div className="bg-teal-900/60 border border-teal-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-teal-400 text-sm mb-2">
            <TrendingUp className="w-4 h-4" /> Average Score
          </div>
          <div className="text-3xl font-black" style={{ color: scoreColor(avgScore) }}>{avgScore || '—'}</div>
        </div>
        <div className="bg-teal-900/60 border border-teal-800/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-teal-400 text-sm mb-2">
            <AlertTriangle className="w-4 h-4" /> Below 70
          </div>
          <div className={`text-3xl font-black ${belowSeventy > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{belowSeventy}</div>
        </div>
      </div>

      {enriched.length === 0 ? (
        <div className="bg-teal-900/40 border border-teal-800/40 border-dashed rounded-2xl p-16 text-center">
          <FolderOpen className="w-10 h-10 text-teal-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No scanned sites yet</h3>
          <p className="text-teal-400 text-sm mb-4">Add sites and run scans to see a portfolio comparison.</p>
          <Link href="/dashboard/sites/add" className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            Add Site
          </Link>
        </div>
      ) : (
        /* Comparison table */
        <div className="bg-teal-900/60 border border-teal-800/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-teal-800/60">
                  <th className="text-left text-teal-400 text-xs font-semibold uppercase tracking-wide px-6 py-4">Site</th>
                  <th className="text-center text-teal-400 text-xs font-semibold uppercase tracking-wide px-3 py-4">Overall</th>
                  {CATEGORIES.map(c => (
                    <th key={c} className="text-center text-teal-400 text-xs font-semibold uppercase tracking-wide px-3 py-4">
                      {CAT_LABELS[c]}
                    </th>
                  ))}
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-800/40">
                {enriched
                  .sort((a: Record<string,unknown>, b: Record<string,unknown>) =>
                    ((b.latest as Record<string,unknown>)?.overall_score as number || 0) -
                    ((a.latest as Record<string,unknown>)?.overall_score as number || 0)
                  )
                  .map((site: Record<string, unknown>) => {
                  const score = (site.latest as Record<string,unknown>)?.overall_score as number
                  const catScores = ((site.latest as Record<string,unknown>)?.category_scores || {}) as Record<string,number>
                  return (
                    <tr key={site.id as string} className="hover:bg-teal-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium text-sm">{site.display_name as string}</div>
                        <div className="text-teal-500 text-xs truncate max-w-[160px]">{site.url as string}</div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="text-lg font-black" style={{ color: scoreColor(score) }}>{score}</span>
                      </td>
                      {CATEGORIES.map(c => {
                        const s = catScores[c]
                        return (
                          <td key={c} className="px-3 py-4 text-center">
                            {s !== undefined
                              ? <span className="text-sm font-semibold" style={{ color: scoreColor(s) }}>{s}</span>
                              : <span className="text-teal-700 text-sm">—</span>
                            }
                          </td>
                        )
                      })}
                      <td className="px-4 py-4">
                        <Link href={`/dashboard/sites/${site.id}`}
                          className="text-teal-500 hover:text-teal-300 transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
