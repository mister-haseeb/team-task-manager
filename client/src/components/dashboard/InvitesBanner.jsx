import { useEffect, useState } from 'react';
import { invitesApi } from '../../api/invites';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

// Pending invites to join other people's teams.
export default function InvitesBanner({ onJoined }) {
  const [invites, setInvites] = useState([]);
  const [busyToken, setBusyToken] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    invitesApi
      .listMine()
      .then(setInvites)
      .catch(() => setInvites([]));
  }, []);

  async function respond(invite, accept) {
    setBusyToken(invite.token);
    setError('');
    try {
      if (accept) {
        await invitesApi.accept(invite.token);
        onJoined(invite.team_id);
      } else {
        await invitesApi.decline(invite.token);
      }
      setInvites((current) => current.filter((i) => i.token !== invite.token));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyToken(null);
    }
  }

  if (!invites.length) return null;

  return (
    <section className="space-y-2 rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-200" aria-label="Team invites">
      <Alert>{error}</Alert>
      {invites.map((invite) => (
        <div key={invite.token} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-indigo-900">
            <span className="font-medium">{invite.invited_by_name}</span> invited you to join{' '}
            <span className="font-medium">{invite.team_name}</span>
          </p>
          <div className="flex gap-2">
            <Button loading={busyToken === invite.token} onClick={() => respond(invite, true)}>
              Join team
            </Button>
            <Button variant="secondary" disabled={busyToken === invite.token} onClick={() => respond(invite, false)}>
              Decline
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}
