import Avatar from '../ui/Avatar';
import { DueDate, PriorityBadge, StatusBadge } from './TaskBadges';

export default function TaskItem({ task, showTeam, onOpen }) {
  const done = task.status === 'done';

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            {task.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {showTeam && <span className="text-xs text-slate-500">{task.team_name}</span>}
            <PriorityBadge priority={task.priority} />
            <DueDate date={task.due_date} done={done} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={task.status} />
          {task.assignee_name ? (
            <Avatar name={task.assignee_name} />
          ) : (
            <span className="text-xs text-slate-400">Unassigned</span>
          )}
        </div>
      </button>
    </li>
  );
}
