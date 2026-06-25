import * as cheerio from 'cheerio'
import type { CrawlData, Finding, AIReadinessResult } from '@/types'

function makeId() { return Math.random().toString(36).slice(2) }

const AI_BOTS: Array<{ name: string; userAgent: string; description: string; tier: string }> = [
  { name: 'GPTBot', userAgent: 'GPTBot', description: 'OpenAI training (powers ChatGPT)', tier: 'Critical' },
  { name: 'OAI-SearchBot', userAgent: 'OAI-SearchBot', description: 'ChatGPT search results', tier: 'Critical' },
  { name: 'ChatGPT-User', userAgent: 'ChatGPT-User', description: 'Live ChatGPT browsing', tier: 'Critical' },
  { name: 'ClaudeBot', userAgent: 'ClaudeBot', description: 'Anthropic training (powers Claude)', tier: 'Critical' },
  { name: 'anthropic-ai', userAgent: 'anthropic-ai', description: 'Live Claude browsing', tier: 'Critical' },
  { name: 'Google-Extended', userAgent: 'Google-Extended', description: 'Google Gemini + AI Overviews', tier: 'Critical' },
  { name: 'PerplexityBot', userAgent: 'PerplexityBot', description: 'Perplexity AI index', tier: 'High' },
  { name: 'Bytespider', userAgent: 'Bytespider', description: 'ByteDance/TikTok AI', tier: 'High' },
  { name: 'CCBot', userAgent: 'CCBot', description: 'Common Crawl (open-source LLMs)', tier: 'High' },
  { name: 'Amazonbot', userAgent: 'Amazonbot', description: 'Amazon AI / Alexa+', tier: 'Medium' },
  { name: 'FacebookExternalHit', userAgent: 'FacebookExternalHit', description: 'Meta AI', tier: 'Medium' },
  { name: 'Applebot-Extended', userAgent: 'Applebot-Extended', description: 'Apple Intelligence / Siri', tier: 'Medium' },
]

function parseRobotsTxt(content: string): { allowedBots: Set<string>; blockedBots: Set<string> } {
  const allowedBots = new Set<string>()
  const blockedBots = new Set<string>()
  const lines = content.split('\n').map(l => l.trim())
  let currentAgent = ''

  for (const line of lines) {
    if (line.startsWith('#') || !line) continue
    const [key, ...rest] = line.split(':')
    const val = rest.join(':').trim()

    if (key.toLowerCase() === 'user-agent') {
      currentAgent = val.toLowerCase()
    } else if (key.toLowerCase() === 'disallow') {
      if (val === '/' || val === '') {
        // disallow: / = blocked, disallow: (empty) = actually allowed
        if (val === '/') blockedBots.add(currentAgent)
      }
    } else if (key.toLowerCase() === 'allow') {
      if (val === '/') allowedBots.add(currentAgent)
    }
  }

  return { allowedBots, blockedBots }
}

