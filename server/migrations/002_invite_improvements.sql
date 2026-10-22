-- Let invitees decline, and allow only one pending invite per email per team

ALTER TABLE invites DROP CONSTRAINT IF EXISTS invites_status_check;
ALTER TABLE invites ADD CONSTRAINT invites_status_check
  CHECK (status IN ('pending', 'accepted', 'declined'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_invites_one_pending
  ON invites (team_id, email) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_invites_email ON invites (email);
