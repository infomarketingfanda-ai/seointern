import type { Finding, CategoryScore, AnalysisCategory } from '@/types'

const CATEGORY_WEIGHTS: Record<AnalysisCategory, number> = {
  technical:    25,
  content:      20,
  schema:       15,
  performance:  15,
  ai_readiness: 15,
  security:     10,
  offpage:       0, // advisory only, not scored
}

const CATEGORY_LABELS: Record<AnalysisCategory, string> = {
  technical:    'Technical SEO',
  content:      'Content Quality',
  schema:       'Schema & Structured Data',
  performance:  'Performance',
  ai_readiness: 'AI Search Readiness',
  security:     'Security & Accessibility',
  offpage:      'Off-Page Opportunities',
}

export function scoreCategory(category: AnalysisCategory, findings: Finding[]): CategoryScore {
  const scored = findings.filter(f => f.severity !== 'pass' && f.category === category)
  const passes = findings.filter(f => f.severity === 'pass' && f.category === category)
  const crits  = scored.filter(f => f.severity === 'critical').length
  const warns  = scored.filter(f => f.severity === 'warning').length
  const infos  = scored.filter(f => f.severity === 'info').length

  // Deduct points: critical = 20pts, warning = 8pts, info = 2pts
  const deductions = (crits * 20) + (warns * 8) + (infos * 2)
  const raw = Math.max(0, 100 - deductions)

  return {
    category,
    label: CATEGORY_LABELS[category],
    score: Math.round(raw),
    weight: CATEGORY_WEIGHTS[category],
    findings,
    passCount: passes.length,
    warnCount: warns,
    critCount: crits,
  }
}

export function calculateOverallScore(categories: CategoryScore[]): number {
  const scoreable = categories.filter(c => CATEGORY_WEIGHTS[c.category] > 0)
  const totalWeight = scoreable.reduce((s, c) => s + CATEGORY_WEIGHTS[c.category], 0)
  const weightedSum = scoreable.reduce((s, c) => s + (c.score * CATEGORY_WEIGHTS[c.category]), 0)
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#10B981'   // green
  if (score >= 60) return '#F59E0B'   // amber
  if (score >= 40) return '#F97316'   // orange
  return '#EF4444'                     // red
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Work'
  return 'Poor'
}

export function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#EF4444'
    case 'warning':  return '#F59E0B'
    case 'info':     return '#3B82F6'
    case 'pass':     return '#10B981'
    default:         return '#A0A0A0'
  }
}
