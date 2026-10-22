// Labels and helpers for task fields, shared by the list, filters and modal.

export const STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const labelFor = (options, value) => options.find((o) => o.value === value)?.label || value;

// Due dates are 'YYYY-MM-DD' strings; build local dates so nothing shifts by timezone.
function parseDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDueDate(isoDate) {
  if (!isoDate) return '';
  return parseDate(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Whole days from today until the due date (negative when overdue).
export function daysUntil(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDate(isoDate) - today) / 86_400_000);
}

export function describeDueDate(isoDate) {
  const days = daysUntil(isoDate);
  if (days < 0) return `Overdue by ${-days} day${days === -1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}
