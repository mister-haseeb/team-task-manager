export default function Spinner({ className = '' }) {
  return (
    <div className={`flex justify-center py-10 ${className}`} role="status" aria-label="Loading">
      <span className="size-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
}
