import { clsx } from 'clsx';

export function Badge({ label, className, dot }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border tracking-wide',
        className
      )}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90 flex-shrink-0" />
      )}
      {label}
    </span>
  );
}