export function analyzeAIReadiness(data: CrawlData): { findings: Finding[]; result: AIReadinessResult } {
  const findings: Finding[] = []
  const $ = cheerio.load(data.htmlContent)

  // ── 1. Bot access check ──────────────────────────────
  const botAccess: Record<string, boolean> = {}
  const blockedCriticalBots: string[] = []

  if (data.robotsTxtContent) {
    const { blockedBots } = parseRobotsTxt(data.robotsTxtContent)

    for (const bot of AI_BOTS) {
      const isBlocked = blockedBots.has(bot.userAgent.toLowerCase()) || blockedBots.has('*')
      botAccess[bot.name] = !isBlocked
      if (isBlocked && bot.tier === 'Critical') blockedCriticalBots.push(bot.name)
    }
  } else {
    AI_BOTS.forEach(b => { botAccess[b.name] = true }) // no robots.txt = all allowed
  }

  if (blockedCriticalBots.length > 0) {
    findings.push({
      id: makeId(), category: 'ai_readiness', checkName: 'ai_bots_blocked',
      severity: 'critical',
      title: `Critical AI bots are blocked: ${blockedCriticalBots.join(', ')}`,
      description: `Your robots.txt is blocking ${blockedCriticalBots.length} critical AI crawler(s). These are the bots that power ChatGPT, Claude, Gemini, and other major AI systems.`,
      affectedUrls: [`${new URL(data.finalUrl).origin}/robots.txt`],
      whyItMatters: 'AI search engines like ChatGPT, Perplexity, and Claude are becoming major sources of website traffic. Blocking these bots means your content will never be cited in AI answers, causing you to miss a fast-growing traffic channel.',
      howToFix: [
        'Open your robots.txt file',
        'Add or modify the following rules to allow AI crawlers:',
        'User-agent: GPTBot\nAllow: /',
        'User-agent: OAI-SearchBot\nAllow: /',
        'User-agent: ClaudeBot\nAllow: /',
        'User-agent: anthropic-ai\nAllow: /',
        'User-agent: Google-Extended\nAllow: /',
        'If you have "User-agent: *\nDisallow: /" — change Disallow to Allow',
        'Save and re-upload your robots.txt file',
      ],
      estimatedImpact: 'high', difficulty: 'easy', timeEstimate: '5 minutes',
    })
  } else {
    const allowedCount = Object.values(botAccess).filter(Boolean).length
    findings.push({
      id: makeId(), category: 'ai_readiness', checkName: 'ai_bots_allowed',
      severity: 'pass',
      title: `AI crawlers allowed: ${allowedCount}/${AI_BOTS.length} bots can access your site`,
      description: 'No critical AI bots are being blocked by your robots.txt.',
      affectedUrls: [], whyItMatters: '', howToFix: [],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
    })
  }

  // ── 2. llms.txt check ───────────────────────────────
  if (!data.hasLlmsTxt) {
    findings.push({
      id: makeId(), category: 'ai_readiness', checkName: 'missing_llms_txt',
      severity: 'warning',
      title: 'Missing llms.txt file',
      description: 'No llms.txt file found. This is the emerging standard for AI-readable site indexes.',
      affectedUrls: [`${new URL(data.finalUrl).origin}/llms.txt`],
      whyItMatters: 'llms.txt is a new standard (like robots.txt for AI) that helps AI systems quickly understand what your site is about and where important content is. Early adopters gain a competitive advantage in AI search.',
      howToFix: [
        'Create a file named llms.txt in the root of your website',
        'Add the following structure (customize with your info):',
        `# ${new URL(data.finalUrl).hostname} - LLMs Context File
# This file helps AI systems understand this website

## About
[Brief description of your business/site]

## Key Pages
- Homepage: ${data.finalUrl}
- About: ${new URL(data.finalUrl).origin}/about
- Contact: ${new URL(data.finalUrl).origin}/contact

## Topics
[List the main topics your site covers]

## Do Not Train On
[Any content you want excluded from AI training]`,
        'Upload it to your root directory',
        'Verify at: https://yourdomain.com/llms.txt',
      ],
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '15 minutes',
    })
  } else {
    findings.push({
      id: makeId(), category: 'ai_readiness', checkName: 'llms_txt_found',
      severity: 'pass',
      title: 'llms.txt file found',
      description: 'Your site has an llms.txt file for AI readability.',
      affectedUrls: [], whyItMatters: '', howToFix: [],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
    })
  }

  // ── 3. Content extractability ─────────────────────────
  const hasH1        = $('h1').length > 0
  const hasMetaDesc  = !!$('meta[name="description"]').attr('content')
  const hasSchema    = $('script[type="application/ld+json"]').length > 0
  const extractScore = [hasH1, hasMetaDesc, hasSchema].filter(Boolean).length
  const extractabilityScore = Math.round((extractScore / 3) * 100)

  if (extractabilityScore < 67) {
    findings.push({
      id: makeId(), category: 'ai_readiness', checkName: 'low_content_extractability',
      severity: 'warning',
      title: `Low AI content extractability: ${extractabilityScore}%`,
      description: 'Your page is missing key elements that help AI systems understand and quote your content.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'AI systems like ChatGPT and Perplexity extract content from H1 tags, meta descriptions, and schema markup when formulating answers. Missing these means AI won\'t quote your content.',
      howToFix: [
        !hasH1 ? '→ Add an H1 heading with your main topic' : '',
        !hasMetaDesc ? '→ Add a meta description summarizing the page' : '',
        !hasSchema ? '→ Add Article or FAQ schema markup' : '',
      ].filter(Boolean),
      estimatedImpact: 'medium', difficulty: 'easy', timeEstimate: '20 minutes',
    })
  } else {
    findings.push({
      id: makeId(), category: 'ai_readiness', checkName: 'content_extractability_ok',
      severity: 'pass',
      title: `Good content extractability: ${extractabilityScore}%`,
      description: 'Page has H1, meta description, and/or schema — AI systems can extract your content.',
      affectedUrls: [], whyItMatters: '', howToFix: [],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '0',
    })
  }

  // ── 4. Descriptive anchor text ───────────────────────
  const weakAnchors: string[] = []
  const weakPhrases = ['click here', 'read more', 'learn more', 'here', 'this', 'link', 'more', 'visit']
  $('a').each((_, el) => {
    const text = $(el).text().trim().toLowerCase()
    if (weakPhrases.includes(text)) {
      const href = $(el).attr('href') || ''
      weakAnchors.push(href || text)
    }
  })

  if (weakAnchors.length > 0) {
    findings.push({
      id: makeId(), category: 'ai_readiness', checkName: 'weak_anchor_text',
      severity: 'info',
      title: `${weakAnchors.length} links use non-descriptive anchor text`,
      description: 'Links using "click here", "read more" etc. don\'t help AI systems understand where they lead.',
      affectedUrls: weakAnchors.slice(0, 5),
      whyItMatters: 'AI crawlers use anchor text to understand link relationships. Descriptive anchors ("SEO audit guide") help AI understand your content structure better than generic phrases.',
      howToFix: [
        'Replace generic anchor text with descriptive phrases:',
        '❌ <a href="/guide">Click here</a>',
        '✅ <a href="/guide">Read our complete SEO guide</a>',
        'Use your target keywords naturally in anchor text where relevant',
      ],
      estimatedImpact: 'low', difficulty: 'easy', timeEstimate: '30 minutes',
    })
  }

  // ── 5. noindex check ────────────────────────────────
  const robotsMeta = $('meta[name="robots"]').attr('content') || ''
  const isNoindex = robotsMeta.toLowerCase().includes('noindex')
  if (isNoindex) {
    findings.push({
      id: makeId(), category: 'ai_readiness', checkName: 'page_noindex',
      severity: 'critical',
      title: 'Page has noindex directive — hidden from all search engines and AI',
      description: 'A meta robots tag with "noindex" was found, preventing this page from appearing in any search results.',
      affectedUrls: [data.finalUrl],
      whyItMatters: 'noindex completely removes this page from Google, Bing, and AI search engines. Unless intentional, this is a critical error.',
      howToFix: [
        'Find: <meta name="robots" content="noindex">',
        'Remove it OR change to: <meta name="robots" content="index, follow">',
        'If you want to keep some pages hidden, ensure this is intentional for this specific page',
      ],
      estimatedImpact: 'high', difficulty: 'easy', timeEstimate: '5 minutes',
    })
  }

  // Calculate overall AI readiness score
  const score = Math.round(
    (blockedCriticalBots.length === 0 ? 40 : 0) +
    (data.hasLlmsTxt ? 20 : 0) +
    (extractabilityScore * 0.3) +
    (weakAnchors.length === 0 ? 10 : 5) +
    (!isNoindex ? 0 : -20)
  )

  const result: AIReadinessResult = {
    score: Math.min(100, Math.max(0, score)),
    botAccess,
    hasLlmsTxt: data.hasLlmsTxt,
    llmsTxtContent: data.llmsTxtContent || undefined,
    pagesBlockedFromAI: isNoindex ? [data.finalUrl] : [],
    contentExtractabilityScore: extractabilityScore,
    weakAnchorTextLinks: weakAnchors,
  }

  return { findings, result }
}
