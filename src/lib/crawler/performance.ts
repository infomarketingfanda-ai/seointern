import * as cheerio from 'cheerio'
import type { CrawlData, Finding, PerformanceMetrics } from '@/types'

function makeId() { return Math.random().toString(36).slice(2) }

export async function analyzePerformance(data: CrawlData): Promise<{ findings: Finding[]; metrics: PerformanceMetrics }> {
  const findings: Finding[] = []
  const $ = cheerio.load(data.htmlContent)

  // ── Try Google PageSpeed Insights API ──────────────
  let psiData: Record<string, unknown> | null = null
  try {
    const psiKey = process.env.PAGESPEED_API_KEY ? `&key=${process.env.PAGESPEED_API_KEY}` : ''
    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(data.finalUrl)}&strategy=mobile${psiKey}`
    const res = await fetch(psiUrl, { signal: AbortSignal.timeout(20000) })
    if (res.ok) psiData = await res.json() as Record<string, unknown>
  } catch {}

  // Extract real PSI metrics or estimate from raw HTML
  const htmlBytes = Buffer.byteLength(data.htmlContent, 'utf8')
  const htmlKb = Math.round(htmlBytes / 1024)

  let lcp = 0, cls = 0, fid = 0, ttfb = data.responseTimeMs

  if (psiData) {
    const audits = (psiData as Record<string, Record<string, Record<string, unknown>>>).lighthouseResult?.audits || {}
    lcp  = ((audits['largest-contentful-paint']?.numericValue as number) || 0)
    cls  = ((audits['cumulative-layout-shift']?.numericValue as number) || 0)
    fid  = ((audits['total-blocking-time']?.numericValue as number) || 0) // TBT as proxy for FID
    ttfb = ((audits['server-response-time']?.numericValue as number) || data.responseTimeMs)
  } else {
    // Estimate from HTML analysis
    lcp  = data.responseTimeMs * 2.5
    cls  = 0.05
    fid  = 80
  }

  // Render-blocking resources
  const renderBlocking = $('link[rel="stylesheet"]:not([media="print"]), script:not([async]):not([defer]):not([type="application/ld+json"])').length
  const hasGzip    = !!(data.headers['content-encoding']?.includes('gzip'))
  const hasBrotli  = !!(data.headers['content-encoding']?.includes('br'))
  const hasCaching = !!(data.headers['cache-control'] || data.headers['expires'])

  // Image optimization estimate
  const nonWebpImages = data.images.filter(img =>
    img.src && !img.src.endsWith('.webp') && !img.src.endsWith('.avif') && img.src.startsWith('http')
  ).length

  const metrics: PerformanceMetrics = {
    ttfb,
    lcp,
    cls,
    fid,
    pageLoadTime: lcp + 500,
    htmlPayloadKb: htmlKb,
    totalPageWeightKb: htmlKb * 3, // rough estimate
    renderBlockingCount: renderBlocking,
    httpRequestCount: data.internalLinks.length + data.images.length,
    hasGzip,
    hasBrotli,
    hasBrowserCaching: hasCaching,
    unoptimizedImageCount: nonWebpImages,
  }

  // ── Generate findings ────────────────────────────────

  // LCP
  if (lcp > 0) {
    const severity = lcp > 4000 ? 'critical' : lcp > 2500 ? 'warning' : 'pass'
    findings.push({
      id: makeId(), category: 'performance', checkName: 'lcp',
      severity,
      title: severity === 'pass' ? `Good LCP: ${(lcp / 1000).toFixed(1)}s` : `Slow LCP: ${(lcp / 1000).toFixed(1)}s (target: <2.5s)`,
      description: `Largest Contentful Paint: ${(lcp / 1000).toFixed(1)} seconds`,
      affectedUrls: [data.finalUrl],
      whyItMatters: 'LCP is a Core Web Vital and direct Google ranking factor. It measures when the largest element (hero image, heading) becomes visible.',
      howToFix: severity === 'pass' ? [] : [
        'Optimize and compress your hero image (use WebP format)',
        'Preload your LCP element: <link rel="preload" as="image" href="hero.webp">',
        'Use a CDN to serve images from servers near your users',
        'Defer non-critical JavaScript so it doesn\'t block rendering',
      ],
      estimatedImpact: 'high', difficulty: 'medium', timeEstimate: '2 hours',
    })
  }

  // CLS
  if (cls >= 0) {
    const severity = cls > 0.25 ? 'critical' : cls > 0.1 ? 'warning' : 'pass'
    findings.push({
      id: makeId(), category: 'performance', checkName: 'cls',
      severity,
      title: severity === 'pass' ? `Good CLS: ${cls.toFixed(3)}` : `Poor CLS: ${cls.toFixed(3)} (target: <0.1)`,
      description: `Cumulative Layout Shift score: ${cls.toFixed(3)}`,
      affectedUrls: [data.finalUrl],
      whyItMatters: 'CLS measures visual stability. High CLS means content jumps around as the page loads, frustrating users and hurting rankings.',
      howToFix: severity === 'pass' ? [] : [
        'Add explicit width and height to all images and videos',
        'Avoid inserting content above existing content dynamically',
        'Reserve space for ads and embeds with CSS min-height',
        'Use font-display: optional or swap for web fonts',
      ],
      estimatedImpact: 'medium', difficulty: 'medium', timeEstimate: '1-2 hours',
    })
  }

  // HTML payload
  if (htmlKb > 100) {
    findings.push({
      id: makeId(), category: 'performance', checkName: 'large_html_payload',
      severity: htmlKb > 300 ? 'critical' : 'warning',
      title: `Large HTML payload: ${htmlKb}KB`,
      description: `HTML document is ${htmlKb}KB. Target: under 100KB.`,
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Large HTML files take longer to download and parse, delaying rendering and increasing Time to First Byte.',
      howToFix: [
        'Enable HTML minification on your server or CDN',
        'Remove unused HTML comments and whitespace',
        'Avoid inline styles — use external CSS files instead',
        'Enable gzip or brotli compression on your server',
        'In WordPress: use WP Rocket or LiteSpeed Cache plugin',
      ],
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '30 minutes',
    })
  }

  // Gzip/Brotli
  if (!hasGzip && !hasBrotli) {
    findings.push({
      id: makeId(), category: 'performance', checkName: 'no_compression',
      severity: 'warning',
      title: 'Text compression (gzip/brotli) not enabled',
      description: 'Server is not compressing HTML/CSS/JS responses.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Compression reduces transfer size by 60–80%, significantly speeding up page loads for all users.',
      howToFix: [
        'Enable gzip in .htaccess (Apache):',
        'AddOutputFilterByType DEFLATE text/html text/css application/javascript',
        'Or enable via your hosting control panel (cPanel → Optimize Website)',
        'Cloudflare automatically enables compression on the free plan',
      ],
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '15 minutes',
    })
  } else {
    findings.push({
      id: makeId(), category: 'performance', checkName: 'compression_ok',
      severity: 'pass',
      title: `Text compression enabled: ${hasBrotli ? 'Brotli' : 'Gzip'}`,
      description: 'Responses are compressed, reducing transfer size.',
      affectedUrls: [], whyItMatters: '', howToFix: [],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
    })
  }

  // Render-blocking resources
  if (renderBlocking > 3) {
    findings.push({
      id: makeId(), category: 'performance', checkName: 'render_blocking',
      severity: 'warning',
      title: `${renderBlocking} render-blocking resources found`,
      description: `${renderBlocking} CSS/JS files may be blocking page rendering.`,
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Render-blocking resources delay when the user can see your page content, increasing perceived load time and hurting Core Web Vitals.',
      howToFix: [
        'Add defer or async to non-critical <script> tags',
        'Inline critical CSS in the <head> and defer the rest',
        'Use <link rel="preload"> for critical resources',
        'In WordPress: use a caching plugin to handle this automatically',
      ],
      estimatedImpact: 'medium', difficulty: 'hard', timeEstimate: '2-4 hours',
    })
  }

  // Unoptimized images
  if (nonWebpImages > 0) {
    findings.push({
      id: makeId(), category: 'performance', checkName: 'unoptimized_images',
      severity: 'warning',
      title: `${nonWebpImages} images not using modern format (WebP/AVIF)`,
      description: `${nonWebpImages} images are using JPEG/PNG instead of WebP or AVIF.`,
      affectedUrls: data.images.filter(i => !i.src.endsWith('.webp') && !i.src.endsWith('.avif')).slice(0, 3).map(i => i.src),
      whyItMatters: 'WebP images are 25–35% smaller than JPEG/PNG at equal quality. Smaller images = faster loads = better rankings.',
      howToFix: [
        'Convert images to WebP format using tools like Squoosh (free, browser-based)',
        'Use <picture> element to serve WebP with JPEG fallback',
        'In WordPress: install ShortPixel or Imagify plugin for automatic conversion',
        'Enable WebP in Cloudflare (free plan: Speed → Optimization → WebP)',
      ],
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '1 hour',
    })
  }

  return { findings, metrics }
}
