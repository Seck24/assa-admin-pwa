interface KpiCardProps {
  icon: string
  label: string
  value: string | number
  sub?: string
  color?: string
}

export default function KpiCard({ icon, label, value, sub, color = 'text-white' }: KpiCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-white/30">{sub}</p>}
    </div>
  )
}
