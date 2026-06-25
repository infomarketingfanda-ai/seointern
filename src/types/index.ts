// ─── Severity ──────────────────────────────────────────────────────────────
export type Severity = 'critical' | 'warning' | 'info' | 'pass'

// ─── Findings ──────────────────────────────────────────────────────────────
export interface Finding {
  id: string
  category: AnalysisCategory
  checkName: string
  severity: Severity
  title: string
  description: string
  affectedUrls: string[]
  whyItMatters: string
  howToFix: string[]
  cmsGuides?: Record<string, string[]>  // { wordpress: [...], shopify: [...] }
  estimatedImpact: 'high' | 'medium' | 'low'
  difficulty: 'easy' | 'medium' | 'hard'
  timeEstimate: string
}

// ─── Analysis categories ────────────────────────────────────────────────────
export type AnalysisCategory =
  | 'technical'
  | 'content'
  | 'schema'
  | 'performance'
  | 'ai_readiness'
  | 'security'
  | 'offpage'

export interface CategoryScore {
  category: AnalysisCategory
  label: string
  score: number          // 0-100
  weight: number         // percentage weight in overall score
  findings: Finding[]
  passCount: number
  warnCount: number
  critCount: number
}

// ─── Site ──────────────────────────────────────────────────────────────────
export interface Site {
  id: string
  workspace_id: string
  url: string
  display_name: string
  cms_detected: string | null
  scan_frequency: 'daily' | 'weekly' | 'monthly' | 'manual'
  last_scan_at: string | null
  created_at: string
  latest_score?: number | null
  score_change?: number | null
}

// ─── Scan ──────────────────────────────────────────────────────────────────
export type ScanStatus = 'queued' | 'running' | 'complete' | 'failed'

export interface Scan {
  id: string
  site_id: string
  overall_score: number
  category_scores: Record<AnalysisCategory, number>
  status: ScanStatus
  pages_crawled: number
  started_at: string
  completed_at: string | null
  error_message?: string | null
}

export interface ScanResult extends Scan {
  categories: CategoryScore[]
  site: Site
  previous_score?: number | null
}

// ─── Performance metrics ───────────────────────────────────────────────────
export interface PerformanceMetrics {
  ttfb: number            // ms
  lcp: number             // ms
  cls: number             // score
  fid: number             // ms
  pageLoadTime: number    // ms
  htmlPayloadKb: number
  totalPageWeightKb: number
  renderBlockingCount: number
  httpRequestCount: number
  hasGzip: boolean
  hasBrotli: boolean
  hasBrowserCaching: boolean
  unoptimizedImageCount: number
}

// ─── AI Readiness ──────────────────────────────────────────────────────────
export interface AIReadinessResult {
  score: number
  botAccess: Record<string, boolean>    // botName → allowed
  hasLlmsTxt: boolean
  llmsTxtContent?: string
  pagesBlockedFromAI: string[]
  contentExtractabilityScore: number
  weakAnchorTextLinks: string[]
}

// ─── Blog topics ───────────────────────────────────────────────────────────
export type BlogTopicStatus = 'suggested' | 'planned' | 'writing' | 'published' | 'skipped'

export interface BlogTopic {
  id: string
  site_id: string
  title: string
  relevanceScore: number
  source: string
  reasoning: string
  difficulty: 'easy' | 'medium' | 'hard'
  suggestedOutline: string[]
  status: BlogTopicStatus
  created_at: string
}

// ─── Off-page opportunity ──────────────────────────────────────────────────
export type OpportunityStatus = 'todo' | 'in_progress' | 'done' | 'skipped'

export interface OffPageOpportunity {
  id: string
  platform: string
  domain: string
  domainAuthority: number
  category: 'local' | 'social' | 'directory' | 'media'
  description: string
  signupUrl: string
  steps: string[]
  aiBlurb?: string
  status: OpportunityStatus
}

// ─── User / Auth ───────────────────────────────────────────────────────────
export type UserRole = 'owner' | 'admin' | 'analyst' | 'client'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  workspace_id: string
  role: UserRole
}

export interface Workspace {
  id: string
  name: string
  owner_id: string
  plan: 'free' | 'starter' | 'pro' | 'agency' | 'enterprise'
  brand_name?: string
  brand_logo?: string
  brand_color?: string
  created_at: string
}

// ─── Alerts ────────────────────────────────────────────────────────────────
export type AlertType = 'score_drop' | 'new_critical' | 'ssl_expiry' | 'uptime' | 'scheduled'

export interface AlertConfig {
  id: string
  workspace_id: string
  site_id?: string
  type: AlertType
  enabled: boolean
  threshold?: number
  email: string
}

// ─── Copilot ───────────────────────────────────────────────────────────────
export interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalSites: number
  avgScore: number
  sitesBelowSeventy: number
  criticalIssues: number
  recentScans: Array<{
    site: Site
    scan: Scan
    scoreChange: number
  }>
}

// ─── Crawler raw data ──────────────────────────────────────────────────────
export interface CrawlData {
  url: string
  finalUrl: string
  statusCode: number
  htmlContent: string
  headers: Record<string, string>
  links: string[]
  internalLinks: string[]
  externalLinks: string[]
  images: Array<{ src: string; alt: string | null }>
  cms: string | null
  ssl: boolean
  responseTimeMs: number
  robotsTxtContent: string | null
  sitemapContent: string | null
  hasLlmsTxt: boolean
  llmsTxtContent: string | null
}
