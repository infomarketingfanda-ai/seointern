import Link from 'next/link'
import {
  Search, BarChart3, Zap, Shield, Bot, Globe, ArrowRight,
  CheckCircle, Star, TrendingUp, FileText, MessageSquare, Target
} from 'lucide-react'

const FEATURES = [
  { icon: BarChart3,    title: 'Full SEO Audit',           desc: 'Technical, Content, Schema, Performance, AI Readiness & Security — all in one scan.' },
  { icon: Bot,          title: 'AI Search Readiness',       desc: 'Check if ChatGPT, Claude, Gemini & Perplexity can crawl and cite your content.' },
  { icon: Zap,          title: 'Step-by-Step Fix Guide',    desc: 'Every issue comes with numbered instructions tailored to your CMS (WordPress, Shopify, Wix…).' },
  { icon: MessageSquare,title: 'SEO Co-pilot Chat',         desc: 'Ask anything about your site. AI answers based on your actual audit data.' },
  { icon: FileText,     title: 'Blog Topic Intelligence',   desc: 'AI-powered content ideas based on your niche, existing content, and search demand.' },
  { icon: Target,       title: 'Off-Page Opportunities',    desc: 'Curated list of high-DA directories with step-by-step submission guides.' },
  { icon: TrendingUp,   title: 'Score Tracking Over Time',  desc: 'See your SEO score improve scan-by-scan. Compare before/after fixes.' },
  { icon: Globe,        title: 'Portfolio Management',      desc: 'Manage multiple sites. Spot portfolio-wide patterns and weaknesses at a glance.' },
]

