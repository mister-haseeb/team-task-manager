import { useEffect, useState } from 'react';
import { tasksApi } from '../api/tasks';

// Tasks matching `query`. Bump `refreshKey` to refetch after creating/editing a task.
// `loading` is true while the shown tasks belong to an older query.
export function useTasks(query, refreshKey = 0) {
  const key = JSON.stringify([query, refreshKey]);
  const [result, setResult] = useState({ key: null, tasks: [], error: '' });

  useEffect(() => {
    let cancelled = false;
    const [currentQuery] = JSON.parse(key);

    tasksApi
      .list(currentQuery)
      .then((tasks) => !cancelled && setResult({ key, tasks, error: '' }))
      .catch((err) => !cancelled && setResult((prev) => ({ ...prev, key, error: err.message })));

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { tasks: result.tasks, error: result.error, loading: result.key !== key, loaded: result.key !== null };
}
