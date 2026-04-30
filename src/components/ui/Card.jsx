import { clsx } from 'clsx';

const accentStyles = {
  indigo:  'border-t-[3px] border-t-indigo-500',
  emerald: 'border-t-[3px] border-t-emerald-500',
  red:     'border-t-[3px] border-t-red-500',
  amber:   'border-t-[3px] border-t-amber-500',
};

export function Card({ children, className, padding = true, hover = false, accent }) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-slate-100 overflow-hidden',
        padding && 'p-6',
        hover && 'transition-all duration-200 hover:shadow-card-lg hover:-translate-y-0.5',
        accent && accentStyles[accent],
        className
      )}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.04)' }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtitle}</p>}
      </div>
      {action && <div className="ml-4 flex-shrink-0 text-slate-400">{action}</div>}
    </div>
  );
}
