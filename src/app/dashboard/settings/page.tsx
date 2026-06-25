import { createClient } from '@/lib/supabase/server'
import { User, Building2, Palette } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*, workspaces(*)').eq('id', user!.id).single()

  const ws = (profile as Record<string, unknown>)?.workspaces as Record<string, unknown> | null

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-teal-400 mt-1">Manage your account and workspace preferences.</p>
      </div>

      {/* Profile */}
      <div className="bg-teal-900/60 border border-teal-800/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-teal-400" />
          <h2 className="text-white font-semibold">Profile</h2>
        </div>
        <div>
          <label className="block text-teal-300 text-sm mb-2">Full Name</label>
          <input defaultValue={(profile as Record<string, unknown>)?.full_name as string || ''}
            className="w-full bg-teal-950/60 border border-teal-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 transition-colors" />
        </div>
        <div>
          <label className="block text-teal-300 text-sm mb-2">Email</label>
          <input defaultValue={user?.email || ''} disabled
            className="w-full bg-teal-950/40 border border-teal-800/40 text-teal-500 rounded-xl px-4 py-3 cursor-not-allowed" />
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
          Save Profile
        </button>
      </div>

      {/* Workspace */}
      <div className="bg-teal-900/60 border border-teal-800/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-teal-400" />
          <h2 className="text-white font-semibold">Workspace</h2>
        </div>
        <div>
          <label className="block text-teal-300 text-sm mb-2">Workspace Name</label>
          <input defaultValue={ws?.name as string || ''}
            className="w-full bg-teal-950/60 border border-teal-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 transition-colors" />
        </div>
        <div>
          <label className="block text-teal-300 text-sm mb-2">Plan</label>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium capitalize">{ws?.plan as string || 'free'}</span>
            <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">Current plan</span>
          </div>
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
          Save Workspace
        </button>
      </div>

      {/* White-label */}
      <div className="bg-teal-900/60 border border-teal-800/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-teal-400" />
          <h2 className="text-white font-semibold">White-label</h2>
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 ml-auto">Agency plan</span>
        </div>
        <p className="text-teal-400 text-sm">Add your own branding to client-facing reports and portals.</p>
        <div>
          <label className="block text-teal-300 text-sm mb-2">Brand Name</label>
          <input placeholder="Your Agency Name"
            className="w-full bg-teal-950/60 border border-teal-700/50 text-white placeholder-teal-600 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 transition-colors" />
        </div>
        <div>
          <label className="block text-teal-300 text-sm mb-2">Primary Color</label>
          <div className="flex gap-3 items-center">
            <input type="color" defaultValue="#009E9E"
              className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border border-teal-700/50" />
            <input defaultValue="#009E9E" placeholder="#009E9E"
              className="flex-1 bg-teal-950/60 border border-teal-700/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 transition-colors" />
          </div>
        </div>
        <button className="bg-teal-800/60 border border-teal-700/50 text-teal-400 px-5 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed">
          Upgrade to Agency to enable
        </button>
      </div>
    </div>
  )
}
