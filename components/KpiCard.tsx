interface KpiCardProps {
  icon: string
  label: string
  value: string | number
  sub?: string
  color?: string
}

export default function KpiCard({ icon, label, value, sub, color = 'text-white' }: KpiCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col gap-1.5 md:gap-2">
      <div className="flex items-center gap-2">
        <span className="text-lg md:text-xl">{icon}</span>
        <p className="text-[10px] md:text-xs font-semibold text-white/40 uppercase tracking-wider leading-tight">{label}</p>
      </div>
      <p className={`text-2xl md:text-3xl font-bold ${color} leading-none`}>{value}</p>
      {sub && <p className="text-[10px] md:text-xs text-white/30">{sub}</p>}
    </div>
  )
}
