import { Inbox } from 'lucide-react';

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative mb-6">
        <div
          className="absolute inset-0 rounded-3xl opacity-30 blur-xl"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', transform: 'scale(1.3)' }}
        />
        <div
          className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.14))',
            border: '1.5px solid rgba(99,102,241,0.18)',
          }}
        >
          <div className="text-indigo-400" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon ?? <Inbox style={{ width: 28, height: 28 }} />}
          </div>
        </div>
      </div>

      <h3 className="text-base font-extrabold text-slate-800 mb-2 tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-[280px] leading-relaxed font-medium">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
