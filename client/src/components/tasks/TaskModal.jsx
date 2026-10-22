import { useState } from 'react';
import { tasksApi } from '../../api/tasks';
import { useAuth } from '../../hooks/useAuth';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { PRIORITIES, STATUSES } from '../../utils/tasks';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const FORM_ID = 'task-form';

function initialForm(task, defaultTeamId) {
  return {
    teamId: String(task?.team_id || defaultTeamId || ''),
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.due_date || '',
    assigneeId: String(task?.assignee_id || ''),
  };
}

// Create a task (task = null) or edit/delete an existing one.
export default function TaskModal({ task, teams, defaultTeamId, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = Boolean(task);
  const [form, setForm] = useState(() => initialForm(task, defaultTeamId));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const members = useTeamMembers(form.teamId ? [form.teamId] : []);
  const canDelete = isEdit && (task.created_by === user.id || task.my_role === 'owner');

  const update = (field) => (e) => {
    const value = e.target.value;
    // Assignees belong to a team, so changing team clears the assignee
    setForm((prev) => ({ ...prev, [field]: value, ...(field === 'teamId' && { assigneeId: '' }) }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
    };
    try {
      if (isEdit) await tasksApi.update(task.id, payload);
      else await tasksApi.create({ ...payload, teamId: Number(form.teamId) });
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await tasksApi.remove(task.id);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
      setConfirmingDelete(false);
    }
  }

  const footer = (
    <>
      {canDelete && (
        <Button
          variant={confirmingDelete ? 'danger' : 'danger-ghost'}
          className="mr-auto"
          disabled={saving}
          onClick={confirmingDelete ? handleDelete : () => setConfirmingDelete(true)}
        >
          {confirmingDelete ? 'Confirm delete' : 'Delete'}
        </Button>
      )}
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" form={FORM_ID} loading={saving}>
        {isEdit ? 'Save changes' : 'Create task'}
      </Button>
    </>
  );

  return (
    <Modal title={isEdit ? 'Edit task' : 'New task'} onClose={onClose} footer={footer}>
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>

        {isEdit ? (
          <p className="text-sm text-slate-500">
            Team: <span className="font-medium text-slate-700">{task.team_name}</span> · Created by {task.creator_name}
          </p>
        ) : (
          <FormField label="Team" as="select" required value={form.teamId} onChange={update('teamId')}>
            <option value="" disabled>
              Choose a team
            </option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </FormField>
        )}

        <FormField label="Title" required maxLength={200} autoFocus value={form.title} onChange={update('title')} />
        <FormField
          label="Description"
          as="textarea"
          rows={3}
          maxLength={5000}
          placeholder="Optional details"
          value={form.description}
          onChange={update('description')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Status" as="select" value={form.status} onChange={update('status')}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </FormField>
          <FormField label="Priority" as="select" value={form.priority} onChange={update('priority')}>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </FormField>
          <FormField label="Due date" type="date" value={form.dueDate} onChange={update('dueDate')} />
          <FormField
            label="Assignee"
            as="select"
            value={form.assigneeId}
            onChange={update('assigneeId')}
            disabled={!form.teamId}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.id === user.id ? `${member.name} (me)` : member.name}
              </option>
            ))}
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
