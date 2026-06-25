import * as cheerio from 'cheerio'
import type { CrawlData, Finding } from '@/types'
import { fetchUrl } from './fetcher'

function makeId() { return Math.random().toString(36).slice(2) }

export async function analyzeTechnical(data: CrawlData): Promise<Finding[]> {
  const findings: Finding[] = []
  const $ = cheerio.load(data.htmlContent)
  const baseUrl = new URL(data.finalUrl)

  // ── 1. HTTPS Check ──────────────────────────────────
  if (!data.ssl) {
    findings.push({
      id: makeId(), category: 'technical', checkName: 'missing_https',
      severity: 'critical',
      title: 'Site is not using HTTPS',
      description: 'Your site is served over HTTP, not HTTPS.',
      affectedUrls: [data.url],
      whyItMatters: 'Google confirmed HTTPS as a ranking signal. Browsers show "Not Secure" warnings, which destroys visitor trust and tanks conversions.',
      howToFix: [
        'Log in to your hosting control panel (cPanel, Hostinger, etc.)',
        'Find the SSL/TLS section and install a free Let\'s Encrypt certificate',
        'Enable "Force HTTPS" or add a 301 redirect from HTTP to HTTPS in .htaccess',
        'Test with: https://www.ssllabs.com/ssltest/',
        'Re-scan your site to verify the fix',
      ],
      cmsGuides: {
        WordPress: ['Install "Really Simple SSL" plugin → it auto-configures HTTPS', 'Go to Settings → General → update both URLs to https://'],
        Shopify: ['Shopify provides free SSL automatically. Go to Online Store → Domains → ensure SSL is active'],
        Wix: ['Wix provides HTTPS automatically. Go to Settings → SSL Certificate → enable'],
      },
      estimatedImpact: 'high', difficulty: 'easy', timeEstimate: '15 minutes',
    })
  }

  // ── 2. Robots.txt ───────────────────────────────────
  if (!data.robotsTxtContent) {
    findings.push({
      id: makeId(), category: 'technical', checkName: 'missing_robots_txt',
      severity: 'warning',
      title: 'robots.txt file not found',
      description: 'No robots.txt file was found at /robots.txt.',
      affectedUrls: [`${baseUrl.origin}/robots.txt`],
      whyItMatters: 'robots.txt tells search engines which pages to crawl. Without it, crawlers may index pages you want private, or waste crawl budget on admin pages.',
      howToFix: [
        'Create a file named robots.txt in the root of your website',
        'Add the following minimum content:',
        'User-agent: *\nAllow: /\nSitemap: https://yourdomain.com/sitemap.xml',
        'Upload it to the root directory of your site (same level as index.html)',
        'Verify at: https://yourdomain.com/robots.txt',
      ],
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '10 minutes',
    })
  } else {
    // Check if robots.txt blocks important bots or entire site
    const robotsLower = data.robotsTxtContent.toLowerCase()
    if (robotsLower.includes('disallow: /') && !robotsLower.includes('disallow: /wp-') && !robotsLower.includes('disallow: /admin')) {
      findings.push({
        id: makeId(), category: 'technical', checkName: 'robots_blocks_all',
        severity: 'critical',
        title: 'robots.txt is blocking all search engine crawlers',
        description: 'Your robots.txt contains "Disallow: /" which blocks all search engines from indexing your site.',
        affectedUrls: [`${baseUrl.origin}/robots.txt`],
        whyItMatters: 'This single line can completely remove your site from Google, Bing, and other search engines. Your site will become invisible to organic search.',
        howToFix: [
          'Open your robots.txt file',
          'Find the line "Disallow: /"',
          'Change it to "Allow: /" or remove it entirely',
          'Save and upload the file',
          'Submit your sitemap in Google Search Console to request re-crawl',
        ],
        estimatedImpact: 'high', difficulty: 'easy', timeEstimate: '5 minutes',
      })
    }
  }

  // ── 3. Sitemap ──────────────────────────────────────
  if (!data.sitemapContent) {
    findings.push({
      id: makeId(), category: 'technical', checkName: 'missing_sitemap',
      severity: 'warning',
      title: 'No XML sitemap found',
      description: 'No sitemap.xml or sitemap_index.xml was found.',
      affectedUrls: [`${baseUrl.origin}/sitemap.xml`],
      whyItMatters: 'A sitemap helps search engines discover all your pages. Without one, some pages may never be indexed, especially on large sites.',
      howToFix: [
        'Generate a sitemap using your CMS or an online tool',
        'Upload it to your root directory as /sitemap.xml',
        'Add it to robots.txt: Sitemap: https://yourdomain.com/sitemap.xml',
        'Submit it in Google Search Console → Sitemaps',
      ],
      cmsGuides: {
        WordPress: ['Install Rank Math or Yoast SEO → they auto-generate and update your sitemap'],
        Shopify: ['Shopify auto-generates /sitemap.xml — just submit it to Google Search Console'],
        Wix: ['Wix auto-generates your sitemap. Go to Marketing Tools → Google Search Console → submit'],
      },
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '20 minutes',
    })
  }

  // ── 4. Canonical tags ───────────────────────────────
  const canonical = $('link[rel="canonical"]').attr('href')
  if (!canonical) {
    findings.push({
      id: makeId(), category: 'technical', checkName: 'missing_canonical',
      severity: 'warning',
      title: 'Missing canonical tag on homepage',
      description: 'No canonical URL is specified for the homepage.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Without canonical tags, search engines may index duplicate versions of your pages (with/without www, trailing slashes), splitting your ranking signals.',
      howToFix: [
        'Add this tag inside the <head> section of your HTML:',
        '<link rel="canonical" href="https://yourdomain.com/" />',
        'Use your absolute URL (with or without www — be consistent)',
      ],
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '15 minutes',
    })
  }

  // ── 5. Viewport meta tag ────────────────────────────
  const viewport = $('meta[name="viewport"]').attr('content')
  if (!viewport) {
    findings.push({
      id: makeId(), category: 'technical', checkName: 'missing_viewport',
      severity: 'warning',
      title: 'Missing viewport meta tag',
      description: 'The page has no viewport meta tag, which is required for mobile-friendliness.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Google uses mobile-first indexing. Without a viewport tag, your site renders like a desktop site on phones, hurting mobile rankings and UX.',
      howToFix: [
        'Add this tag inside the <head> section of every page:',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
      ],
      estimatedImpact: 'high', difficulty: 'easy', timeEstimate: '10 minutes',
    })
  }

  // ── 6. Broken internal links (sample check) ─────────
  const brokenLinks: string[] = []
  const linksToCheck = data.internalLinks.slice(0, 20) // check first 20
  await Promise.allSettled(
    linksToCheck.map(async (link) => {
      try {
        const r = await fetchUrl(link)
        if (r.statusCode === 404 || r.statusCode >= 400) brokenLinks.push(link)
      } catch {}
    })
  )
  if (brokenLinks.length > 0) {
    findings.push({
      id: makeId(), category: 'technical', checkName: 'broken_internal_links',
      severity: 'critical',
      title: `${brokenLinks.length} broken internal link(s) found`,
      description: `Found ${brokenLinks.length} internal links returning 404 or error responses.`,
      affectedUrls: brokenLinks,
      whyItMatters: 'Broken links waste crawl budget and create poor user experience. Search engines may lower your rankings if they repeatedly find dead links.',
      howToFix: [
        'Review each broken URL listed above',
        'Find the pages that link to them (use site search or your CMS link checker)',
        'Update each broken link to point to a working page',
        'If a page has been permanently moved, set up a 301 redirect',
        'If the content no longer exists, remove the link',
      ],
      estimatedImpact: 'high', difficulty: 'medium', timeEstimate: '1-2 hours',
    })
  }

  // ── 7. Slow response time ───────────────────────────
  if (data.responseTimeMs > 2000) {
    findings.push({
      id: makeId(), category: 'technical', checkName: 'slow_server_response',
      severity: data.responseTimeMs > 4000 ? 'critical' : 'warning',
      title: `Slow server response time: ${data.responseTimeMs}ms`,
      description: `Server took ${data.responseTimeMs}ms to respond. Target is under 800ms.`,
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Slow server response is a direct ranking factor. It also increases bounce rate — 40% of users leave if a page takes more than 3 seconds.',
      howToFix: [
        'Enable server-side caching (LiteSpeed Cache, W3 Total Cache)',
        'Upgrade to a faster hosting plan or a VPS',
        'Use a CDN like Cloudflare (free plan) to serve content from servers near your visitors',
        'Optimize your database queries if using WordPress/dynamic CMS',
        'Minimize server-side redirects on the homepage',
      ],
      estimatedImpact: 'high', difficulty: 'medium', timeEstimate: '1 hour',
    })
  } else {
    findings.push({
      id: makeId(), category: 'technical', checkName: 'server_response_time',
      severity: 'pass',
      title: `Good server response time: ${data.responseTimeMs}ms`,
      description: 'Server response time is within acceptable range.',
      affectedUrls: [], whyItMatters: '', howToFix: [],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
    })
  }

  // ── 8. HTTP links on HTTPS page ─────────────────────
  if (data.ssl) {
    let mixedCount = 0
    $('img[src^="http:"], script[src^="http:"], link[href^="http:"]').each(() => { mixedCount++ })
    if (mixedCount > 0) {
      findings.push({
        id: makeId(), category: 'technical', checkName: 'mixed_content',
        severity: 'warning',
        title: `Mixed content: ${mixedCount} HTTP resource(s) on HTTPS page`,
        description: `Found ${mixedCount} resources loaded over HTTP on an HTTPS page.`,
        affectedUrls: [data.finalUrl],
        whyItMatters: 'Browsers block mixed content, breaking images and scripts. This also triggers security warnings and can hurt your HTTPS ranking signal.',
        howToFix: [
          'Find all HTTP-prefixed resources in your HTML source',
          'Change each http:// to https:// (if the resource supports it)',
          'For images hosted externally, re-host them on your own HTTPS server',
          'In WordPress, use the "Better Search Replace" plugin to update URLs in the database',
        ],
        estimatedImpact: 'medium', difficulty: 'medium', timeEstimate: '30 minutes',
      })
    }
  }

  return findings
}
