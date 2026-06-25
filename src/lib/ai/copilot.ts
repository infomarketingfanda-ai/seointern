import type { ScanResult, CopilotMessage } from '@/types'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent'

function buildSystemPrompt(scan: ScanResult): string {
  const topIssues = scan.categories
    ? scan.categories.flatMap(c => c.findings)
        .filter(f => f.severity === 'critical' || f.severity === 'warning')
        .slice(0, 10)
        .map(f => `- [${f.severity.toUpperCase()}] ${f.title}`)
        .join('\n')
    : 'No scan data available yet.'

  const scores = scan.category_scores
    ? Object.entries(scan.category_scores).map(([k, v]) => `${k}: ${v}/100`).join(', ')
    : 'Not yet scanned'

  return `You are the SEO Intern Co-pilot, an expert SEO assistant. You have full access to the latest audit data for ${scan.site?.url || 'this website'}.

SITE OVERVIEW:
- URL: ${scan.site?.url || 'Unknown'}
- CMS: ${scan.site?.cms_detected || 'Unknown'}
- Overall SEO Score: ${scan.overall_score || 0}/100
- Category Scores: ${scores}

TOP ISSUES FOUND:
${topIssues}

YOUR ROLE:
- Answer questions about this specific site's SEO data
- Prioritize fixes by impact
- Give CMS-specific instructions when asked (detected CMS: ${scan.site?.cms_detected || 'Unknown'})
- Be concise, actionable, and use simple language
- Reference specific findings from the audit when relevant
- Format step-by-step instructions clearly

TONE: Friendly, expert, like a knowledgeable colleague.`
}

export async function* streamCopilotResponse(
  userMessage: string,
  history: CopilotMessage[],
  scan: ScanResult
): AsyncGenerator<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    yield 'AI Co-pilot is not configured. Please add your GEMINI_API_KEY environment variable.'
    return
  }

  const systemPrompt = buildSystemPrompt(scan)

  // Build conversation history for Gemini
  const contents = [
    // System prompt as first user turn (Gemini doesn't have a system role in this API)
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Understood! I have full context of this site\'s SEO audit. How can I help you?' }] },
    // Previous messages
    ...history.slice(-10).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
    // Current message
    { role: 'user', parts: [{ text: userMessage }] },
  ]

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}&alt=sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    }),
  })

  if (!res.ok) {
    yield `Error: ${res.status} - ${await res.text()}`
    return
  }

  const reader = res.body?.getReader()
  const decoder = new TextDecoder()

  while (reader) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
    for (const line of lines) {
      try {
        const json = JSON.parse(line.slice(6))
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) yield text
      } catch {}
    }
  }
}
