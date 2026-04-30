import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:
    'text-white border border-transparent shadow-sm active:scale-[0.98] hover:opacity-90',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-[0.98]',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-transparent active:scale-[0.98]',
  danger:
    'text-white border border-transparent shadow-sm active:scale-[0.98] hover:opacity-90',
};

const sizeClasses = {
  sm:  'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md:  'px-4 py-2   text-sm gap-2   rounded-xl',
  lg:  'px-5 py-2.5 text-sm gap-2   rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  style,
  ...props
}) {
  const gradientStyle =
    variant === 'primary'
      ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.35)', ...style }
      : variant === 'danger'
      ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 2px 8px rgba(239,68,68,0.30)', ...style }
      : style;

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={gradientStyle}
      className={clsx(
        'inline-flex items-center justify-center font-semibold',
        'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : icon ? (
        <span className="flex items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
