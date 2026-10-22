import { useId } from 'react';

const CONTROL_CLASSES =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 ' +
  'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

// Label + input/select/textarea. Pass `as="select"` or `as="textarea"` for other controls.
export default function FormField({ label, as: Control = 'input', className = '', children, ...props }) {
  const id = useId();
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <Control id={id} className={CONTROL_CLASSES} {...props}>
        {children}
      </Control>
    </div>
  );
}
