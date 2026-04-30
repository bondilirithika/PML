export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div
          className="w-1 h-10 rounded-full flex-shrink-0"
          style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }}
        />
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1.5 font-medium leading-snug">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
