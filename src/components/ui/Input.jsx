import { clsx } from 'clsx';

export function Input({ label, error, hint, leftIcon, className, id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-600 mb-1.5 tracking-wide uppercase"
        >
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={clsx(
            'w-full rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-white',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            error
              ? 'border-red-300 focus:ring-red-400/20 focus:border-red-400'
              : 'border-slate-200 hover:border-slate-300',
            leftIcon ? 'pl-10 pr-3.5 py-2.5' : 'px-3.5 py-2.5',
            className
          )}
          style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
          {...props}
        />
      </div>
      {error  && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
