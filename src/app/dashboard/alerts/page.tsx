import { Bell, TrendingDown, Shield, Clock, Activity } from 'lucide-react'

const ALERT_TYPES = [
  { id: 'score_drop',   icon: TrendingDown, label: 'Score Drop Alert',       desc: 'Get notified when a site\'s SEO score drops by more than a set amount.', defaultOn: true  },
  { id: 'new_critical', icon: Bell,         label: 'New Critical Issue',      desc: 'Alert when a new critical-severity issue is detected in any scan.',      defaultOn: true  },
  { id: 'ssl_expiry',   icon: Shield,       label: 'SSL Expiry Warning',      desc: 'Warning 30 days before an SSL certificate expires.',                    defaultOn: true  },
  { id: 'scheduled',    icon: Clock,        label: 'Scheduled Scan Reports',  desc: 'Weekly email summary of your portfolio\'s SEO health.',                  defaultOn: false },
  { id: 'uptime',       icon: Activity,     label: 'Uptime Monitoring',       desc: 'Alert if a monitored site becomes unreachable.',                         defaultOn: false },
]

export default function AlertsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Alerts & Notifications</h1>
        <p className="text-teal-400 mt-1">Configure when and how you get notified about SEO changes.</p>
      </div>

      <div className="space-y-3">
        {ALERT_TYPES.map(({ id, icon: Icon, label, desc, defaultOn }) => (
          <div key={id} className="bg-teal-900/60 border border-teal-800/50 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-5 h-5 text-teal-400" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">{label}</div>
              <div className="text-teal-400 text-sm mt-0.5">{desc}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1 shrink-0">
              <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
              <div className="w-10 h-6 bg-teal-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="bg-teal-900/60 border border-teal-800/50 rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold">Notification Email</h2>
        <div>
          <label className="block text-teal-300 text-sm mb-2">Send alerts to</label>
          <input
            type="email"
            placeholder="your@email.com"
            className="w-full bg-teal-950/60 border border-teal-700/50 text-white placeholder-teal-600 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        <button className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
          Save Alert Settings
        </button>
      </div>
    </div>
  )
}
