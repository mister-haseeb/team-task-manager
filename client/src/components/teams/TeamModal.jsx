import { useState } from 'react';
import { teamsApi } from '../../api/teams';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const FORM_ID = 'team-form';

// Create a team (team = null) or, for its owner, edit/delete it.
export default function TeamModal({ team, onClose, onSaved, onDeleted }) {
  const isEdit = Boolean(team);
  const [form, setForm] = useState({ name: team?.name || '', description: team?.description || '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const saved = isEdit ? await teamsApi.update(team.id, form) : await teamsApi.create(form);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await teamsApi.remove(team.id);
      onDeleted();
    } catch (err) {
      setError(err.message);
      setSaving(false);
      setConfirmingDelete(false);
    }
  }

  const footer = (
    <>
      {isEdit && (
        <Button
          variant={confirmingDelete ? 'danger' : 'danger-ghost'}
          className="mr-auto"
          disabled={saving}
          onClick={confirmingDelete ? handleDelete : () => setConfirmingDelete(true)}
        >
          {confirmingDelete ? 'Delete team and its tasks' : 'Delete team'}
        </Button>
      )}
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" form={FORM_ID} loading={saving}>
        {isEdit ? 'Save changes' : 'Create team'}
      </Button>
    </>
  );

  return (
    <Modal title={isEdit ? 'Edit team' : 'New team'} onClose={onClose} footer={footer}>
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <FormField
          label="Team name"
          required
          minLength={2}
          maxLength={100}
          autoFocus
          value={form.name}
          onChange={update('name')}
        />
        <FormField
          label="Description"
          as="textarea"
          rows={3}
          maxLength={1000}
          placeholder="What is this team working on?"
          value={form.description}
          onChange={update('description')}
        />
      </form>
    </Modal>
  );
}
