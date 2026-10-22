const VARIANTS = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600',
  secondary: 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400',
  'danger-ghost': 'text-red-600 hover:bg-red-50 focus-visible:outline-red-600',
  link: 'text-indigo-600 hover:bg-indigo-50 focus-visible:outline-indigo-600',
};

export default function Button({ variant = 'primary', loading = false, className = '', children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition
        focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60
        ${VARIANTS[variant]} ${className}`}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
