const TONES = {
  error: 'bg-red-50 text-red-700 ring-red-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  info: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
};

export default function Alert({ tone = 'error', children, className = '' }) {
  if (!children) return null;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg px-3 py-2 text-sm ring-1 ${TONES[tone]} ${className}`}>
      {children}
    </div>
  );
}
