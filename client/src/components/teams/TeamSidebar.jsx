import Button from '../ui/Button';

function TeamButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition lg:w-full lg:shrink
        ${active ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  );
}

// Team list: horizontal scroller on small screens, sidebar on large ones.
export default function TeamSidebar({ teams, selectedTeamId, onSelect, onCreate }) {
  return (
    <aside className="lg:w-64 lg:shrink-0">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Teams</h2>
        <Button variant="ghost" className="px-2 py-1 text-indigo-600" onClick={onCreate}>
          + New team
        </Button>
      </div>

      <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 lg:flex-col lg:overflow-visible">
        <TeamButton active={!selectedTeamId} onClick={() => onSelect(null)}>
          <span className="whitespace-nowrap">All teams</span>
        </TeamButton>
        {teams.map((team) => (
          <TeamButton key={team.id} active={team.id === selectedTeamId} onClick={() => onSelect(team.id)}>
            <span className="truncate whitespace-nowrap">{team.name}</span>
            <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
              {team.role === 'owner' && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">Owner</span>}
              {team.member_count}
            </span>
          </TeamButton>
        ))}
      </nav>

      {!teams.length && <p className="px-1 text-sm text-slate-500">You're not in any team yet. Create one to get started.</p>}
    </aside>
  );
}
