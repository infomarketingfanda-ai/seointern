import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: site, error } = await supabase
    .from('sites').select('*').eq('id', params.siteId).single()

  if (error || !site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  // Get latest complete scan + its findings
  const { data: scans } = await supabase
    .from('scans')
    .select('*')
    .eq('site_id', params.siteId)
    .order('started_at', { ascending: false })
    .limit(1)

  const latestScan = scans?.[0] || null

  let findings: unknown[] = []
  if (latestScan?.id) {
    const { data: f } = await supabase
      .from('findings')
      .select('*')
      .eq('scan_id', latestScan.id)
      .order('severity', { ascending: true })
    findings = f || []
  }

  return NextResponse.json({ site, scan: latestScan, findings })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('sites').delete().eq('id', params.siteId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
