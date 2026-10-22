import TaskItem from './TaskItem';

export default function TaskList({ tasks, showTeam, onOpen }) {
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} showTeam={showTeam} onOpen={onOpen} />
      ))}
    </ul>
  );
}
