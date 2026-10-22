import { useEffect, useState } from 'react';
import { teamsApi } from '../api/teams';

// Members of the given teams, de-duplicated and sorted by name.
export function useTeamMembers(teamIds) {
  const [members, setMembers] = useState([]);
  const key = teamIds.join(',');

  useEffect(() => {
    let cancelled = false;
    const ids = key ? key.split(',') : [];

    Promise.all(ids.map((id) => teamsApi.listMembers(id)))
      .then((lists) => {
        const byId = new Map(lists.flat().map((member) => [member.id, member]));
        const sorted = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setMembers(sorted);
      })
      .catch(() => !cancelled && setMembers([]));

    return () => {
      cancelled = true;
    };
  }, [key]);

  return members;
}
