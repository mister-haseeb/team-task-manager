import { PRIORITIES, STATUSES } from '../../utils/tasks';
import FormField from '../ui/FormField';

// Search box plus assignee/status/priority dropdowns. `filters` values are strings ('' = any).
export default function TaskFilters({ filters, onChange, assignees, currentUserId }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const others = assignees.filter((person) => person.id !== currentUserId);

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <FormField
        type="search"
        aria-label="Search tasks"
        placeholder="Search tasks…"
        value={filters.search}
        onChange={set('search')}
      />
      <FormField as="select" aria-label="Assignee" value={filters.assigneeId} onChange={set('assigneeId')}>
        <option value="">Anyone</option>
        <option value={currentUserId}>Assigned to me</option>
        {others.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </FormField>
      <FormField as="select" aria-label="Status" value={filters.status} onChange={set('status')}>
        <option value="">Any status</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </FormField>
      <FormField as="select" aria-label="Priority" value={filters.priority} onChange={set('priority')}>
        <option value="">Any priority</option>
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </FormField>
    </div>
  );
}
