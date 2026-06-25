import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateBlogTopics } from '@/lib/ai/blog-topics'
import type { ScanResult } from '@/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('blog_topics').select('*').eq('site_id', params.siteId)
    .order('relevance_score', { ascending: false })

  return NextResponse.json(data || [])
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: site } = await supabase.from('sites').select('*').eq('id', params.siteId).single()
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  const { data: scans } = await supabase
    .from('scans').select('*').eq('site_id', params.siteId)
    .eq('status', 'complete').order('completed_at', { ascending: false }).limit(1)

  const scan = scans?.[0]
  if (!scan) return NextResponse.json({ error: 'Run a scan first' }, { status: 400 })

  const scanResult = { ...scan, site, site_id: params.siteId, categories: [] } as unknown as ScanResult
  const topics = await generateBlogTopics(scanResult)

  // Save to database
  const rows = topics.map(t => ({
    site_id: params.siteId,
    title: t.title,
    relevance_score: t.relevanceScore,
    source: t.source,
    reasoning: t.reasoning,
    difficulty: t.difficulty,
    suggested_outline: t.suggestedOutline,
    status: 'suggested',
  }))

  const { data: saved, error } = await supabase.from('blog_topics').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(saved, { status: 201 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topicId, status } = await req.json()

  const { data, error } = await supabase
    .from('blog_topics').update({ status }).eq('id', topicId).eq('site_id', params.siteId).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
