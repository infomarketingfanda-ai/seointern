import type { BlogTopic, ScanResult } from '@/types'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

export async function generateBlogTopics(scan: ScanResult): Promise<BlogTopic[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const prompt = `You are an SEO content strategist. Analyze this website and generate 8 highly targeted blog topic suggestions.

Website: ${scan.site?.url || 'Unknown'}
CMS: ${scan.site?.cms_detected || 'Unknown'}
Overall SEO Score: ${scan.overall_score || 0}/100

Generate 8 blog topics that would attract the site's target audience and have realistic ranking potential.

Return a JSON array with exactly this structure (raw JSON only, no markdown):
[
  {
    "title": "How to [specific actionable title]",
    "relevanceScore": 85,
    "source": "Search demand / Competitor gap / Related query",
    "reasoning": "2-3 sentences explaining why this topic helps SEO",
    "difficulty": "easy",
    "suggestedOutline": ["Section 1", "Section 2", "Section 3", "Section 4", "Section 5"]
  }
]`

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.8 },
      }),
    })

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')

    const raw = JSON.parse(jsonMatch[0]) as Array<{
      title: string; relevanceScore: number; source: string
      reasoning: string; difficulty: 'easy' | 'medium' | 'hard'; suggestedOutline: string[]
    }>

    return raw.map((item, i) => ({
      id: `topic-${Date.now()}-${i}`,
      site_id: '',
      title: item.title,
      relevanceScore: item.relevanceScore,
      source: item.source,
      reasoning: item.reasoning,
      difficulty: item.difficulty,
      suggestedOutline: item.suggestedOutline,
      status: 'suggested',
      created_at: new Date().toISOString(),
    }))
  } catch (err) {
    console.error('Blog topics error:', err)
    return [{
      id: `topic-fallback-1`, site_id: '',
      title: `Complete Beginner's Guide to Your Niche`,
      relevanceScore: 75, source: 'Search demand',
      reasoning: 'Beginner guides attract high search volume and establish topical authority.',
      difficulty: 'medium',
      suggestedOutline: ['Introduction', 'Getting Started', 'Common Mistakes', 'Pro Tips', 'Next Steps'],
      status: 'suggested', created_at: new Date().toISOString(),
    }]
  }
}
