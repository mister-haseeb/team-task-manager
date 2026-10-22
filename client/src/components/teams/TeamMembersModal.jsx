import { useEffect, useState } from 'react';
import { teamsApi } from '../../api/teams';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../ui/Modal';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Avatar from '../ui/Avatar';

// Owners add members (existing accounts) or send email invites; members can leave the team.
export default function TeamMembersModal({ team, onClose, onChanged, onLeft }) {
  const { user } = useAuth();
  const isOwner = team.role === 'owner';

  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ tone: 'error', text: '' });

  // Bumped to reload the member and invite lists
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([teamsApi.listMembers(team.id), isOwner ? teamsApi.listInvites(team.id) : []])
      .then(([memberList, inviteList]) => {
        if (cancelled) return;
        setMembers(memberList);
        setInvites(inviteList);
      })
      .catch((err) => !cancelled && setMessage({ tone: 'error', text: err.message }));
    return () => {
      cancelled = true;
    };
  }, [team.id, isOwner, version]);

  // Runs an action, reloads the lists and reports the result
  async function run(action, successText) {
    setBusy(true);
    setMessage({ tone: 'error', text: '' });
    try {
      await action();
      setVersion((v) => v + 1);
      onChanged();
      if (successText) setMessage({ tone: 'info', text: successText });
      return true;
    } catch (err) {
      setMessage({ tone: 'error', text: err.message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addMember(e) {
    e.preventDefault();
    if (await run(() => teamsApi.addMember(team.id, email), `${email} was added to the team.`)) setEmail('');
  }

  async function sendInvite() {
    if (!email) return;
    const sent = await run(
      () => teamsApi.invite(team.id, email),
      `Invite sent to ${email}. They'll see it after logging in with that email.`
    );
    if (sent) setEmail('');
  }

  async function leaveTeam() {
    setBusy(true);
    try {
      await teamsApi.removeMember(team.id, user.id);
      onLeft();
    } catch (err) {
      setMessage({ tone: 'error', text: err.message });
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`${team.name} · Members`}
      onClose={onClose}
      footer={
        <>
          {!isOwner && (
            <Button variant="danger-ghost" className="mr-auto" disabled={busy} onClick={leaveTeam}>
              Leave team
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Alert tone={message.tone}>{message.text}</Alert>

        {isOwner && (
          <form onSubmit={addMember} className="space-y-2">
            <FormField
              label="Add by email"
              type="email"
              required
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy}>
                Add member
              </Button>
              <Button variant="secondary" disabled={busy || !email} onClick={sendInvite}>
                Send email invite
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Add someone who already has an account, or invite them by email to join after signing up.
            </p>
          </form>
        )}

        <ul className="divide-y divide-slate-100">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-3 py-2.5">
              <Avatar name={member.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {member.name} {member.id === user.id && <span className="text-slate-400">(you)</span>}
                </p>
                <p className="truncate text-xs text-slate-500">{member.email}</p>
              </div>
              {member.role === 'owner' ? (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">Owner</span>
              ) : (
                isOwner && (
                  <Button
                    variant="danger-ghost"
                    className="px-2 py-1"
                    disabled={busy}
                    onClick={() => run(() => teamsApi.removeMember(team.id, member.id), `${member.name} was removed.`)}
                  >
                    Remove
                  </Button>
                )
              )}
            </li>
          ))}
        </ul>

        {invites.length > 0 && (
          <div>
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Pending invites</h3>
            <ul className="divide-y divide-slate-100">
              {invites.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate text-sm text-slate-700">{invite.email}</span>
                  <Button
                    variant="ghost"
                    className="px-2 py-1"
                    disabled={busy}
                    onClick={() => run(() => teamsApi.cancelInvite(team.id, invite.id))}
                  >
                    Cancel
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
