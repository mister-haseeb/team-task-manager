import { PRIORITIES, STATUSES, labelFor, daysUntil, formatDueDate, describeDueDate } from '../../utils/tasks';

const STATUS_STYLES = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-sky-100 text-sky-800',
  done: 'bg-emerald-100 text-emerald-800',
};

const PRIORITY_STYLES = {
  low: 'text-slate-500',
  medium: 'text-amber-600',
  high: 'text-red-600',
};

export function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {labelFor(STATUSES, status)}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${PRIORITY_STYLES[priority]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {labelFor(PRIORITIES, priority)}
    </span>
  );
}

// Due date, highlighted when overdue or close (unless the task is done).
export function DueDate({ date, done }) {
  if (!date) return null;
  const days = daysUntil(date);
  const tone = done ? 'text-slate-400' : days < 0 ? 'text-red-600 font-medium' : days <= 2 ? 'text-amber-700' : 'text-slate-500';

  return (
    <time dateTime={date} title={done ? undefined : describeDueDate(date)} className={`text-xs ${tone}`}>
      {formatDueDate(date)}
    </time>
  );
}
