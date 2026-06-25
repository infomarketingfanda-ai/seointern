import * as cheerio from 'cheerio'
import type { CrawlData, Finding } from '@/types'

function makeId() { return Math.random().toString(36).slice(2) }

export function analyzeSchema(data: CrawlData): Finding[] {
  const findings: Finding[] = []
  const $ = cheerio.load(data.htmlContent)

  // Parse all JSON-LD scripts
  const schemas: Record<string, unknown>[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() || ''
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) schemas.push(...parsed)
      else schemas.push(parsed)
    } catch {}
  })

  if (schemas.length === 0) {
    findings.push({
      id: makeId(), category: 'schema', checkName: 'no_schema',
      severity: 'warning',
      title: 'No structured data (schema markup) found',
      description: 'No JSON-LD or microdata schema was detected on this page.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Schema markup enables rich results in Google search (star ratings, FAQs, breadcrumbs). Sites with schema get significantly higher click-through rates. It also helps AI systems like ChatGPT and Perplexity extract and cite your content accurately.',
      howToFix: [
        'Add JSON-LD schema in the <head> section of your HTML',
        'Start with Organization schema on your homepage:',
        `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Business Name",
  "url": "${data.finalUrl}",
  "logo": "https://yourdomain.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-000-0000",
    "contactType": "customer service"
  }
}
</script>`,
        'Validate with: https://search.google.com/test/rich-results',
      ],
      cmsGuides: {
        WordPress: ['Install Rank Math or Yoast SEO — they add schema automatically', 'Go to Rank Math → Schema → add your schema type'],
        Shopify: ['Install "JSON-LD for SEO" app or "Schema App" from the Shopify App Store'],
        Wix: ['Use Wix SEO → Structured Data → add your schema types'],
      },
      estimatedImpact: 'high', difficulty: 'medium', timeEstimate: '30 minutes',
    })
    return findings
  }

  // Schema types found
  const schemaTypes = schemas.map(s => (s['@type'] as string) || 'Unknown')
  findings.push({
    id: makeId(), category: 'schema', checkName: 'schema_found',
    severity: 'pass',
    title: `Schema markup found: ${schemaTypes.join(', ')}`,
    description: `${schemas.length} schema object(s) detected on this page.`,
    affectedUrls: [], whyItMatters: '', howToFix: [],
    estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
  })

  // Check for Organization on homepage
  const hasOrg = schemas.some(s => ['Organization', 'LocalBusiness', 'Corporation'].includes(s['@type'] as string))
  if (!hasOrg) {
    findings.push({
      id: makeId(), category: 'schema', checkName: 'missing_organization_schema',
      severity: 'info',
      title: 'Organization schema not found',
      description: 'No Organization or LocalBusiness schema detected. This is recommended for all business homepages.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Organization schema helps Google understand your business entity, enabling Knowledge Panel results and better brand recognition in AI search answers.',
      howToFix: [
        'Add Organization schema to your homepage',
        'Include: name, url, logo, description, contactPoint, sameAs (your social profiles)',
      ],
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '20 minutes',
    })
  }

  // Check for FAQ schema on pages that might have FAQs
  const bodyText = $('body').text().toLowerCase()
  const hasFaqContent = bodyText.includes('frequently asked') || bodyText.includes('faq') || (bodyText.match(/\bq:/g) || []).length > 2
  const hasFaqSchema = schemas.some(s => s['@type'] === 'FAQPage')
  if (hasFaqContent && !hasFaqSchema) {
    findings.push({
      id: makeId(), category: 'schema', checkName: 'missing_faq_schema',
      severity: 'warning',
      title: 'FAQ content detected but no FAQPage schema',
      description: 'This page appears to have FAQ content but lacks FAQPage schema markup.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'FAQPage schema can generate accordion-style rich results in Google, showing your Q&As directly in search and dramatically increasing visibility.',
      howToFix: [
        'Wrap your FAQ section with FAQPage JSON-LD schema',
        'Each question needs a Question and AcceptedAnswer type',
        'Validate at: https://search.google.com/test/rich-results',
      ],
      estimatedImpact: 'high', difficulty: 'medium', timeEstimate: '30 minutes',
    })
  }

  // Validate required fields on existing schemas
  schemas.forEach((schema, i) => {
    const type = schema['@type'] as string
    const missingFields: string[] = []

    if (type === 'Product') {
      if (!schema['name']) missingFields.push('name')
      if (!schema['offers']) missingFields.push('offers (price/availability)')
      if (!schema['image']) missingFields.push('image')
    }
    if (type === 'Article' || type === 'BlogPosting') {
      if (!schema['headline']) missingFields.push('headline')
      if (!schema['author']) missingFields.push('author')
      if (!schema['datePublished']) missingFields.push('datePublished')
    }
    if (type === 'LocalBusiness') {
      if (!schema['address']) missingFields.push('address')
      if (!schema['telephone']) missingFields.push('telephone')
    }

    if (missingFields.length > 0) {
      findings.push({
        id: makeId(), category: 'schema', checkName: `schema_missing_fields_${i}`,
        severity: 'warning',
        title: `${type} schema missing required fields: ${missingFields.join(', ')}`,
        description: `Your ${type} schema is present but missing recommended fields.`,
        affectedUrls: [data.finalUrl],
        whyItMatters: `Incomplete schema won't qualify for rich results. Missing fields reduce the chance of Google showing enhanced search listings.`,
        howToFix: [`Add the missing fields to your ${type} schema: ${missingFields.join(', ')}`],
        estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '15 minutes',
      })
    }
  })

  return findings
}