const PLANS = [
  { name: 'Free',    price: 0,   sites: 1,  scans: '1/month',  features: ['Basic audit', 'Top 10 issues', 'Fix guides'], highlighted: false },
  { name: 'Starter', price: 29,  sites: 3,  scans: 'Weekly',   features: ['Full audit', 'All recommendations', 'Co-pilot', 'PDF export'], highlighted: false },
  { name: 'Pro',     price: 79,  sites: 10, scans: 'Daily',    features: ['Portfolio view', 'Blog topics', 'Alerts', 'Scan comparison'], highlighted: true },
  { name: 'Agency',  price: 199, sites: 50, scans: 'Daily',    features: ['White-label', 'Client portal', 'Team members', 'API access'], highlighted: false },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Enter any URL',          desc: 'No installation, no plugin, no login to your site. Just paste the URL.' },
  { step: '02', title: 'We scan everything',     desc: '7 analysis engines run in parallel — technical, content, AI readiness, performance, schema, security, off-page.' },
  { step: '03', title: 'Get your score + fixes', desc: 'Every issue scored by severity with step-by-step instructions to fix it.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-teal-900">SEO Intern</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-teal-600 transition-colors text-sm">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-teal-600 transition-colors text-sm">How It Works</a>
            <a href="#pricing" className="text-gray-600 hover:text-teal-600 transition-colors text-sm">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Log in</Link>
            <Link href="/auth/signup" className="bg-teal-500 hover:bg-teal-600 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-teal-900 via-teal-800 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 rounded-full px-4 py-1.5 text-sm text-teal-200 mb-6">
            <Bot className="w-3.5 h-3.5" />
            Now with AI Search Readiness — check if ChatGPT can find you
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Your Website's<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-200">SEO Intern</span>
          </h1>
          <p className="text-xl text-teal-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Enter any URL. Get a full SEO audit with scores, every issue explained, and exact step-by-step instructions to fix each one. No plugin required.
          </p>

          {/* URL input demo */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-2 flex gap-2 max-w-2xl mx-auto mb-4">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3">
              <Globe className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-400 text-sm">https://yourwebsite.com</span>
            </div>
            <Link href="/auth/signup"
              className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap">
              Run Free Audit <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-teal-300 text-sm">Free forever · No credit card · No installation</p>

          {/* Score preview */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: 'Technical SEO', score: 78, color: 'text-amber-400' },
              { label: 'AI Readiness',  score: 45, color: 'text-red-400' },
              { label: 'Content',       score: 91, color: 'text-emerald-400' },
              { label: 'Performance',   score: 63, color: 'text-amber-400' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-4 text-center">
                <div className={`text-3xl font-black ${item.color}`}>{item.score}</div>
                <div className="text-teal-200 text-xs mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────── */}
      <section className="py-10 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-8 items-center">
          {['SEO Agencies', 'Freelance Consultants', 'E-commerce Stores', 'Digital Marketing Teams', 'Website Owners'].map(t => (
            <div key={t} className="flex items-center gap-2 text-gray-500 text-sm">
              <CheckCircle className="w-4 h-4 text-teal-500" />
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-teal-900 mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg">From URL to full audit in under 2 minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} className="relative">
                <div className="text-7xl font-black text-teal-50 absolute -top-4 -left-2 select-none">{step.step}</div>
                <div className="relative pt-8">
                  <h3 className="text-xl font-bold text-teal-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-teal-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Everything You Need to Rank</h2>
            <p className="text-teal-300 text-lg">7 analysis modules. One complete picture.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center mb-4 group-hover:bg-teal-500/30 transition-colors">
                  <Icon className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-teal-300 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Readiness highlight ───────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-sm px-3 py-1 rounded-full mb-4 font-medium">
              <Star className="w-3.5 h-3.5" /> Unique Feature
            </div>
            <h2 className="text-4xl font-black text-teal-900 mb-4 leading-tight">
              Is ChatGPT finding your website?
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              AI search engines like ChatGPT, Perplexity, and Claude are becoming major traffic sources. We check if 12 AI bots can access your site, whether you have an llms.txt file, and how well AI systems can extract your content.
            </p>
            <ul className="space-y-3">
              {['GPTBot (ChatGPT)', 'ClaudeBot (Anthropic)', 'Google-Extended (Gemini)', 'PerplexityBot', '8 more AI crawlers…'].map(bot => (
                <li key={bot} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                  {bot}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-teal-900 rounded-2xl p-6 text-white">
            <div className="text-sm text-teal-400 mb-3 font-mono">AI Readiness Report</div>
            <div className="space-y-3">
              {[
                { bot: 'GPTBot', allowed: true },
                { bot: 'ClaudeBot', allowed: false },
                { bot: 'Google-Extended', allowed: true },
                { bot: 'PerplexityBot', allowed: false },
                { bot: 'OAI-SearchBot', allowed: true },
              ].map(({ bot, allowed }) => (
                <div key={bot} className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-teal-200 text-sm">{bot}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${allowed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {allowed ? '✓ Allowed' : '✗ Blocked'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-xs">⚠ 2 critical AI bots are blocked. Your site won't be cited in ChatGPT answers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-teal-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-500 text-lg">Start free. Scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name}
                className={`rounded-2xl p-6 border-2 ${plan.highlighted
                  ? 'bg-teal-900 border-teal-500 text-white'
                  : 'bg-white border-gray-200 text-gray-900'}`}>
                {plan.highlighted && (
                  <div className="text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full inline-block mb-3 font-medium">Most Popular</div>
                )}
                <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-teal-900'}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black">${plan.price}</span>
                  {plan.price > 0 && <span className={plan.highlighted ? 'text-teal-300' : 'text-gray-400'}>/mo</span>}
                </div>
                <div className={`text-sm mb-4 ${plan.highlighted ? 'text-teal-300' : 'text-gray-500'}`}>
                  {plan.sites} site{plan.sites > 1 ? 's' : ''} · {plan.scans} scans
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlighted ? 'text-teal-200' : 'text-gray-600'}`}>
                      <CheckCircle className={`w-4 h-4 shrink-0 ${plan.highlighted ? 'text-teal-400' : 'text-teal-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup"
                  className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${plan.highlighted
                    ? 'bg-teal-500 hover:bg-teal-400 text-white'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-700'}`}>
                  {plan.price === 0 ? 'Start Free' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-teal-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4">Ready to Rank Higher?</h2>
          <p className="text-teal-300 text-lg mb-8">Join thousands of businesses using SEO Intern to find and fix SEO issues.</p>
          <Link href="/auth/signup"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-colors">
            Start Your Free Audit <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-teal-400 text-sm mt-4">Free forever · No credit card required</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="bg-teal-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center">
              <Search className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">SEO Intern</span>
          </div>
          <p className="text-teal-600 text-sm">© {new Date().getFullYear()} SEO Intern. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="text-teal-600 hover:text-teal-400 text-sm transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
