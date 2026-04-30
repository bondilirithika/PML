import { clsx } from 'clsx';

export function Skeleton({ className }) {
  return (
    <div
      className={clsx('rounded-xl', className)}
      style={{
        background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s infinite',
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 p-6 overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-2.5 w-20 mb-3" />
          <Skeleton className="h-9 w-16 mb-3" />
          <Skeleton className="h-2 w-28" />
        </div>
        <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-1/4 ml-auto" />
        </div>
      ))}
    </div>
  );
}
