import { useEffect, useState } from 'react';
import { tasksApi } from '../../api/tasks';
import { describeDueDate } from '../../utils/tasks';

const dismissedKey = (userId) => `reminders-dismissed-${userId}`;

function wasDismissed(userId) {
  try {
    return sessionStorage.getItem(dismissedKey(userId)) === '1';
  } catch {
    return false;
  }
}

// Due-date reminders, shown once per login (dismissing hides them until the next login).
export default function RemindersBanner({ userId, refreshKey, onOpenTask }) {
  const [tasks, setTasks] = useState([]);
  const [dismissed, setDismissed] = useState(() => wasDismissed(userId));

  useEffect(() => {
    if (dismissed) return;
    tasksApi
      .reminders()
      .then(setTasks)
      .catch(() => setTasks([]));
  }, [dismissed, refreshKey]);

  function dismiss() {
    try {
      sessionStorage.setItem(dismissedKey(userId), '1');
    } catch {
      // storage unavailable: just hide for now
    }
    setDismissed(true);
  }

  if (dismissed || !tasks.length) return null;

  return (
    <section className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200" aria-label="Due date reminders">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-amber-900">
            {tasks.length === 1 ? '1 task needs' : `${tasks.length} tasks need`} your attention
          </h2>
          <ul className="mt-2 space-y-1">
            {tasks.map((task) => (
              <li key={task.id} className="text-sm text-amber-900">
                <button type="button" className="font-medium hover:underline" onClick={() => onOpenTask(task)}>
                  {task.title}
                </button>{' '}
                <span className="text-amber-700">
                  · {describeDueDate(task.due_date)} · {task.team_name}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={dismiss} className="text-sm text-amber-700 hover:text-amber-900">
          Dismiss
        </button>
      </div>
    </section>
  );
}
