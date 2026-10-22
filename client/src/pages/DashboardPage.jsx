import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTeams } from '../hooks/useTeams';
import { useTasks } from '../hooks/useTasks';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import AppHeader from '../components/layout/AppHeader';
import TeamSidebar from '../components/teams/TeamSidebar';
import TaskFilters from '../components/tasks/TaskFilters';
import TaskList from '../components/tasks/TaskList';
import TaskModal from '../components/tasks/TaskModal';
import TeamModal from '../components/teams/TeamModal';
import TeamMembersModal from '../components/teams/TeamMembersModal';
import RemindersBanner from '../components/dashboard/RemindersBanner';
import InvitesBanner from '../components/dashboard/InvitesBanner';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';

// Dropdown filters kept in the URL (the search text is local state)
const URL_FILTER_KEYS = ['assigneeId', 'status', 'priority'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { teams, loading: teamsLoading, error: teamsError, reload: reloadTeams } = useTeams();

  // The selected team and dropdown filters live in the URL, so they survive a reload and can be shared
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilters = Object.fromEntries(URL_FILTER_KEYS.map((key) => [key, searchParams.get(key) || '']));
  const teamParam = Number(searchParams.get('team')) || null;
  // Ignore a team id the user no longer belongs to
  const selectedTeam = teams.find((team) => team.id === teamParam) || null;
  const selectedTeamId = selectedTeam?.id || null;

  // Dropdowns apply immediately; the search text waits for a pause in typing
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const filters = { ...urlFilters, search };

  // Bumped after any change made in a modal, to refetch tasks and reminders
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((key) => key + 1);

  const query = { ...urlFilters, search: debouncedSearch, teamId: selectedTeamId };
  const { tasks, error: tasksError, loading: tasksLoading, loaded: tasksLoaded } = useTasks(query, refreshKey);

  // Which modal is open: { type: 'task' | 'team' | 'members', item }
  const [modal, setModal] = useState(null);
  const closeModal = () => setModal(null);

  const visibleTeamIds = selectedTeamId ? [selectedTeamId] : teams.map((team) => team.id);
  const assignees = useTeamMembers(visibleTeamIds);

  function updateParams(changes) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        return next;
      },
      { replace: true }
    );
  }

  function changeFilters({ search: nextSearch, ...dropdowns }) {
    setSearch(nextSearch);
    updateParams(dropdowns);
  }

  // Another team's members aren't valid assignee filters, so reset that filter too
  const selectTeam = (teamId) => updateParams({ team: teamId, assigneeId: '' });

  const hasFilters = Boolean(search.trim()) || URL_FILTER_KEYS.some((key) => urlFilters[key]);

  const openTask = (task) => setModal({ type: 'task', item: task });

  function handleTaskSaved() {
    closeModal();
    refresh();
  }

  function handleTeamSaved(team) {
    closeModal();
    reloadTeams();
    selectTeam(team.id);
  }

  // After deleting or leaving the selected team, fall back to all teams
  function handleTeamGone() {
    closeModal();
    reloadTeams();
    selectTeam(null);
    refresh();
  }

  function handleMembersChanged() {
    reloadTeams(); // member counts
    refresh(); // removed members' tasks become unassigned
  }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <TeamSidebar
          teams={teams}
          selectedTeamId={selectedTeamId}
          onSelect={selectTeam}
          onCreate={() => setModal({ type: 'team', item: null })}
        />

        <section className="min-w-0 flex-1 space-y-4">
          <InvitesBanner onJoined={reloadTeams} />
          <RemindersBanner userId={user.id} refreshKey={refreshKey} onOpenTask={openTask} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-slate-900">{selectedTeam ? selectedTeam.name : 'All tasks'}</h1>
              {selectedTeam?.description && <p className="mt-1 text-sm text-slate-500">{selectedTeam.description}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {selectedTeam && (
                <>
                  <Button variant="secondary" onClick={() => setModal({ type: 'members', item: selectedTeam })}>
                    Members ({selectedTeam.member_count})
                  </Button>
                  {selectedTeam.role === 'owner' && (
                    <Button variant="secondary" onClick={() => setModal({ type: 'team', item: selectedTeam })}>
                      Edit team
                    </Button>
                  )}
                </>
              )}
              <Button disabled={!teams.length} onClick={() => openTask(null)}>
                + New task
              </Button>
            </div>
          </div>

          <TaskFilters filters={filters} onChange={changeFilters} assignees={assignees} currentUserId={user.id} />

          <Alert>{teamsError || tasksError}</Alert>

          {teamsLoading || !tasksLoaded ? (
            <Spinner />
          ) : tasks.length ? (
            <div className={tasksLoading ? 'opacity-60 transition-opacity' : undefined}>
              <TaskList tasks={tasks} showTeam={!selectedTeamId} onOpen={openTask} />
            </div>
          ) : (
            <EmptyState
              title={hasFilters ? 'No tasks match your filters' : 'No tasks yet'}
              action={
                !hasFilters &&
                !teams.length && (
                  <Button onClick={() => setModal({ type: 'team', item: null })}>Create your first team</Button>
                )
              }
            >
              {hasFilters
                ? 'Try a different search or clear some filters.'
                : teams.length
                  ? 'Create a task to get your team moving.'
                  : 'Create a team first, then add tasks to it.'}
            </EmptyState>
          )}
        </section>
      </main>

      {modal?.type === 'task' && (
        <TaskModal
          task={modal.item}
          teams={teams}
          defaultTeamId={selectedTeamId}
          onClose={closeModal}
          onSaved={handleTaskSaved}
        />
      )}
      {modal?.type === 'team' && (
        <TeamModal team={modal.item} onClose={closeModal} onSaved={handleTeamSaved} onDeleted={handleTeamGone} />
      )}
      {modal?.type === 'members' && (
        <TeamMembersModal
          team={modal.item}
          onClose={closeModal}
          onChanged={handleMembersChanged}
          onLeft={handleTeamGone}
        />
      )}
    </div>
  );
}
