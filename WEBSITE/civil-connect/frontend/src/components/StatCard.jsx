import { useAnimatedCounter } from '../hooks/useSocket';

const colors = {
  navy:    'bg-navy/10 text-navy',
  green:   'bg-green-gov/10 text-green-gov',
  saffron: 'bg-saffron/10 text-saffron-dark',
  red:     'bg-danger/10 text-danger',
  purple:  'bg-purple/10 text-purple',
  cyan:    'bg-cyan-600/10 text-cyan-700',
};

export default function StatCard({ icon, value, label, color = 'navy' }) {
  const n = useAnimatedCounter(value);
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${colors[color] || colors.navy}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold anim-count">{n}</div>
        <div className="text-xs text-text-secondary mt-0.5">{label}</div>
      </div>
    </div>
  );
}
