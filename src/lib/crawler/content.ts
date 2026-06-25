import * as cheerio from 'cheerio'
import type { CrawlData, Finding } from '@/types'

function makeId() { return Math.random().toString(36).slice(2) }

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function analyzeContent(data: CrawlData): Finding[] {
  const findings: Finding[] = []
  const $ = cheerio.load(data.htmlContent)

  // ── Title tag ────────────────────────────────────────
  const title = $('title').first().text().trim()
  if (!title) {
    findings.push({
      id: Math.random().toString(36).slice(2), category: 'content', checkName: 'missing_title',
      severity: 'critical',
      title: 'Missing title tag',
      description: 'The page has no <title> element.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Title tags are one of the most important on-page SEO elements. They appear in search results as the clickable headline and heavily influence rankings.',
      howToFix: [
        'Add a <title> tag inside the <head> section of your HTML',
        'Format: <title>Primary Keyword – Brand Name</title>',
        'Keep it between 50–60 characters',
        'Make it unique for every page',
        'Include your main target keyword near the beginning',
      ],
      estimatedImpact: 'high', difficulty: 'easy', timeEstimate: '10 minutes',
    })
  } else if (title.length > 60) {
    findings.push({
      id: makeId(), category: 'content', checkName: 'title_too_long',
      severity: 'warning',
      title: `Title tag too long: ${title.length} characters`,
      description: `Current title: "${title}" (${title.length} chars). Target: 50–60 chars.`,
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Titles over 60 characters get truncated in Google search results, hiding your message and reducing click-through rates.',
      howToFix: [
        `Shorten your current title: "${title}"`,
        'Aim for 50–60 characters',
        'Remove filler words like "Welcome to" or "The Best"',
        'Keep the most important keyword at the start',
      ],
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '5 minutes',
    })
  } else if (title.length < 20) {
    findings.push({
      id: makeId(), category: 'content', checkName: 'title_too_short',
      severity: 'warning',
      title: `Title tag too short: ${title.length} characters`,
      description: `Current title: "${title}". Too short to be descriptive.`,
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Very short titles miss the opportunity to include descriptive keywords and don\'t fully communicate the page\'s topic to search engines.',
      howToFix: [
        `Expand your title from "${title}"`,
        'Add your target keyword and brand name',
        'Format: Primary Keyword – Secondary Keyword | Brand',
        'Aim for 50–60 characters',
      ],
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '5 minutes',
    })
  } else {
    findings.push({
      id: makeId(), category: 'content', checkName: 'title_ok',
      severity: 'pass',
      title: `Good title tag: "${title}"`,
      description: `Title is ${title.length} characters — within the ideal 50–60 char range.`,
      affectedUrls: [], whyItMatters: '', howToFix: [],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
    })
  }

  // ── Meta description ─────────────────────────────────
  const metaDesc = $('meta[name="description"]').attr('content')?.trim() || ''
  if (!metaDesc) {
    findings.push({
      id: makeId(), category: 'content', checkName: 'missing_meta_description',
      severity: 'warning',
      title: 'Missing meta description',
      description: 'No meta description tag found.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'While not a direct ranking factor, meta descriptions appear as the snippet in search results. A compelling description significantly improves click-through rates.',
      howToFix: [
        'Add a meta description in the <head> section:',
        '<meta name="description" content="Your 150–160 character description here">',
        'Include your target keyword naturally',
        'Write it as a mini-ad — make people want to click',
        'Keep it between 150–160 characters',
      ],
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '10 minutes',
    })
  } else if (metaDesc.length > 160) {
    findings.push({
      id: makeId(), category: 'content', checkName: 'meta_description_too_long',
      severity: 'info',
      title: `Meta description too long: ${metaDesc.length} characters`,
      description: `Current description is ${metaDesc.length} characters. Target: 150–160 chars.`,
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Meta descriptions over 160 characters get cut off in search results with "..." which looks unprofessional.',
      howToFix: [`Shorten your meta description to 150–160 characters. Current: "${metaDesc.slice(0, 50)}..."`],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '5 minutes',
    })
  } else {
    findings.push({
      id: makeId(), category: 'content', checkName: 'meta_description_ok',
      severity: 'pass',
      title: 'Good meta description',
      description: `Meta description is ${metaDesc.length} characters.`,
      affectedUrls: [], whyItMatters: '', howToFix: [],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
    })
  }

  // ── H1 tag ───────────────────────────────────────────
  const h1s = $('h1')
  if (h1s.length === 0) {
    findings.push({
      id: makeId(), category: 'content', checkName: 'missing_h1',
      severity: 'critical',
      title: 'Missing H1 heading',
      description: 'No H1 heading found on this page.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'The H1 is the main heading of your page and a strong ranking signal. It tells search engines what the page is primarily about.',
      howToFix: [
        'Add exactly one H1 tag to your page: <h1>Your Main Keyword Here</h1>',
        'Place it as the first visible heading on the page',
        'Include your primary target keyword',
        'Do not use H1 for decorative or navigation elements',
      ],
      estimatedImpact: 'high', difficulty: 'easy', timeEstimate: '10 minutes',
    })
  } else if (h1s.length > 1) {
    findings.push({
      id: makeId(), category: 'content', checkName: 'multiple_h1',
      severity: 'warning',
      title: `Multiple H1 tags found: ${h1s.length} H1s`,
      description: `Found ${h1s.length} H1 headings. Best practice is exactly one per page.`,
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Multiple H1s confuse search engines about the primary topic of your page and dilute your keyword signal.',
      howToFix: [
        'Keep only one H1 — your main page title',
        `Current H1s found: ${h1s.toArray().map(el => $(el).text().trim()).join(' | ')}`,
        'Change the secondary H1s to H2 or H3 tags',
      ],
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '10 minutes',
    })
  } else {
    findings.push({
      id: makeId(), category: 'content', checkName: 'h1_ok',
      severity: 'pass',
      title: `Good H1: "${h1s.first().text().trim().slice(0, 60)}"`,
      description: 'Exactly one H1 found on the page.',
      affectedUrls: [], whyItMatters: '', howToFix: [],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
    })
  }

  // ── Word count / thin content ─────────────────────────
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const words = wordCount(bodyText)
  if (words < 300) {
    findings.push({
      id: makeId(), category: 'content', checkName: 'thin_content',
      severity: 'warning',
      title: `Thin content: only ${words} words`,
      description: `Page has ${words} words. Minimum recommended is 300 words.`,
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Thin content pages rank poorly. Google\'s Helpful Content Update penalizes pages that lack depth. More comprehensive content signals expertise and gets more traffic.',
      howToFix: [
        'Expand the page content to at least 300 words (600+ for competitive topics)',
        'Answer common questions your visitors might have',
        'Add an FAQ section, more product details, or explanatory copy',
        'Include your target keywords naturally in the text',
      ],
      estimatedImpact: 'medium', difficulty: 'medium', timeEstimate: '1-2 hours',
    })
  }

  // ── Image alt text ───────────────────────────────────
  const imgsWithoutAlt = data.images.filter(img => !img.alt || img.alt.trim() === '')
  if (imgsWithoutAlt.length > 0) {
    findings.push({
      id: makeId(), category: 'content', checkName: 'missing_image_alt',
      severity: 'warning',
      title: `${imgsWithoutAlt.length} image(s) missing alt text`,
      description: `${imgsWithoutAlt.length} of ${data.images.length} images have no alt attribute.`,
      affectedUrls: imgsWithoutAlt.slice(0, 5).map(i => i.src),
      whyItMatters: 'Alt text helps search engines understand images, contributes to image search rankings, and is essential for accessibility (screen readers).',
      howToFix: [
        'Add descriptive alt text to every image: <img src="..." alt="Descriptive text here">',
        'Describe what the image shows, including relevant keywords where natural',
        'For decorative images, use empty alt: alt=""',
        'Avoid "image of" or "photo of" — just describe the content',
      ],
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '30 minutes',
    })
  }

  // ── Open Graph tags ──────────────────────────────────
  const ogTitle = $('meta[property="og:title"]').attr('content')
  const ogDesc  = $('meta[property="og:description"]').attr('content')
  const ogImage = $('meta[property="og:image"]').attr('content')
  if (!ogTitle || !ogDesc || !ogImage) {
    const missing = [!ogTitle && 'og:title', !ogDesc && 'og:description', !ogImage && 'og:image'].filter(Boolean).join(', ')
    findings.push({
      id: makeId(), category: 'content', checkName: 'missing_og_tags',
      severity: 'info',
      title: `Missing Open Graph tags: ${missing}`,
      description: 'Open Graph tags control how your page appears when shared on Facebook, LinkedIn, WhatsApp.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'Without OG tags, social platforms auto-select random content from your page, often looking unprofessional. Good OG tags dramatically increase social click-through rates.',
      howToFix: [
        'Add these tags inside the <head> section:',
        '<meta property="og:title" content="Your Page Title">',
        '<meta property="og:description" content="Your compelling description">',
        '<meta property="og:image" content="https://yourdomain.com/image.jpg">',
        '<meta property="og:url" content="https://yourdomain.com/page">',
        'OG image should be 1200x630px for best results',
      ],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '15 minutes',
    })
  } else {
    findings.push({
      id: makeId(), category: 'content', checkName: 'og_tags_ok',
      severity: 'pass',
      title: 'Open Graph tags present',
      description: 'og:title, og:description, and og:image are all set.',
      affectedUrls: [], whyItMatters: '', howToFix: [],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
    })
  }

  return findings
}
