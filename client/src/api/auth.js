import { api } from './client';

export const authApi = {
  me: () => api.get('/auth/me').then((data) => data.user),
  login: (credentials) => api.post('/auth/login', credentials).then((data) => data.user),
  register: (details) => api.post('/auth/register', details).then((data) => data.user),
  logout: () => api.post('/auth/logout'),
};
