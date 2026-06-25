import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('workspace_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Get sites with latest scan score
  const { data: sites, error } = await supabase
    .from('sites')
    .select(`
      *,
      scans (overall_score, completed_at, status)
    `)
    .eq('workspace_id', profile.workspace_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach latest score + change
  const enriched = (sites || []).map((site: Record<string, unknown>) => {
    const scanList = (site.scans as Array<{ overall_score: number; completed_at: string; status: string }> || [])
      .filter(s => s.status === 'complete')
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())

    const latest = scanList[0]
    const prev = scanList[1]
    return {
      ...site,
      scans: undefined,
      latest_score: latest?.overall_score ?? null,
      score_change: latest && prev ? latest.overall_score - prev.overall_score : null,
    }
  })

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('workspace_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await req.json()
  const { url, display_name, scan_frequency = 'weekly' } = body

  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  // Normalize URL
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`

  const { data: site, error } = await supabase
    .from('sites')
    .insert({
      workspace_id: profile.workspace_id,
      url: normalizedUrl,
      display_name: display_name || new URL(normalizedUrl).hostname,
      scan_frequency,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(site, { status: 201 })
}
