import { api } from './client';

export const teamsApi = {
  list: () => api.get('/teams').then((data) => data.teams),
  get: (teamId) => api.get(`/teams/${teamId}`).then((data) => data.team),
  create: (team) => api.post('/teams', team).then((data) => data.team),
  update: (teamId, team) => api.put(`/teams/${teamId}`, team).then((data) => data.team),
  remove: (teamId) => api.delete(`/teams/${teamId}`),

  listMembers: (teamId) => api.get(`/teams/${teamId}/members`).then((data) => data.members),
  addMember: (teamId, email) => api.post(`/teams/${teamId}/members`, { email }).then((data) => data.member),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),

  listInvites: (teamId) => api.get(`/teams/${teamId}/invites`).then((data) => data.invites),
  invite: (teamId, email) => api.post(`/teams/${teamId}/invites`, { email }).then((data) => data.invite),
  cancelInvite: (teamId, inviteId) => api.delete(`/teams/${teamId}/invites/${inviteId}`),
};
