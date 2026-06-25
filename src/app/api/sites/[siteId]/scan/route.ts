import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runFullCrawl } from '@/lib/crawler'

export async function POST(
  _req: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: site, error: siteError } = await supabase
    .from('sites').select('*').eq('id', params.siteId).single()

  if (siteError || !site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  // Create scan record
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .insert({ site_id: params.siteId, status: 'running' })
    .select().single()

  if (scanError || !scan) return NextResponse.json({ error: 'Failed to create scan' }, { status: 500 })

  // Run crawl (async — respond immediately with scan ID)
  runCrawlAndSave(site.url, params.siteId, scan.id, supabase).catch(console.error)

  return NextResponse.json({ scanId: scan.id, status: 'running' }, { status: 202 })
}

async function runCrawlAndSave(
  url: string,
  siteId: string,
  scanId: string,
  supabase: ReturnType<typeof createClient>
) {
  try {
    const result = await runFullCrawl(url)

    const categoryScores: Record<string, number> = {}
    result.categories.forEach(c => { categoryScores[c.category] = c.score })

    // Save scan result
    await supabase.from('scans').update({
      overall_score: result.overallScore,
      category_scores: categoryScores,
      status: result.error ? 'failed' : 'complete',
      pages_crawled: result.pagesCrawled,
      error_message: result.error || null,
      completed_at: new Date().toISOString(),
    }).eq('id', scanId)

    // Save findings
    if (result.allFindings.length > 0) {
      const findingRows = result.allFindings.map(f => ({
        scan_id: scanId,
        site_id: siteId,
        category: f.category,
        check_name: f.checkName,
        severity: f.severity,
        title: f.title,
        description: f.description,
        affected_urls: f.affectedUrls,
        why_it_matters: f.whyItMatters,
        how_to_fix: f.howToFix,
        cms_guides: f.cmsGuides || {},
        estimated_impact: f.estimatedImpact,
        difficulty: f.difficulty,
        time_estimate: f.timeEstimate,
      }))

      await supabase.from('findings').insert(findingRows)
    }

    // Update site: cms + last_scan_at
    await supabase.from('sites').update({
      cms_detected: result.cms,
      last_scan_at: new Date().toISOString(),
    }).eq('id', siteId)

  } catch (err) {
    await supabase.from('scans').update({
      status: 'failed',
      error_message: err instanceof Error ? err.message : 'Unknown error',
      completed_at: new Date().toISOString(),
    }).eq('id', scanId)
  }
}
