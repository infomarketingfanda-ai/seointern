import { buildCrawlData } from './fetcher'
import { analyzeTechnical } from './technical'
import { analyzeContent } from './content'
import { analyzeSchema } from './schema-checker'
import { analyzePerformance } from './performance'
import { analyzeAIReadiness } from './ai-readiness'
import { analyzeSecurity } from './security'
import { scoreCategory, calculateOverallScore } from '@/lib/scoring'
import type { CategoryScore, Finding, ScanResult, Site } from '@/types'

export interface CrawlResult {
  overallScore: number
  categories: CategoryScore[]
  allFindings: Finding[]
  pagesCrawled: number
  cms: string | null
  error?: string
}

export async function runFullCrawl(url: string): Promise<CrawlResult> {
  try {
    // 1. Fetch and build crawl data
    const crawlData = await buildCrawlData(url)

    if (!crawlData.statusCode || crawlData.statusCode === 0) {
      return {
        overallScore: 0,
        categories: [],
        allFindings: [],
        pagesCrawled: 0,
        cms: null,
        error: 'Could not reach the URL. Please check the address and try again.',
      }
    }

    // 2. Run all analysis engines in parallel
    const [
      technicalFindings,
      contentFindings,
      schemaFindings,
      perfResult,
      aiResult,
      securityFindings,
    ] = await Promise.all([
      analyzeTechnical(crawlData),
      Promise.resolve(analyzeContent(crawlData)),
      Promise.resolve(analyzeSchema(crawlData)),
      analyzePerformance(crawlData),
      Promise.resolve(analyzeAIReadiness(crawlData)),
      Promise.resolve(analyzeSecurity(crawlData)),
    ])

    const allFindings: Finding[] = [
      ...technicalFindings,
      ...contentFindings,
      ...schemaFindings,
      ...perfResult.findings,
      ...aiResult.findings,
      ...securityFindings,
    ]

    // 3. Score each category
    const categories: CategoryScore[] = [
      scoreCategory('technical',    allFindings.filter(f => f.category === 'technical')),
      scoreCategory('content',      allFindings.filter(f => f.category === 'content')),
      scoreCategory('schema',       allFindings.filter(f => f.category === 'schema')),
      scoreCategory('performance',  allFindings.filter(f => f.category === 'performance')),
      scoreCategory('ai_readiness', allFindings.filter(f => f.category === 'ai_readiness')),
      scoreCategory('security',     allFindings.filter(f => f.category === 'security')),
    ]

    // 4. Overall score
    const overallScore = calculateOverallScore(categories)

    return {
      overallScore,
      categories,
      allFindings,
      pagesCrawled: 1 + crawlData.internalLinks.length,
      cms: crawlData.cms,
    }
  } catch (err) {
    console.error('Crawl error:', err)
    return {
      overallScore: 0,
      categories: [],
      allFindings: [],
      pagesCrawled: 0,
      cms: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred during the scan.',
    }
  }
}
