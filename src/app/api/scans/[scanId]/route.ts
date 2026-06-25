import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { scanId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: scan } = await supabase.from('scans').select('*').eq('id', params.scanId).single()
  if (!scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })

  const { data: findings } = await supabase
    .from('findings').select('*').eq('scan_id', params.scanId)
    .order('severity', { ascending: true })

  const { data: site } = await supabase.from('sites').select('*').eq('id', scan.site_id).single()

  return NextResponse.json({ scan, findings: findings || [], site })
}
