import { api } from './client';

// Invites addressed to the logged-in user
export const invitesApi = {
  listMine: () => api.get('/invites').then((data) => data.invites),
  accept: (token) => api.post(`/invites/${token}/accept`),
  decline: (token) => api.post(`/invites/${token}/decline`),
};
