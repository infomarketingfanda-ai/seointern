import * as cheerio from 'cheerio'
import type { CrawlData, Finding } from '@/types'

function makeId() { return Math.random().toString(36).slice(2) }

export function analyzeSecurity(data: CrawlData): Finding[] {
  const findings: Finding[] = []
  const $ = cheerio.load(data.htmlContent)
  const h = data.headers

  // ── HTTPS ─────────────────────────────────────────────
  if (!data.ssl) {
    findings.push({
      id: makeId(), category: 'security', checkName: 'no_ssl',
      severity: 'critical',
      title: 'No SSL certificate (site is not HTTPS)',
      description: 'Site is served over HTTP without encryption.',
      affectedUrls: [data.url],
      whyItMatters: 'Unencrypted connections expose users to data interception. Browsers show "Not Secure" warnings, destroying visitor trust.',
      howToFix: ['Install a free Let\'s Encrypt SSL certificate via your hosting control panel', 'Enable "Force HTTPS" redirect'],
      estimatedImpact: 'high', difficulty: 'easy', timeEstimate: '15 minutes',
    })
  } else {
    findings.push({
      id: makeId(), category: 'security', checkName: 'ssl_ok',
      severity: 'pass', title: 'SSL certificate active (HTTPS)',
      description: 'Site is secured with HTTPS encryption.',
      affectedUrls: [], whyItMatters: '', howToFix: [],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
    })
  }

  // ── Security headers ─────────────────────────────────
  const missingHeaders: string[] = []
  if (!h['strict-transport-security'])      missingHeaders.push('HSTS (Strict-Transport-Security)')
  if (!h['x-frame-options'] && !h['content-security-policy']?.includes('frame-ancestors')) missingHeaders.push('X-Frame-Options')
  if (!h['x-content-type-options'])         missingHeaders.push('X-Content-Type-Options')
  if (!h['referrer-policy'])                missingHeaders.push('Referrer-Policy')

  if (missingHeaders.length > 0) {
    findings.push({
      id: makeId(), category: 'security', checkName: 'missing_security_headers',
      severity: 'info',
      title: `Missing security headers: ${missingHeaders.join(', ')}`,
      description: `${missingHeaders.length} recommended security headers are missing.`,
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Security headers protect against clickjacking, MIME sniffing, and data leakage. They signal to users and search engines that your site takes security seriously.',
      howToFix: [
        'Add these headers in your .htaccess file (Apache) or nginx.conf:',
        'Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"',
        'Header always set X-Frame-Options "SAMEORIGIN"',
        'Header always set X-Content-Type-Options "nosniff"',
        'Header always set Referrer-Policy "strict-origin-when-cross-origin"',
        'Or use Cloudflare → Transform Rules to add headers without server access',
      ],
      estimatedImpact: 'low', difficulty: 'medium', timeEstimate: '30 minutes',
    })
  } else {
    findings.push({
      id: makeId(), category: 'security', checkName: 'security_headers_ok',
      severity: 'pass', title: 'Security headers configured',
      description: 'Key security headers are present.',
      affectedUrls: [], whyItMatters: '', howToFix: [],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
    })
  }

  // ── Accessibility: lang attribute ─────────────────────
  const langAttr = $('html').attr('lang')
  if (!langAttr) {
    findings.push({
      id: makeId(), category: 'security', checkName: 'missing_lang',
      severity: 'info',
      title: 'Missing lang attribute on <html>',
      description: 'The <html> element has no lang attribute.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'The lang attribute helps screen readers pronounce content correctly and helps browsers select the right font. It\'s required for WCAG accessibility compliance.',
      howToFix: ['Change <html> to <html lang="en"> (or your language code)', 'For multi-language: use lang="en-US", lang="es", lang="fr", etc.'],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '5 minutes',
    })
  } else {
    findings.push({
      id: makeId(), category: 'security', checkName: 'lang_ok',
      severity: 'pass', title: `Language attribute set: lang="${langAttr}"`,
      description: 'HTML lang attribute is configured for accessibility.',
      affectedUrls: [], whyItMatters: '', howToFix: [],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
    })
  }

  // ── Accessible link text ──────────────────────────────
  let emptyLinks = 0
  $('a').each((_, el) => {
    const text = $(el).text().trim()
    const ariaLabel = $(el).attr('aria-label')
    const title = $(el).attr('title')
    if (!text && !ariaLabel && !title) emptyLinks++
  })
  if (emptyLinks > 0) {
    findings.push({
      id: makeId(), category: 'security', checkName: 'empty_links',
      severity: 'warning',
      title: `${emptyLinks} links have no accessible text`,
      description: `${emptyLinks} anchor elements have no text, aria-label, or title.`,
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Empty links are inaccessible to screen readers and confuse search engines. They count against your site\'s accessibility score.',
      howToFix: [
        'Add descriptive text inside each empty <a> tag',
        'For icon-only links, add aria-label: <a href="..." aria-label="Follow us on Twitter">',
        'For image links, ensure the image has descriptive alt text',
      ],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '20 minutes',
    })
  }

  return findings
}
