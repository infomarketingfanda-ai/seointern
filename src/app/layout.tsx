import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'SEO Intern – AI-Powered SEO Audit Platform', template: '%s | SEO Intern' },
  description: 'Scan any website, score its SEO health, and get step-by-step fix instructions. No plugin required.',
  keywords: ['SEO audit', 'SEO analysis', 'AI SEO', 'website audit', 'SEO checker'],
  openGraph: {
    title: 'SEO Intern – AI-Powered SEO Audit Platform',
    description: 'Scan any website, score its SEO health, and get step-by-step fix instructions.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  )
}
