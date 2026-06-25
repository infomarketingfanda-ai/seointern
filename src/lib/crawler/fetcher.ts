import * as cheerio from 'cheerio'
import type { CrawlData } from '@/types'

const USER_AGENT = 'SEOInternBot/1.0 (SEO Audit Tool; +https://seointern.app)'
const TIMEOUT_MS = 15000

function detectCMS(html: string, headers: Record<string, string>): string | null {
  const h = html.toLowerCase()
  if (h.includes('wp-content') || h.includes('wp-includes')) return 'WordPress'
  if (h.includes('shopify') || headers['x-shopid']) return 'Shopify'
  if (h.includes('wix.com') || h.includes('_wix_')) return 'Wix'
  if (h.includes('squarespace') || h.includes('squarespace-cdn')) return 'Squarespace'
  if (h.includes('webflow.com')) return 'Webflow'
  if (h.includes('ghost.io') || h.includes('ghost/core')) return 'Ghost'
  if (headers['x-drupal-cache']) return 'Drupal'
  if (h.includes('joomla')) return 'Joomla'
  return null
}

export async function fetchUrl(rawUrl: string): Promise<{
  ok: boolean
  statusCode: number
  html: string
  headers: Record<string, string>
  finalUrl: string
  responseTimeMs: number
  error?: string
}> {
  const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
  const start = Date.now()

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const html = await res.text()
    const headers: Record<string, string> = {}
    res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v })

    return {
      ok: res.ok,
      statusCode: res.status,
      html,
      headers,
      finalUrl: res.url,
      responseTimeMs: Date.now() - start,
    }
  } catch (e: unknown) {
    return {
      ok: false,
      statusCode: 0,
      html: '',
      headers: {},
      finalUrl: url,
      responseTimeMs: Date.now() - start,
      error: e instanceof Error ? e.message : 'Unknown error',
    }
  }
}

export async function buildCrawlData(url: string): Promise<CrawlData> {
  const base = await fetchUrl(url)
  const $ = cheerio.load(base.html)
  const baseUrl = new URL(base.finalUrl || url)

  // Collect internal links
  const links: string[] = []
  const internalLinks: string[] = []
  const externalLinks: string[] = []

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    try {
      const abs = new URL(href, baseUrl.origin)
      links.push(abs.href)
      if (abs.hostname === baseUrl.hostname) internalLinks.push(abs.href)
      else externalLinks.push(abs.href)
    } catch {}
  })

  // Collect images
  const images: Array<{ src: string; alt: string | null }> = []
  $('img').each((_, el) => {
    const src = $(el).attr('src') || ''
    const alt = $(el).attr('alt') ?? null
    if (src) images.push({ src, alt })
  })

  // Fetch robots.txt
  let robotsTxtContent: string | null = null
  try {
    const robotsRes = await fetch(`${baseUrl.origin}/robots.txt`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(5000),
    })
    if (robotsRes.ok) robotsTxtContent = await robotsRes.text()
  } catch {}

  // Fetch sitemap
  let sitemapContent: string | null = null
  for (const path of ['/sitemap.xml', '/sitemap_index.xml']) {
    try {
      const sRes = await fetch(`${baseUrl.origin}${path}`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(5000),
      })
      if (sRes.ok) { sitemapContent = await sRes.text(); break }
    } catch {}
  }

  // Check llms.txt
  let hasLlmsTxt = false
  let llmsTxtContent: string | null = null
  try {
    const llmsRes = await fetch(`${baseUrl.origin}/llms.txt`, {
      signal: AbortSignal.timeout(5000),
    })
    if (llmsRes.ok) {
      hasLlmsTxt = true
      llmsTxtContent = await llmsRes.text()
    }
  } catch {}

  return {
    url,
    finalUrl: base.finalUrl,
    statusCode: base.statusCode,
    htmlContent: base.html,
    headers: base.headers,
    links: [...new Set(links)].slice(0, 200),
    internalLinks: [...new Set(internalLinks)].slice(0, 100),
    externalLinks: [...new Set(externalLinks)].slice(0, 100),
    images,
    cms: detectCMS(base.html, base.headers),
    ssl: base.finalUrl.startsWith('https://'),
    responseTimeMs: base.responseTimeMs,
    robotsTxtContent,
    sitemapContent,
    hasLlmsTxt,
    llmsTxtContent,
  }
}
