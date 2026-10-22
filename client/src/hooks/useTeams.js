import { useCallback, useEffect, useState } from 'react';
import { teamsApi } from '../api/teams';

// The logged-in user's teams, plus reload() to refetch after a change.
export function useTeams() {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ teams: [], error: '', loaded: false });

  useEffect(() => {
    let cancelled = false;
    teamsApi
      .list()
      .then((teams) => !cancelled && setResult({ teams, error: '', loaded: true }))
      .catch((err) => !cancelled && setResult((prev) => ({ ...prev, error: err.message, loaded: true })));
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { teams: result.teams, error: result.error, loading: !result.loaded, reload };
}
