const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export default function Avatar({ name, className = '' }) {
  return (
    <span
      title={name}
      className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 ${className}`}
    >
      {initials(name)}
    </span>
  );
}
